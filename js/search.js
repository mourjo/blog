// Search bar: semantic search over blog posts (jekyll-semantic-search), plus
// keyword matching over externally published articles listed in search.json.

const BASE_URL = '/blog';
const SEMANTIC_LIMIT = 8;

const searchInput = document.getElementById('search-bar');
const resultsContainer = document.getElementById('search-results');

// ---------- External articles (keyword match) ----------

// Controlled by `keyword_search` in _config.yml.
const keywordSearchEnabled = searchInput.dataset.keywordSearch !== 'false';

const externalPosts = keywordSearchEnabled ? (async () => {
    const response = await fetch(`${BASE_URL}/search.json`);
    if (!response.ok) {
        throw new Error('Failed to fetch search.json');
    }
    const posts = await response.json();
    posts.forEach(post => {
        post.words = `${post.title} ${post.description}`.toLowerCase().split(/\s+/);
    });
    return posts;
})() : Promise.resolve([]);

async function matchingExternalPosts(q) {
    const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (!keywordSearchEnabled || queryWords.length === 0) {
        return [];
    }
    const posts = await externalPosts;
    return posts
        .filter(post => queryWords.some(qw => post.words.some(pw => pw.includes(qw))))
        .sort((a, b) => b.recency_score - a.recency_score);
}

// ---------- Blog posts (semantic) ----------

let modelWarmedUp = false;

// The embedding model is only downloaded once someone shows intent to search.
function warmUpModel() {
    if (modelWarmedUp || !window.SemanticSearch) return;
    modelWarmedUp = true;
    window.SemanticSearch.search('warm up', { limit: 1 }).catch(() => {});
}

async function matchingBlogPosts(q) {
    if (!window.SemanticSearch || q.trim().length < 3) {
        return [];
    }
    try {
        return await window.SemanticSearch.search(q, { limit: SEMANTIC_LIMIT });
    } catch (e) {
        console.error('Semantic search unavailable', e);
        return [];
    }
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
    resultsContainer.replaceChildren();
    const status = document.createElement('div');
    status.className = 'search-result';
    status.textContent = text;
    resultsContainer.appendChild(status);
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

    const [blogPosts, external] = await Promise.all([
        matchingBlogPosts(query),
        matchingExternalPosts(query),
    ]);
    if (query !== latestQuery) return; // a newer search has started

    searchedOnce = true;
    const items = [
        ...blogPosts.map(hit => resultElement(hit.url, hit.title)),
        ...external.map(post => resultElement(post.url, post.title)),
    ];
    resultsContainer.replaceChildren(...items);
    if (items.length > 0) {
        showSearchResults();
    } else {
        setStatus('No results');
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
    warmUpModel();
    if (searchInput.value && searchedOnce) {
        showSearchResults();
    }
}

searchInput.addEventListener('blur', hideSearchResults);
searchInput.addEventListener('focus', searchFocus);
searchInput.addEventListener('keydown', searchKeyPress);
searchInput.addEventListener('input', debounce(performSearch));
