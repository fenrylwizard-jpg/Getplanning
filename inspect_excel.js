const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    console.log('---RESULT_START---');
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\nSheet: ${sheetName}`);
        console.log(`Rows count: ${data.length}`);
        if (data.length > 0) {
            console.log('Sample Row 1:', data[0]);
            console.log('Sample Row 2:', data[1]);
            console.log('Sample Row 3:', data[2]);
            console.log('Sample Row 4:', data[3]);
            console.log('Sample Row 5:', data[4]);
        }
    });
    console.log('---RESULT_END---');
} catch (err) {
    console.error('Error reading Excel:', err);
}
