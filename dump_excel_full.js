const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    const dump = {};
    
    ['Meetstaat', 'BUDGETCODES'].forEach(name => {
        const sheet = workbook.Sheets[name];
        if (sheet) {
            dump[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 100);
        }
    });

    fs.writeFileSync('excel_dump_full.json', JSON.stringify(dump, null, 2), 'utf8');
    console.log('Dump saved.');
} catch (err) {
    console.error(err);
}
