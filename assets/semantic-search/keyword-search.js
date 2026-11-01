// BM25 keyword search over the passages stored in the search index, used next
// to the embeddings to catch exact and near word matches they miss: names,
// jargon, rare words and short queries.
//
// Near matches come from three steps, applied to passages and queries alike:
// accents are folded in Latin script ("café" → "cafe"), English words are
// reduced to their Porter stem ("tomatoes" → "tomato"), and with typo
// tolerance a query word missing from the index matches words one edit away.

export const KEYWORD_DEFAULTS = Object.freeze({
  enabled: false,
  weight: 0.3,
  min_score: 0.5,
  stemming: true,
  typo_tolerance: true,
  k1: 1.2,
  b: 0.75,
});

// A typo match counts for this share of an exact match.
export const TYPO_FACTOR = 0.8;
// Shorter words are too easy to confuse with other words ("form" / "from").
export const TYPO_MIN_LENGTH = 5;

// Lowercase words of letters, combining marks and digits, in any script.
// Combining marks are part of words in scripts such as Bengali and Devanagari.
export function tokenize(text) {
  const folded = String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC");
  return folded.match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
}

// --- Porter stemmer (M.F. Porter, 1980), for lowercase ASCII words ----------

const STEP2 = [
  ["ational", "ate"], ["tional", "tion"], ["enci", "ence"], ["anci", "ance"], ["izer", "ize"],
  ["bli", "ble"], ["alli", "al"], ["entli", "ent"], ["eli", "e"], ["ousli", "ous"],
  ["ization", "ize"], ["ation", "ate"], ["ator", "ate"], ["alism", "al"], ["iveness", "ive"],
  ["fulness", "ful"], ["ousness", "ous"], ["aliti", "al"], ["iviti", "ive"], ["biliti", "ble"],
  ["logi", "log"],
].sort((a, b) => b[0].length - a[0].length);
const STEP3 = [
  ["icate", "ic"], ["ative", ""], ["alize", "al"], ["iciti", "ic"], ["ical", "ic"], ["ful", ""], ["ness", ""],
].sort((a, b) => b[0].length - a[0].length);
const STEP4 = [
  "al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement", "ment", "ent",
  "ion", "ou", "ism", "ate", "iti", "ous", "ive", "ize",
].sort((a, b) => b.length - a.length);

function isConsonant(word, i) {
  const c = word[i];
  if ("aeiou".includes(c)) return false;
  if (c === "y") return i === 0 || !isConsonant(word, i - 1);
  return true;
}

// The number of vowel-consonant sequences in a stem: [C](VC)^m[V].
function measure(stem) {
  let m = 0;
  let previousVowel = false;
  for (let i = 0; i < stem.length; i++) {
    const vowel = !isConsonant(stem, i);
    if (previousVowel && !vowel) m++;
    previousVowel = vowel;
  }
  return m;
}

function hasVowel(stem) {
  for (let i = 0; i < stem.length; i++) if (!isConsonant(stem, i)) return true;
  return false;
}

function endsWithDoubleConsonant(word) {
  const n = word.length;
  return n >= 2 && word[n - 1] === word[n - 2] && isConsonant(word, n - 1);
}

// consonant-vowel-consonant, where the last consonant is not w, x or y.
function endsCvc(word) {
  const n = word.length;
  return (
    n >= 3 && isConsonant(word, n - 3) && !isConsonant(word, n - 2) && isConsonant(word, n - 1) &&
    !"wxy".includes(word[n - 1])
  );
}

function replaceSuffix(word, rules, condition) {
  for (const [suffix, replacement] of rules) {
    if (word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      return condition(stem) ? stem + replacement : word;
    }
  }
  return word;
}

export function porterStem(word) {
  if (word.length <= 2 || !/^[a-z]+$/.test(word)) return word;
  let w = word;

  // Step 1a: plurals.
  if (w.endsWith("sses") || w.endsWith("ies")) w = w.slice(0, -2);
  else if (!w.endsWith("ss") && w.endsWith("s")) w = w.slice(0, -1);

  // Step 1b: -eed, -ed, -ing.
  let tidy = false;
  if (w.endsWith("eed")) {
    if (measure(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else if (w.endsWith("ed") && hasVowel(w.slice(0, -2))) {
    w = w.slice(0, -2);
    tidy = true;
  } else if (w.endsWith("ing") && hasVowel(w.slice(0, -3))) {
    w = w.slice(0, -3);
    tidy = true;
  }
  if (tidy) {
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
    else if (endsWithDoubleConsonant(w) && !/[lsz]$/.test(w)) w = w.slice(0, -1);
    else if (measure(w) === 1 && endsCvc(w)) w += "e";
  }

  // Step 1c: y → i after a vowel-containing stem.
  if (w.endsWith("y") && hasVowel(w.slice(0, -1))) w = `${w.slice(0, -1)}i`;

  // Steps 2 and 3: map double and single suffixes to simpler ones.
  w = replaceSuffix(w, STEP2, (stem) => measure(stem) > 0);
  w = replaceSuffix(w, STEP3, (stem) => measure(stem) > 0);

  // Step 4: drop suffixes from long stems.
  for (const suffix of STEP4) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (measure(stem) > 1 && (suffix !== "ion" || /[st]$/.test(stem))) w = stem;
      break;
    }
  }

  // Step 5: tidy a final -e and -ll.
  if (w.endsWith("e")) {
    const stem = w.slice(0, -1);
    const m = measure(stem);
    if (m > 1 || (m === 1 && !endsCvc(stem))) w = stem;
  }
  if (measure(w) > 1 && endsWithDoubleConsonant(w) && w.endsWith("l")) w = w.slice(0, -1);
  return w;
}

// --- Typo tolerance ----------------------------------------------------------

// True when a and b differ by at most one insertion, deletion, substitution or
// swap of adjacent letters (Damerau-Levenshtein distance ≤ 1).
export function withinOneEdit(a, b) {
  if (a === b) return true;
  const diff = a.length - b.length;
  if (diff > 1 || diff < -1) return false;
  if (diff === 0) {
    const mismatches = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i] && mismatches.push(i) > 2) return false;
    }
    if (mismatches.length === 1) return true;
    const [i, j] = mismatches;
    return j === i + 1 && a[i] === b[j] && a[j] === b[i];
  }
  const [long, short] = diff > 0 ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && long[i] === short[i]) i++;
  return long.slice(i + 1) === short.slice(i);
}

// --- BM25 index ----------------------------------------------------------------

// passages: [{ id, text }]. Options: stemming, k1, b (see KEYWORD_DEFAULTS).
export function createKeywordIndex(passages, { stemming = true, k1 = 1.2, b = 0.75 } = {}) {
  const analyze = (text) => {
    const words = tokenize(text);
    return stemming ? words.map(porterStem) : words;
  };

  const postings = new Map(); // term → [[passage index, term frequency], …]
  const lengths = [];
  passages.forEach(({ text }, index) => {
    const terms = analyze(text);
    lengths.push(terms.length);
    const frequencies = new Map();
    for (const term of terms) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    for (const [term, tf] of frequencies) {
      if (!postings.has(term)) postings.set(term, []);
      postings.get(term).push([index, tf]);
    }
  });

  const count = passages.length;
  const averageLength = lengths.reduce((sum, n) => sum + n, 0) / Math.max(count, 1) || 1;
  const idf = (df) => Math.log(1 + (count - df + 0.5) / (df + 0.5));
  // Normalisation unit: the BM25 score of a word found in exactly one passage,
  // once, in a passage of average length.
  const unit = idf(1);

  const vocabularyByLength = new Map();
  for (const term of postings.keys()) {
    if (!vocabularyByLength.has(term.length)) vocabularyByLength.set(term.length, []);
    vocabularyByLength.get(term.length).push(term);
  }
  const typoVariants = (term) => {
    const variants = [];
    for (let n = term.length - 1; n <= term.length + 1; n++) {
      for (const candidate of vocabularyByLength.get(n) ?? []) {
        if (withinOneEdit(term, candidate)) variants.push(candidate);
      }
    }
    return variants;
  };

  // Returns Map(passage id → { score, matches }). score is in [0, 1]: the mean
  // over query words of the word's BM25 score divided by `unit`, capped at 1.
  // So a word found in many passages adds little, a missing word adds 0, and 1
  // means every query word is as specific to this passage as a word can be.
  // matches lists the query words (as typed) that matched.
  function search(query, { typoTolerance = true } = {}) {
    const queryTerms = new Map(); // analysed term → word as typed
    for (const word of tokenize(query)) {
      const term = stemming ? porterStem(word) : word;
      if (!queryTerms.has(term)) queryTerms.set(term, word);
    }
    const results = new Map();
    if (queryTerms.size === 0 || count === 0) return results;

    for (const [term, word] of queryTerms) {
      let variants = postings.has(term) ? [[term, 1]] : [];
      if (!variants.length && typoTolerance && word.length >= TYPO_MIN_LENGTH) {
        variants = typoVariants(term).map((variant) => [variant, TYPO_FACTOR]);
      }

      // A passage takes its best variant of each query word.
      const best = new Map();
      for (const [variant, factor] of variants) {
        const list = postings.get(variant);
        const weight = idf(list.length) * factor;
        for (const [index, tf] of list) {
          const norm = k1 * (1 - b + (b * lengths[index]) / averageLength);
          const score = Math.min(1, (weight * (tf * (k1 + 1))) / (tf + norm) / unit);
          if (score > (best.get(index) ?? 0)) best.set(index, score);
        }
      }
      for (const [index, score] of best) {
        const id = passages[index].id;
        const result = results.get(id) ?? { score: 0, matches: [] };
        result.score += score / queryTerms.size;
        result.matches.push(word);
        results.set(id, result);
      }
    }
    return results;
  }

  return { search, size: count };
}
