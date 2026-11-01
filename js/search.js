// Search bar: hybrid of semantic search (jekyll-semantic-search) and BM25
// keyword search. See js/hybrid-search.js for how the scores are combined.

import { createKeywordSearcher, fuse } from './hybrid-search.js';

const LIMIT = 8;
const SEMANTIC_GRACE_MS = 300; // show keyword results first if embeddings are slower

const searchInput = document.getElementById('search-bar');
const resultsContainer = document.getElementById('search-results');

// Set when `semantic_search.keyword_search` is enabled in _config.yml.
const keywordIndexUrl = searchInput.dataset.keywordIndex;

// ---------- Loading ----------

let keywordIndex; // Promise<{ index, searcher } | null>

function loadKeywordIndex() {
    keywordIndex ??= !keywordIndexUrl ? Promise.resolve(null) : fetch(keywordIndexUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch ${keywordIndexUrl}`);
            return response.json();
        })
        .then(index => ({ index, searcher: createKeywordSearcher(index) }))
        .catch(e => {
            console.error('Keyword search unavailable', e);
            return null;
        });
    return keywordIndex;
}

let modelWarmedUp = false;

// The embedding model is only downloaded once someone shows intent to search.
function warmUp() {
    loadKeywordIndex();
    if (modelWarmedUp || !window.SemanticSearch) return;
    modelWarmedUp = true;
    window.SemanticSearch.search('warm up', { limit: 1 }).catch(() => {});
}

async function semanticSearch(q) {
    if (!window.SemanticSearch || q.length < 3) return { hits: [], floor: 0 };
    try {
        const { meta } = await window.SemanticSearch.start();
        const hits = await window.SemanticSearch.search(q, { limit: 50 });
        return { hits, floor: meta.min_score ?? 0 };
    } catch (e) {
        console.error('Semantic search unavailable', e);
        return null;
    }
}

// Keyword-only ranking, used before (or without) semantic results.
function keywordOnly(keyword, keywordScores) {
    const { min_score: keywordMin } = keyword.index.params;
    return [...keywordScores]
        .filter(([, score]) => score >= keywordMin)
        .sort((a, b) => b[1] - a[1])
        .slice(0, LIMIT)
        .map(([i]) => keyword.index.docs[i]);
}

// ---------- UI ----------

let blurTimeout;
let searchedOnce = false;
let latestQuery = '';

function hideSearchResults() {
    blurTimeout = setTimeout(() => {
        resultsContainer.style.display = 'none';
    }, 200);
}

function showSearchResults() {
    clearTimeout(blurTimeout);
    resultsContainer.style.display = 'block';
}

function resultElement(url, title) {
    const link = document.createElement('a');
    link.href = url;
    const label = document.createElement('div');
    label.className = 'search-result';
    label.textContent = title;
    link.appendChild(label);
    const wrapper = document.createElement('div');
    wrapper.appendChild(link);
    return wrapper;
}

function setStatus(text) {
    const status = document.createElement('div');
    status.className = 'search-result';
    status.textContent = text;
    resultsContainer.replaceChildren(status);
    showSearchResults();
}

function render(results) {
    if (results.length === 0) {
        setStatus('No results');
        return;
    }
    resultsContainer.replaceChildren(...results.map(r => resultElement(r.url, r.title)));
    showSearchResults();
}

async function performSearch() {
    const query = searchInput.value.trim();
    latestQuery = query;
    if (!query) {
        resultsContainer.replaceChildren();
        resultsContainer.style.display = 'none';
        return;
    }
    if (!searchedOnce) setStatus('Searching…');

    const semantic = semanticSearch(query);
    const keyword = await loadKeywordIndex();
    const keywordScores = keyword ? keyword.searcher.search(query) : new Map();

    const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), SEMANTIC_GRACE_MS));
    if (keyword && await Promise.race([semantic, timeout]) === 'timeout') {
        if (query !== latestQuery) return;
        searchedOnce = true;
        const preliminary = keywordOnly(keyword, keywordScores);
        if (preliminary.length > 0) render(preliminary);
    }

    const semanticResult = await semantic;
    if (query !== latestQuery) return; // a newer search has started
    searchedOnce = true;

    if (!semanticResult) {
        // Embeddings failed: fall back to keyword results alone.
        render(keyword ? keywordOnly(keyword, keywordScores) : []);
    } else if (!keyword) {
        render(semanticResult.hits.slice(0, LIMIT));
    } else {
        render(fuse({
            index: keyword.index,
            semanticHits: semanticResult.hits,
            keywordScores,
            semanticFloor: semanticResult.floor,
            limit: LIMIT,
        }));
    }
}

function debounce(callback, delay = 400) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
}

function searchKeyPress(event) {
    if (event.key === 'Escape') {
        searchInput.value = '';
        searchInput.blur();
        hideSearchResults();
    } else if (event.key === 'Enter') {
        const firstLink = resultsContainer.querySelector('a');
        if (searchInput.value && firstLink) {
            firstLink.click();
        }
    }
}

function searchFocus() {
    warmUp();
    if (searchInput.value && searchedOnce) {
        showSearchResults();
    }
}

searchInput.addEventListener('blur', hideSearchResults);
searchInput.addEventListener('focus', searchFocus);
searchInput.addEventListener('keydown', searchKeyPress);
searchInput.addEventListener('input', debounce(performSearch));
