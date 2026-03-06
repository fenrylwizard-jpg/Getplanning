const fs = require('fs');
const path = 'C:/Users/Imam/.gemini/antigravity/brain/c6dd17ad-c688-4efb-9ea0-e15b8e3053dc/walkthrough.md';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\]\(\/C:\/Users/gi, '](file:///C:/Users');
fs.writeFileSync(path, content);
console.log('Fixed links to file:///C:/Users');
