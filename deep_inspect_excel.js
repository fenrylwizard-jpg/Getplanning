const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    console.log('---RESULT_START---');
    console.log('SheetNames Array:', JSON.stringify(workbook.SheetNames));
    
    // Check sheet visibility and structure
    if (workbook.Workbook && workbook.Workbook.Sheets) {
        console.log('Sheet Metadata (Visibility):', JSON.stringify(workbook.Workbook.Sheets));
    }

    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        console.log(`\n--- Inspecting Sheet: ${name} ---`);
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Row Count: ${data.length}`);
        
        // Find if "Base de données" text exists anywhere in the first sheet if the sheet itself isn't named that
        if (name === 'INFO') {
            console.log('INFO Head:', JSON.stringify(data.slice(0, 10)));
        }
        
        if (data.length > 0) {
            console.log('Row 0:', JSON.stringify(data[0]));
            console.log('Row 1:', JSON.stringify(data[1]));
            console.log('Row 2:', JSON.stringify(data[2]));
            console.log('Row 3:', JSON.stringify(data[3]));
            console.log('Row 4:', JSON.stringify(data[4]));
        }
    });

    console.log('---RESULT_END---');
} catch (err) {
    console.error('Error:', err);
}
