const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    console.log('---RESULT_START---');
    console.log('All Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const range = sheet['!ref'];
        console.log(`Sheet: ${name}, Range: ${range}`);
    });

    // Try to find any sheet that contains "Base" or "Donn"
    const searchSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('base') || n.toLowerCase().includes('donn'));
    if (searchSheet) {
        console.log(`Found matching sheet: ${searchSheet}`);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[searchSheet], { header: 1 });
        console.log('First 5 rows:');
        data.slice(0, 5).forEach((r, i) => console.log(i, r));
    } else {
        console.log('No sheet matching "Base" or "Donn" found.');
    }

    // Inspect Vorderstaat
    if (workbook.Sheets['Vorderstaat']) {
        console.log('\n--- Vorderstaat ---');
        const vData = XLSX.utils.sheet_to_json(workbook.Sheets['Vorderstaat'], { header: 1 });
        vData.slice(0, 15).forEach((r, i) => console.log(i, r));
    }
    
    console.log('---RESULT_END---');
} catch (err) {
    console.error('Error:', err);
}
