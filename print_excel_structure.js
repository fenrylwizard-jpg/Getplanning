const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    ['Meetstaat', 'BUDGETCODES'].forEach(name => {
        const sheet = workbook.Sheets[name];
        if (sheet) {
            console.log(`\n=== ${name} ===`);
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            data.slice(0, 30).forEach((row, i) => {
                console.log(`${i}: ${JSON.stringify(row)}`);
            });
        }
    });
} catch (err) {
    console.error(err);
}
