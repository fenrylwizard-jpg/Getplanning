const fs = require('fs');
const content = fs.readFileSync('src/lib/LanguageContext.tsx', 'utf8');

const findDuplicates = (section) => {
    const regex = new RegExp(section + ': {([\\s\\S]*?)}', 'g');
    const match = regex.exec(content);
    if (!match) return;
    const lines = match[1].split('\n');
    const seen = new Set();
    const dups = [];
    lines.forEach(line => {
        const keyMatch = line.match(/^\s*"([^"]+)":/);
        if (keyMatch) {
            const key = keyMatch[1];
            if (seen.has(key)) {
                dups.push(key);
            }
            seen.add(key);
        }
    });
    console.log(`Duplicates in ${section}:`, dups);
};

findDuplicates('fr');
findDuplicates('en');
findDuplicates('nl');
