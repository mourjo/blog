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
    const wordsInQuery = q.split(/\s+/).filter(w => w.length > 0);

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

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-bar');
    const resultsContainer = document.getElementById('search-results');

    searchInput.addEventListener('blur', () => {
        hideSearchResults();
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.toLowerCase();
        if (query) {
            showSearchResults();
        }
    });

    searchInput.addEventListener('keydown', (event) => {
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
    });

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';



        if (query) {
            matchingPosts(query).then(results => {
                results.forEach(item => {
                    const resultItem = document.createElement('div');
                    resultItem.innerHTML = `<a href="${item.url}"><div class="search-result">${item.title}</div></a>`;

                    resultsContainer.appendChild(resultItem);
                    showSearchResults();
                });
            })
        }
    });
});
