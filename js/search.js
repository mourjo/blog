const jsonData = (async () => {
    const response = await fetch('/blog/search.json');
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    const postItems = await response.json();
    postItems.forEach(post => {
        const titleWords = post.title.toLowerCase().split(/\s+/);
        const descriptionWords = post.description.toLowerCase().split(/\s+/);
        post.words = [...titleWords, ...descriptionWords];
    });
    return postItems;
})();

let blurTimeout;

function hideSearchResults() {
    const searchInput = document.getElementById('search-bar');
    const searchContainer = document.getElementById('search-container');
    const resultsContainer = document.getElementById('search-results');
    blurTimeout = setTimeout(() => {
        resultsContainer.style.display = 'none';
    }, 200);
}

function showSearchResults() {
    const searchInput = document.getElementById('search-bar');
    const searchContainer = document.getElementById('search-container');
    const resultsContainer = document.getElementById('search-results');

    clearTimeout(blurTimeout);
    resultsContainer.style.display = 'block';
}

async function matchingPosts(q) {
    const wordsInQuery = q.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2);

    if (wordsInQuery.length == 0) {
        return [];
    }

    const data = await jsonData;
    data.forEach(post => {
        let score = 0;
        for (let queryWord of wordsInQuery) {
            for (let postWord of post.words) {
                if (postWord === queryWord) {
                    score += 1;
                } else if (postWord.startsWith(queryWord)) {
                    score += 0.5;
                } else if (postWord.includes(queryWord)) {
                    score += 0.1;
                }
            }
        }
        post.score = score;
    });

    return data
        .filter(post => post.score > 0)
        .sort((a, b) => b.score - a.score);
}

function debounce(callback, delay = 750) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback.apply(this, args);
        }, delay)
    }
}

let searchedOnce = false;

async function performSearch() {
    const searchInput = document.getElementById('search-bar');
    const resultsContainer = document.getElementById('search-results');
    const query = searchInput.value.toLowerCase();
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';

    matchingPosts(query).then(results => {
        searchedOnce = true;
        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.innerHTML = `<a href="${item.url}"><div class="search-result">${item.title}</div></a>`;

            resultsContainer.appendChild(resultItem);
            showSearchResults();
        });
    });
}

function searchKeyPress(event) {
    const searchInput = document.getElementById('search-bar');
    const resultsContainer = document.getElementById('search-results');
    if (event.key === 'Escape') {
        searchInput.value = '';
        searchInput.blur();
        hideSearchResults();
    } else if (event.key === 'Enter') {
        const query = searchInput.value.toLowerCase();
        if (query && resultsContainer && resultsContainer.children.length > 0) {
            resultsContainer.children[0].children[0].click();
        }
    }
}

function searchFocus() {
    const searchInput = document.getElementById('search-bar');
    const query = searchInput.value.toLowerCase();
    if (query && searchedOnce) {
        showSearchResults();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-bar');
    searchInput.addEventListener('blur', hideSearchResults);
    searchInput.addEventListener('focus', searchFocus);
    searchInput.addEventListener('keydown', searchKeyPress);
    searchInput.addEventListener('input', debounce(performSearch));
});
