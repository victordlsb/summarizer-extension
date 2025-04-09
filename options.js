const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

function displayMaskedKey(apiKey) {
  const display = document.getElementById('apiKeyDisplay');
  if (apiKey) {
    const maskedKey = '*'.repeat(apiKey.length - 4) + apiKey.slice(-4);
    display.textContent = `Current API Key: ${maskedKey}`;
  } else {
    display.textContent = '';
  }
}

document.getElementById('saveButton').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    if (storage && storage.sync) {
    storage.sync.set({ apiKey: apiKey }, function() {
        const status = document.getElementById('status');
        status.style.display = 'block';
        document.getElementById('apiKey').value = ''; // Clear the form
        displayMaskedKey(apiKey);
        setTimeout(() => {
        status.style.display = 'none';
        }, 3000);
    });
    } else {
    console.error('Storage API is not available');
    }
});

// Load the saved API key when the options page is opened
document.addEventListener('DOMContentLoaded', function() {
    if (storage && storage.sync) {
    storage.sync.get(['apiKey'], function(result) {
        if (result.apiKey) {
            displayMaskedKey(result.apiKey);
        }
    });
    } else {
    console.error('Storage API is not available');
    }
});