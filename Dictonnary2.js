document.addEventListener('DOMContentLoaded', () => {
    const addWordForm = document.getElementById('addWordForm');
    const wordInput = document.getElementById('newWord');
    const definitionInput = document.getElementById('newDefinition');
    const messageBox = document.getElementById('message-box');
    
    const searchWordForm = document.getElementById('search-word-form');
    const searchInput = document.getElementById('search-bar');
    const resultBox = document.getElementById('result');

    // Add Word Form Submission
    if (addWordForm) {
        addWordForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const word = wordInput.value.trim();
            const definition = definitionInput.value.trim();

            if (!word || !definition) {
                messageBox.textContent = 'Word and definition are required';
                return;
            }

            fetch('/api/add-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ word, definition })
            })
            .then(response => response.json())
            .then(data => {
                messageBox.textContent = data.message;
                wordInput.value = '';
                definitionInput.value = '';
            })
            .catch(error => {
                console.error('Error:', error);
                messageBox.textContent = 'An error occurred while adding the word';
            });
        });
    }

    // Search Word Form Submission
    if (searchWordForm) {
        searchWordForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const word = searchInput.value.trim();

            if (!word) {
                resultBox.textContent = 'Word is required';
                return;
            }

            fetch(`/api/definition?word=${encodeURIComponent(word)}`)
            .then(response => response.json())
            .then(data => {
                if (data.definition) {
                    resultBox.textContent = `Definition: ${data.definition}`;
                } else {
                    resultBox.textContent = 'No exact match found for the given word';
                    if (data.suggestions && data.suggestions.length > 0) {
                        const suggestions = data.suggestions.join(', ');
                        resultBox.textContent += `. Did you mean: ${suggestions}?`;
                    }
                }
                searchInput.value = '';
            })
            .catch(error => {
                console.error('Error:', error);
                resultBox.textContent = 'An error occurred while fetching the definition';
            });
        });
    }
});
