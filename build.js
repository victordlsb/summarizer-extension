const fs = require('fs');
const path = require('path');

// Create build directories
fs.mkdirSync('build/chrome', { recursive: true });
fs.mkdirSync('build/firefox', { recursive: true });

// List of files to copy
const files = ['background.js', 'content.js', 'options.html', 'styles.css', 'options.js', 'Summary.js', 'utils.js'];

// Copy common files to both directories
files.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `build/chrome/${file}`);
    fs.copyFileSync(file, `build/firefox/${file}`);
  }
});

// Copy manifest files
fs.copyFileSync('manifest.json', 'build/chrome/manifest.json');
fs.copyFileSync('manifest_firefox.json', 'build/firefox/manifest.json');