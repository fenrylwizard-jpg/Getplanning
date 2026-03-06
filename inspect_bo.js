const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('public/uploads/last_metre.xlsx');
    console.log("Sheets:", workbook.SheetNames);
    
    // Check "BO" sheet
    const boSheet = workbook.Sheets['BO'];
    if (boSheet) {
        console.log(`\n=== BO ===`);
        const data = XLSX.utils.sheet_to_json(boSheet, { header: 1 });
        data.slice(0, 50).forEach((row, i) => {
            console.log(`Row ${i}: ${JSON.stringify(row)}`);
        });
    }

    // Check "Base de données" sheet
    const dbSheet = workbook.Sheets['Base de données'];
    if (dbSheet) {
        console.log(`\n=== Base de données ===`);
        const data = XLSX.utils.sheet_to_json(dbSheet, { header: 1 });
        data.slice(0, 50).forEach((row, i) => {
            console.log(`Row ${i}: ${JSON.stringify(row)}`);
        });
    }

} catch (err) {
    console.error(err);
}
