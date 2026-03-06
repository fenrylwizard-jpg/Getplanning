const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);

// 1. Build Category Map from BUDGETCODES
const budgetName = workbook.SheetNames.find(s => s.toLowerCase().includes('budget') || s.toLowerCase().includes('base') || s.toLowerCase().includes('donnée') || s.toLowerCase().includes('donnee'));
const budgetSheet = workbook.Sheets[budgetName];
const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1, defval: '' });

const categoryMap = {};
budgetData.forEach(row => {
    const code = String(row[2] || '').trim();
    const name = String(row[1] || '').trim(); // Nom FR
    if (code && name) {
        categoryMap[code] = name;
    }
});

// 2. Scan Meetstaat for ALL Tech Codes
const meetstaatName = workbook.SheetNames.find(s => s.toLowerCase().includes('meetstaat') || s.toLowerCase().includes('vorderstaat')) || workbook.SheetNames[0];
const meetstaatSheet = workbook.Sheets[meetstaatName];
const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1, defval: '' });

const mappingReport = {};

meetstaatData.slice(9).forEach(row => {
    const tech = String(row[3] || '').trim();
    const marche = String(row[10] || '').trim();
    if (tech && !mappingReport[tech]) {
        mappingReport[tech] = {
            name: categoryMap[tech] || 'MISSING',
            count: 0,
            firstMarche: marche,
            exampleDesc: String(row[9] || '').substring(0, 50)
        };
    }
    if (tech) mappingReport[tech].count++;
});

console.log('--- MAPPING REPORT ---');
Object.entries(mappingReport).forEach(([code, info]) => {
    console.log(`${code} [${info.count} rows]: ${info.name} (Marche: ${info.firstMarche})`);
    if (info.name === 'MISSING') {
        console.log(`   Example: ${info.exampleDesc}`);
    }
});

console.log('\n--- TOTAL BUDGETCODES: ' + budgetData.length + ' ---');
