const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src/app/globals.css');
let content = fs.readFileSync(cssPath, 'utf8');

// We want to replace specific border-radius values with 0.375rem (md) or 0.5rem (lg)
// 9999px -> 0.375rem (buttons, navs)
content = content.replace(/border-radius:\s*9999px;/g, 'border-radius: 0.375rem;');

// 2rem -> 0.5rem (glass cards, mechanical panels)
content = content.replace(/border-radius:\s*2rem;/g, 'border-radius: 0.5rem;');

// 1.5rem -> 0.5rem (feature cards)
content = content.replace(/border-radius:\s*1\.5rem;/g, 'border-radius: 0.5rem;');

// 1rem -> 0.375rem (form-inputs, dashboard previews)
content = content.replace(/border-radius:\s*1rem;/g, 'border-radius: 0.375rem;');

fs.writeFileSync(cssPath, content, 'utf8');
console.log("Updated globals.css border radii.");
