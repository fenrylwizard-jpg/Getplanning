const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx');
const workbook = XLSX.readFile(excelPath);
const budgetName = workbook.SheetNames.find(s => s.toLowerCase().includes('budget') || s.toLowerCase().includes('base') || s.toLowerCase().includes('donnée') || s.toLowerCase().includes('donnee'));
const budgetSheet = workbook.Sheets[budgetName];
const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1, defval: '' });

const targetNames = [
    'Eclairage', 'Éclairage',
    'Eclairage de sécurité', 'Éclairage de sécurité',
    'Détection incendie', 'Detection incendie',
    'Câblage courant faible', 'Cablage courant faible', 'Installation des courants faible',
    'Câblage courant fort', 'Cablage courant fort',
    'Chemins de câbles', 'Chemin de cable',
    'Tubages', 'Tubage',
    'Appareillage prises interrupteurs', 'Appareillage',
    'Contrôle d\'accès', 'Controle d\'accès'
];

console.log('Searching for target names in budgetData...');
const map = {};

budgetData.forEach((row, i) => {
    row.forEach((cell, j) => {
        const val = String(cell).trim();
        if (targetNames.some(t => val.toLowerCase().includes(t.toLowerCase()))) {
            // Found a potential match in Col j. Usually Col 1 is Nom FR, Col 2 is Code.
            // Let's assume Code is in Col 2.
            const code = String(row[2] || '').trim();
            if (code) {
                map[code] = val;
                console.log(`FOUND [${val}] with code [${code}] at Row ${i}`);
            }
        }
    });
});

console.log('\n--- FINAL PROPOSED MAP ---');
console.log(JSON.stringify(map, null, 2));
