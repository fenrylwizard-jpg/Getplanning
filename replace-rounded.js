const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replaces
            // 32px, 24px, 3xl, 2xl -> md
            content = content.replace(/rounded-\[32px\]/g, 'rounded-md');
            content = content.replace(/rounded-\[24px\]/g, 'rounded-md');
            content = content.replace(/rounded-\[20px\]/g, 'rounded-md');
            content = content.replace(/rounded-\[14px\]/g, 'rounded-md');
            content = content.replace(/rounded-3xl/g, 'rounded-md');
            content = content.replace(/rounded-2xl/g, 'rounded-md');
            content = content.replace(/rounded-xl/g, 'rounded-md');
            content = content.replace(/rounded-t-3xl/g, 'rounded-t-md');
            content = content.replace(/rounded-t-2xl/g, 'rounded-t-md');
            content = content.replace(/rounded-t-xl/g, 'rounded-t-md');
            content = content.replace(/rounded-b-3xl/g, 'rounded-b-md');
            content = content.replace(/rounded-b-2xl/g, 'rounded-b-md');
            content = content.replace(/rounded-b-xl/g, 'rounded-b-md');
            
            // We want to be careful with rounded-full. Let's ONLY replace it if it's on a button or badge that is NOT uniquely w- h- equal size, but it's hard with regex. 
            // We'll leave rounded-full for now and only replace px-X py-Y rounded-full with rounded-sm
            content = content.replace(/(px-\d+.*?py-\d+.*?)(rounded-full)/g, '$1rounded-sm');
            content = content.replace(/(py-\d+.*?px-\d+.*?)(rounded-full)/g, '$1rounded-sm');
            content = content.replace(/(p-\d+.*?)(rounded-full)/g, '$1rounded-sm');
            // Also buttons and inputs
            content = content.replace(/btn-[a-z]+.*? rounded-full/g, (match) => match.replace('rounded-full', 'rounded-md'));

            fs.writeFileSync(fullPath, content);
        }
    }
}

console.log("Starting replacement in src/");
processDir(path.join(__dirname, 'src'));
console.log("Done!");
