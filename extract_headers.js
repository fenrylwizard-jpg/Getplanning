const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    const headers = {};
    
    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length > 0) {
            headers[name] = data.slice(0, 10); // First 10 rows
        }
    });

    fs.writeFileSync('excel_headers.json', JSON.stringify(headers, null, 2), 'utf8');
    console.log('Headers saved to excel_headers.json');
} catch (err) {
    console.error(err);
}
