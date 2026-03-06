const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);
const budgetName = workbook.SheetNames.find(s => s.toLowerCase().includes('budget') || s.toLowerCase().includes('base') || s.toLowerCase().includes('donnée') || s.toLowerCase().includes('donnee'));
const budgetSheet = workbook.Sheets[budgetName];
const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1, defval: '' });

const map = {};
budgetData.forEach((row, i) => {
    const code = String(row[2] || '').trim();
    const name = String(row[1] || '').trim();
    if (code && name) {
        map[code] = name;
    }
});

fs.writeFileSync('full_category_map.json', JSON.stringify(map, null, 2));
console.log('Saved 651 mappings to full_category_map.json');
