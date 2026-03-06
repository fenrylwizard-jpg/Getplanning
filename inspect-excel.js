const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);
const meetstaatName = workbook.SheetNames.find(s => s.toLowerCase().includes('meetstaat') || s.toLowerCase().includes('vorderstaat')) || workbook.SheetNames[0];
const meetstaatSheet = workbook.Sheets[meetstaatName];
const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1, defval: '' });

console.log(`--- SAMPLE ROWS WITH MARCHE FF, QP, QF ---`);
meetstaatData.slice(9).forEach((row, i) => {
    const marche = String(row[10] || '').trim();
    if (['FF', 'QP', 'QF'].includes(marche)) {
        console.log(`Row ${i+9}: TECH=[${row[3]}] | ARTICLE=[${row[7]}] | DESC=[${String(row[9]).substring(0, 40)}]`);
    }
});
