const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('public/uploads/last_metre.xlsx');
    
    // 1. Read BO budgets
    const boSheet = workbook.Sheets['BO'];
    const boData = XLSX.utils.sheet_to_json(boSheet, { header: 1 });
    const boBudgets = {};
    const boNames = {};
    boData.slice(10).forEach(row => {
        const code = String(row[2] || '').trim();
        const desc = String(row[4] || '').trim();
        const hrs = parseFloat(row[8]);
        if (code && !isNaN(hrs) && hrs > 0) {
            boBudgets[code] = hrs;
            boNames[code] = desc;
        }
    });

    // 2. Read Meetstaat tasks
    const meetstaatSheet = workbook.Sheets['Meetstaat'];
    const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1 });
    const COL = {
        decomp:   0,  
        tech:     3,  
        desc:     9,  
        marche:  10,  
        unit:    11,  
        qty:     12,  
        moMin:   16,  
        totalHrs:31,  
    };

    const meetstaatTotals = {};
    for (let i = 9; i < meetstaatData.length; i++) {
        const row = meetstaatData[i];
        if (!row) continue;
        
        const desc = String(row[COL.desc] || '').trim();
        const techCode = String(row[COL.tech] || '').trim();
        const moMin = parseFloat(String(row[COL.moMin] || '0'));
        const totalHrs = parseFloat(String(row[COL.totalHrs] || '0'));

        if (!desc || isNaN(moMin) || moMin <= 0) continue;

        let hrs = isNaN(totalHrs) || totalHrs <= 0 ? moMin / 60 : totalHrs;
        
        if (techCode) {
            if (!meetstaatTotals[techCode]) meetstaatTotals[techCode] = 0;
            meetstaatTotals[techCode] += hrs;
        }
    }

    console.log("=== Discrepancy Analysis ===");
    console.log("Tech Code | BO Budget | Meetstaat Sum | Diff");
    for (const code in boBudgets) {
        const boAmt = boBudgets[code];
        const msAmt = meetstaatTotals[code] || 0;
        console.log(`${code.padEnd(10)} | ${boAmt.toFixed(2).padStart(9)} | ${msAmt.toFixed(2).padStart(13)} | ${(msAmt - boAmt).toFixed(2).padStart(8)}  => ${boNames[code]}`);
    }

} catch (err) {
    console.error(err);
}
