const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\Imam\\.gemini\\antigravity\\Suivi des études .xlsm';

console.log('Analyzing:', path.basename(filePath));

const wb = XLSX.readFile(filePath);
console.log('Sheet names:', wb.SheetNames.join(', '));
console.log('Total sheets:', wb.SheetNames.length);

wb.SheetNames.forEach((sheetName, idx) => {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`SHEET ${idx + 1}: "${sheetName}"`);
    console.log('─'.repeat(80));
    
    const ws = wb.Sheets[sheetName];
    if (!ws['!ref']) {
        console.log('Empty sheet');
        return;
    }
    const range = XLSX.utils.decode_range(ws['!ref']);
    console.log(`Range: ${ws['!ref']} (${range.e.r - range.s.r + 1} rows x ${range.e.c - range.s.c + 1} cols)`);
    
    if (ws['!merges'] && ws['!merges'].length > 0) {
        console.log(`Merged cells: ${ws['!merges'].length}`);
    }
    
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const maxRows = Math.min(data.length, 50);
    
    console.log(`\nFirst ${maxRows} rows (of ${data.length}):`);
    for (let r = 0; r < maxRows; r++) {
        const row = data[r];
        if (!row || row.every(c => c === '' || c === undefined || c === null)) {
            console.log(`  Row ${r + 1}: [empty]`);
            continue;
        }
        const cells = row.map(c => {
            if (c === '' || c === undefined || c === null) return '';
            const s = String(c);
            return s.length > 50 ? s.substring(0, 50) + '...' : s;
        });
        while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
        console.log(`  Row ${r + 1}: [${cells.join(' | ')}]`);
    }
    
    if (data.length > 55) {
        console.log(`  ... (${data.length - 50} rows skipped) ...`);
        for (let r = Math.max(maxRows, data.length - 5); r < data.length; r++) {
            const row = data[r];
            if (!row || row.every(c => c === '' || c === undefined || c === null)) {
                console.log(`  Row ${r + 1}: [empty]`);
                continue;
            }
            const cells = row.map(c => {
                if (c === '' || c === undefined || c === null) return '';
                const s = String(c);
                return s.length > 50 ? s.substring(0, 50) + '...' : s;
            });
            while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
            console.log(`  Row ${r + 1}: [${cells.join(' | ')}]`);
        }
    }
});
