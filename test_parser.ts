import * as fs from 'fs';
import { parseMetre } from './src/lib/metre-skill';

const buffer = fs.readFileSync('public/uploads/last_metre.xlsx');
try {
    const res = parseMetre(buffer);
    const categoryTotals: Record<string, number> = {};
    for (const t of res.tasks) {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
        categoryTotals[t.category] += t.quantity * t.minutesPerUnit / 60;
    }

    console.log("=== Category Totals ===");
    for (const cat in categoryTotals) {
        console.log(`${cat.padEnd(40)} | ${categoryTotals[cat].toFixed(2)}`);
    }
} catch (e) {
    console.error(e);
}
