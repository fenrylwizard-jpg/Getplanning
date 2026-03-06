const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    const result = {
        sheets: workbook.SheetNames,
        sheetInfo: workbook.Workbook ? workbook.Workbook.Sheets : null,
        vorderstaat: [],
        baseDonnees: []
    };

    if (workbook.Sheets['Vorderstaat']) {
        result.vorderstaat = XLSX.utils.sheet_to_json(workbook.Sheets['Vorderstaat'], { header: 1 }).slice(0, 50);
    }
    
    // Check for "Base de données" or similar
    const dbName = workbook.SheetNames.find(n => n.toLowerCase().includes('base') || n.toLowerCase().includes('donn'));
    if (dbName) {
        result.baseDonnees = XLSX.utils.sheet_to_json(workbook.Sheets[dbName], { header: 1 }).slice(0, 50);
    }

    fs.writeFileSync('excel_summary.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Summary saved to excel_summary.json');
} catch (err) {
    console.error(err);
}
