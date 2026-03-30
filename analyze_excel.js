const XLSX = require('xlsx');
const path = require('path');

const BASE = 'C:\\Users\\Imam\\.gemini\\antigravity';

function analyzeFile(filePath) {
    console.log('\n' + '='.repeat(100));
    console.log('FILE:', path.basename(filePath));
    console.log('='.repeat(100));
    
    const wb = XLSX.readFile(filePath);
    console.log('Sheet names:', wb.SheetNames.join(', '));
    console.log('Total sheets:', wb.SheetNames.length);
    
    wb.SheetNames.forEach((sheetName, idx) => {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`SHEET ${idx + 1}: "${sheetName}"`);
        console.log('─'.repeat(80));
        
        const ws = wb.Sheets[sheetName];
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        console.log(`Range: ${ws['!ref']} (${range.e.r - range.s.r + 1} rows x ${range.e.c - range.s.c + 1} cols)`);
        
        // Merged cells
        if (ws['!merges'] && ws['!merges'].length > 0) {
            console.log(`Merged cells: ${ws['!merges'].length}`);
            ws['!merges'].slice(0, 15).forEach(m => {
                const s = XLSX.utils.encode_cell(m.s);
                const e = XLSX.utils.encode_cell(m.e);
                console.log(`  ${s}:${e}`);
            });
            if (ws['!merges'].length > 15) console.log(`  ... and ${ws['!merges'].length - 15} more`);
        }
        
        // Print first 40 rows with actual cell values
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const maxRows = Math.min(data.length, 40);
        
        console.log(`\nFirst ${maxRows} rows (of ${data.length}):`);
        for (let r = 0; r < maxRows; r++) {
            const row = data[r];
            if (!row || row.every(c => c === '' || c === undefined || c === null)) {
                console.log(`  Row ${r + 1}: [empty]`);
                continue;
            }
            const cells = row.map((c, i) => {
                if (c === '' || c === undefined || c === null) return '';
                const s = String(c);
                return s.length > 40 ? s.substring(0, 40) + '...' : s;
            });
            while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
            console.log(`  Row ${r + 1}: [${cells.join(' | ')}]`);
        }
        
        // Also show last few rows if file is big
        if (data.length > 45) {
            console.log(`  ... (${data.length - 40} rows skipped) ...`);
            for (let r = Math.max(maxRows, data.length - 5); r < data.length; r++) {
                const row = data[r];
                if (!row || row.every(c => c === '' || c === undefined || c === null)) {
                    console.log(`  Row ${r + 1}: [empty]`);
                    continue;
                }
                const cells = row.map(c => {
                    if (c === '' || c === undefined || c === null) return '';
                    const s = String(c);
                    return s.length > 40 ? s.substring(0, 40) + '...' : s;
                });
                while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
                console.log(`  Row ${r + 1}: [${cells.join(' | ')}]`);
            }
        }
    });
}

const files = [
    path.join(BASE, 'Comparatif achats.xlsx'),
    path.join(BASE, 'Suivi financier.xlsx'),
];

files.forEach(f => {
    try {
        analyzeFile(f);
    } catch (e) {
        console.error(`Error reading ${f}:`, e.message);
    }
});
