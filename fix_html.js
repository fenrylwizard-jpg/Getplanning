const fs = require('fs');
const path = require('path');

const files = [
    'public/presentation.html',
    'public/presentation-en.html',
    'public/presentation-nl.html'
];

let globalStyleCounter = 0;
const styleMap = new Map();

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;

    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Advanced regex to parse tags and extract styles
    const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>/g;
    content = content.replace(tagRegex, (match, tagName, attrs) => {
        if (tagName.toLowerCase() === 'style' || tagName.toLowerCase() === 'script') return match;
        
        let styleMatch = attrs.match(/style="([^"]+)"/);
        if (!styleMatch) return match;

        let styleVal = styleMatch[1].trim();
        let className = styleMap.get(styleVal);
        if (!className) {
            globalStyleCounter++;
            className = `gs-${globalStyleCounter}`;
            styleMap.set(styleVal, className);
        }

        // Remove style attribute
        let newAttrs = attrs.replace(/\s*style="[^"]+"/, '');

        // Check if class exists
        let classMatch = newAttrs.match(/class="([^"]+)"/);
        if (classMatch) {
            // Append our class
            let existingClasses = classMatch[1];
            // Don't append if it's already there (shouldn't happen on first run)
            if (!existingClasses.includes(className)) {
                newAttrs = newAttrs.replace(/class="([^"]+)"/, `class="$1 ${className}"`);
            }
        } else {
            // Add class attribute
            newAttrs += ` class="${className}"`;
        }

        return `<${tagName}${newAttrs}>`;
    });

    // Generate the CSS block for this file
    // Note: since styleMap grows, we just append all tracked styles. 
    // They are exactly the same across en/nl anyway.
    let generatedCSS = '\n        /* ── GENERATED STYLES ── */\n';
    for (const [style, cls] of styleMap.entries()) {
        generatedCSS += `        .${cls} { ${style} }\n`;
    }

    if (content.includes('/* ── GENERATED STYLES ── */')) {
        // Already contains it, need to replace it
        const currentRegex = /\n\s*\/\* ── GENERATED STYLES ── \*\/[\s\S]*?(?=<\/style>)/;
        content = content.replace(currentRegex, generatedCSS + '    ');
    } else if (content.includes('</style>')) {
        content = content.replace('</style>', `${generatedCSS}    </style>`);
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
}
console.log('Fixed inline styles!');
