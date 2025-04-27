document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = [];

    // Fetch the search index
    fetch('/searchindex.json')
        .then(response => response.json())
        .then(data => {
            searchIndex = data;
        });

    // Initialize Fuse
    const fuse = new Fuse(searchIndex, {
        keys: ['title', 'content', 'tags'],
        threshold: 0.3,
        distance: 1000
    });

    // Handle search input
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value;
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        const results = fuse.search(query);
        displayResults(results);
    });

    // Display search results
    function displayResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }

        const resultsList = document.createElement('ul');
        results.forEach(result => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = result.item.uri;
            link.textContent = result.item.title;
            item.appendChild(link);
            resultsList.appendChild(item);
        });

        searchResults.appendChild(resultsList);
    }
}); 