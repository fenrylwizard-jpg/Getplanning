const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);

const targetCodes = ['EB1', 'VKO1', 'VK1', 'AFBR1'];

console.log('Searching for target codes in all sheets...');

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    data.forEach((row, i) => {
        row.forEach((cell, j) => {
            const cellValue = String(cell).trim();
            if (targetCodes.includes(cellValue)) {
                console.log(`FOUND [${cellValue}] in sheet [${sheetName}] at Row ${i}, Col ${j}`);
                console.log(`   Context (Row ${i}):`, row.slice(0, 10));
            }
        });
    });
});
