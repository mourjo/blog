const jsonData = (async () => {
    const response = await fetch('/blog/search.json');
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    return await response.json();
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

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-bar');
    const searchContainer = document.getElementById('search-container');
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

    searchInput.addEventListener('keydown', () => {
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
            jsonData
                .then(data => {
                    const results = data.filter(item => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
                    results.forEach(item => {
                        const resultItem = document.createElement('div');
                        resultItem.innerHTML = `<a href="${item.url}"><div class="search-result">${item.title}</div></a>`;

                        resultsContainer.appendChild(resultItem);
                        showSearchResults();
                    });
                }
            );
        }
    });
});
