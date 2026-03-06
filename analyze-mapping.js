const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);

// 1. Build Category Map
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

// 2. Analyze Meetstaat
const meetstaatName = workbook.SheetNames.find(s => s.toLowerCase().includes('meetstaat') || s.toLowerCase().includes('vorderstaat')) || workbook.SheetNames[0];
const meetstaatSheet = workbook.Sheets[meetstaatName];
const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1, defval: '' });

console.log(`Analyzing sheet: ${meetstaatName}`);

const stats = {
    totalRows: 0,
    hasTechInMap: 0,
    hasTechNotInMap: 0,
    noTechUseMarche: 0,
    noTechNoMarche: 0
};

const missingCodes = new Set();
const fallebackMarche = new Set();

meetstaatData.slice(9).forEach((row, i) => {
    const desc = String(row[9] || '').trim();
    const moMin = parseFloat(String(row[16] || '0'));
    if (!desc || isNaN(moMin) || moMin <= 0) return;

    stats.totalRows++;
    const tech = String(row[3] || '').trim();
    const marche = String(row[10] || '').trim();

    if (tech) {
        if (categoryMap[tech]) {
            stats.hasTechInMap++;
        } else {
            stats.hasTechNotInMap++;
            missingCodes.add(tech);
        }
    } else {
        if (marche) {
            stats.noTechUseMarche++;
            fallebackMarche.add(marche);
        } else {
            stats.noTechNoMarche++;
        }
    }
});

console.log('\n--- STATISTICS ---');
console.log(stats);

console.log('\n--- TECH CODES NOT IN BUDGETCODES ---');
console.log(Array.from(missingCodes));

console.log('\n--- MARCHE VALUES USED AS FALLBACK ---');
console.log(Array.from(fallebackMarche));

console.log('\n--- EXAMPLE MAPPINGS ---');
['EB1', 'VK1', 'VK01', 'VKO1', 'AFBR1'].forEach(c => console.log(`${c} -> ${categoryMap[c] || 'MISSING'}`));
