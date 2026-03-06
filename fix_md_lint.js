const fs = require('fs');
const path = 'C:/Users/Imam/.gemini/antigravity/brain/c6dd17ad-c688-4efb-9ea0-e15b8e3053dc/walkthrough.md';

let content = fs.readFileSync(path, 'utf8');

// Fix MD022: Headings should be surrounded by blank lines
content = content.replace(/([^\n])\n(#+ .*)\n([^\n])/g, '$1\n\n$2\n\n$3');
content = content.replace(/([^\n])\n(#+ .*)\n/g, '$1\n\n$2\n');
content = content.replace(/\n(#+ .*)\n([^\n])/g, '\n$1\n\n$2');

// Fix MD032: Lists should be surrounded by blank lines
content = content.replace(/([^\n])\n(- .*)/g, '$1\n\n$2');
content = content.replace(/(- .*)\n([^\n-])/g, '$1\n\n$2');

// Fix trailing punctuation in headers
content = content.replace(/(#+ [^:]+):/g, '$1');

// Fix trailing spaces
content = content.replace(/[ \t]+$/gm, '');

// Re-read and apply specific fixes if needed, but regex should cover most.
fs.writeFileSync(path, content);
console.log('Fixed markdown lint errors in walkthrough.md');
