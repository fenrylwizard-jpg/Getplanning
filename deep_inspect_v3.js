const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('test_file.xlsm');
    let output = '---RESULT_START---\n';
    output += 'SheetNames Array: ' + JSON.stringify(workbook.SheetNames) + '\n';
    
    if (workbook.Workbook && workbook.Workbook.Sheets) {
        output += 'Sheet Metadata (Visibility): ' + JSON.stringify(workbook.Workbook.Sheets) + '\n';
    }

    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        output += `\n--- Inspecting Sheet: ${name} ---\n`;
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        output += `Row Count: ${data.length}\n`;
        
        if (data.length > 5) {
            for (let i = 0; i < 15; i++) {
                if (data[i]) {
                    output += `Row ${i}: ${JSON.stringify(data[i])}\n`;
                }
            }
        }
    });

    output += '---RESULT_END---\n';
    fs.writeFileSync('excel_audit_v3.txt', output, 'utf8');
    console.log('Audit saved to excel_audit_v3.txt');
} catch (err) {
    console.error('Error:', err);
}
