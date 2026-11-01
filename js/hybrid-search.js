// Hybrid search: BM25 keyword scoring over the index built by
// _plugins/keyword_search_index.rb, fused with semantic (embedding) scores.
// No DOM access here, so it can be tested on its own.
//
// Both signals are normalised to [0, 1] before they are combined:
//
//   keyword  = max(BM25(q, d) / max BM25 attainable for q, title coverage)
//              where the maximum is Σ idf(t)·(k1 + 1) over the query terms, the
//              BM25 limit as term frequency grows, and title coverage is the
//              share of the query's idf found in the title. 1 means every query
//              term matched as strongly as possible; it is not rescaled per
//              query, so a weak best match stays weak.
//   semantic = (cosine − floor) / (ceiling − floor), clamped to [0, 1]
//              where floor is the semantic min_score (noise level) and ceiling
//              is the cosine treated as a perfect match.
//
//   final    = (1 − weight)·semantic + weight·keyword
//
// A document is shown if it passes either threshold: cosine ≥ floor, or
// keyword ≥ the keyword min_score.

// Near matches are discounted against exact (stemmed) matches.
const PREFIX_FACTOR = 0.8; // "kube" → "kubernetes", for words still being typed
const TYPO_FACTOR = 0.7;   // one edit away, for words of 5+ letters
const MIN_PREFIX_LENGTH = 3;
const MIN_TYPO_LENGTH = 5;

// Must stay in sync with KeywordSearch.stem in _plugins/keyword_search_index.rb.
// Two steps, so inflections of one word share a stem ("achieves" and "achieve"
// both become "achiev"): drop a plural, then -ing / -ed / -e.
export function stem(word) {
    if (word.length > 4 && word.endsWith('ies')) word = word.slice(0, -3) + 'y';
    else if (word.length > 4 && word.endsWith('sses')) word = word.slice(0, -2);
    else if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) word = word.slice(0, -1);

    if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
    if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith('e')) return word.slice(0, -1);
    return word;
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u30FC]+/u;
const CJK_SPLIT = new RegExp(`(${CJK.source})`, 'u');
const CJK_ONLY = new RegExp(`^${CJK.source}$`, 'u');

// Must stay in sync with KeywordSearch.tokenize in _plugins/keyword_search_index.rb.
// Words are runs of letters, marks and digits in any script, lower-cased with
// Latin/Greek/Cyrillic accents removed. Chinese and Japanese have no spaces
// between words, so runs of those scripts become overlapping character pairs.
// Lengths are counted in code points, as Ruby does.
export function tokenize(text, stopwords) {
    const words = text.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036F]/g, '')
        .normalize('NFC').replace(/ς/g, 'σ')
        .match(/[\p{L}\p{M}\p{N}]+/gu) || [];
    return words.flatMap(word => word.split(CJK_SPLIT).filter(Boolean).flatMap(part => {
        const chars = [...part];
        if (CJK_ONLY.test(part)) {
            return chars.length === 1 ? [part] : chars.slice(1).map((c, i) => chars[i] + c);
        }
        return chars.length < 2 || stopwords.has(part) ? [] : [stem(part)];
    }));
}

// True if a and b differ by exactly one insertion, deletion or substitution.
function oneEditApart(a, b) {
    if (Math.abs(a.length - b.length) > 1 || a === b) return false;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

export function createKeywordSearcher(index) {
    const { k1, b } = index.params;
    const stopwords = new Set(index.stopwords);
    const N = index.docs.length;
    const vocabulary = Object.keys(index.terms);
    const lengthNorm = index.docs.map(d => k1 * (1 - b + b * d.len / index.avgdl));
    const idf = df => Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const df = term => index.terms[term].length / 2;

    // Index terms matching a query term, each with its discount factor.
    function variants(term) {
        if (index.terms[term]) return [[term, 1]];
        const found = [];
        for (const v of vocabulary) {
            if (term.length >= MIN_PREFIX_LENGTH && v.startsWith(term)) found.push([v, PREFIX_FACTOR]);
            else if (term.length >= MIN_TYPO_LENGTH && oneEditApart(term, v)) found.push([v, TYPO_FACTOR]);
        }
        return found;
    }

    const titleTerms = index.docs.map(d => new Set(tokenize(d.title, stopwords)));

    // Returns Map(doc index → keyword score in [0, 1]): the larger of
    //  - BM25 over title + body, divided by the maximum attainable for the query;
    //  - title coverage: the share of the query's idf found in the title. BM25
    //    length normalisation buries short titles in long documents (a page
    //    titled "History" that is a long changelog), so titles are scored as a
    //    field of their own too.
    function search(query) {
        const terms = [...new Set(tokenize(query, stopwords))];
        const bm25 = new Map(), title = new Map();
        if (terms.length === 0) return bm25;

        let maxBm25 = 0, maxTitle = 0;
        for (const term of terms) {
            const matches = variants(term);
            // A term found nowhere still counts towards the maximum, with the
            // idf of a term in no document, so unmatched words lower the score.
            const refIdf = matches.length ? Math.max(...matches.map(([v]) => idf(df(v)))) : idf(0);
            maxBm25 += refIdf * (k1 + 1);
            maxTitle += refIdf;

            // Per document, take the best variant so near matches don't stack.
            const best = new Map(), bestTitle = new Map();
            for (const [v, factor] of matches) {
                const w = factor * idf(df(v));
                const postings = index.terms[v];
                for (let i = 0; i < postings.length; i += 2) {
                    const doc = postings[i], tf = postings[i + 1];
                    const s = w * tf * (k1 + 1) / (tf + lengthNorm[doc]);
                    if (s > (best.get(doc) ?? 0)) best.set(doc, s);
                    if (titleTerms[doc].has(v) && w > (bestTitle.get(doc) ?? 0)) bestTitle.set(doc, w);
                }
            }
            for (const [doc, s] of best) bm25.set(doc, (bm25.get(doc) ?? 0) + s);
            for (const [doc, w] of bestTitle) title.set(doc, (title.get(doc) ?? 0) + w);
        }
        for (const [doc, s] of bm25) bm25.set(doc, Math.max(s / maxBm25, (title.get(doc) ?? 0) / maxTitle));
        return bm25;
    }

    return { search };
}

// semanticHits: [{ url, title, score }] (cosine, from SemanticSearch.search).
// keywordScores: Map(doc index → normalised BM25), from createKeywordSearcher.
export function fuse({ index, semanticHits, keywordScores, semanticFloor, limit = 8 }) {
    const { weight, min_score: keywordMin, semantic_ceiling: ceiling } = index.params;
    const results = new Map();
    const entry = (url, title) => {
        if (!results.has(url)) results.set(url, { url, title, semantic: 0, keyword: 0, cosine: null, shown: false });
        return results.get(url);
    };

    for (const hit of semanticHits) {
        const r = entry(hit.url, hit.title);
        r.cosine = hit.score;
        const span = ceiling - semanticFloor; // guard a ceiling configured at or below the floor
        r.semantic = span > 0
            ? Math.min(1, Math.max(0, (hit.score - semanticFloor) / span))
            : (hit.score >= semanticFloor ? 1 : 0);
        r.shown ||= hit.score >= semanticFloor;
    }
    for (const [i, score] of keywordScores) {
        const doc = index.docs[i];
        const r = entry(doc.url, doc.title);
        r.keyword = score;
        r.shown ||= score >= keywordMin;
    }

    return [...results.values()]
        .filter(r => r.shown)
        .map(r => ({ ...r, score: (1 - weight) * r.semantic + weight * r.keyword }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
