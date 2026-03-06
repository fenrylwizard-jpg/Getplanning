const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    console.log('---RESULT_START---');
    
    const dbSheet = workbook.Sheets['Base de données'];
    if (dbSheet) {
        const dbData = XLSX.utils.sheet_to_json(dbSheet, { header: 1 });
        console.log('\n--- Base de données (Sample) ---');
        dbData.slice(0, 5).forEach((row, i) => console.log(`Row ${i}:`, row));
    }

    const vSheet = workbook.Sheets['Vorderstaat'];
    if (vSheet) {
        const vData = XLSX.utils.sheet_to_json(vSheet, { header: 1 });
        console.log('\n--- Vorderstaat (Sample) ---');
        vData.slice(0, 10).forEach((row, i) => console.log(`Row ${i}:`, row));
    }
    
    console.log('---RESULT_END---');
} catch (err) {
    console.error('Error reading Excel:', err);
}
