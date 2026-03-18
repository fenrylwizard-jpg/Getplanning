const DEFAULT_COLUMNS = {
    num:      { min: 14, max: 28 },   // N° (row number)
    wbs:      { min: 28, max: 64 },   // WBS code
    task:     { min: 64, max: 229 },  // Nom de la tâche
    zone:     { min: 229, max: 259 }, // ZONE
    lot:      { min: 259, max: 282 }, // LOT
    duration: { min: 282, max: 308 }, // Durée
    start:    { min: 308, max: 340 }, // Début
    end:      { min: 340, max: 372 }, // Fin
    margin:   { min: 405, max: 425 }, // Marge totale
};

function getColumn(x, columns) {
    for (const [name, bounds] of Object.entries(columns)) {
        if (x >= bounds.min && x < bounds.max) return name;
    }
    return null;
}

function parseFrenchDate(dateStr) {
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return dateStr;
    const [d, m, y] = parts;
    const yearNum = parseInt(y);
    const year = yearNum < 50 ? `20${y.padStart(2, '0')}` : `19${y.padStart(2, '0')}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const mockPageContent = [
    { x: 15, y: 54, str: "N°" },
    { x: 29, y: 54, str: "WBS" },
    { x: 65, y: 54, str: "Nom de la tâche" },
    { x: 235, y: 54, str: "ZONE" },
    { x: 265, y: 54, str: "LOT" },
    { x: 285, y: 54, str: "Durée" },
    { x: 310, y: 54, str: "Début" },
    { x: 343, y: 54, str: "Fin" },
    { x: 374, y: 60, str: "Marge" },
    
    // First Task
    { x: 20, y: 81, str: "LDW2 - 100% JO" },
    { x: 29, y: 82, str: "1" },
    { x: 66, y: 82, str: "ECOLE ALEXANDRE HERLIN" },
    { x: 285, y: 82, str: "501 jrs?" },
    { x: 310, y: 81, str: "14/05/24" },
    { x: 343, y: 80, str: "29/06/26" }
];

function detectColumns(pages) {
    const columns = { ...DEFAULT_COLUMNS };
    if (!pages.length) return columns;
    const page = pages[0];
    let headerY = -1;
    for (const item of page.content) {
        if (item.y > 400) continue;
        const text = (item.str || '').trim().toLowerCase();
        if (text === 'wbs' || text === 'tâche' || text === 'task' || text === 'nom' || text.includes('déb') || text.includes('libell') || text.includes('désign') || text.includes('descrip') || text.includes('activ')) {
            headerY = Math.round(item.y / 3) * 3;
            break;
        }
    }

    const headerItems = page.content.filter((item) => {
        if (!item.str || !item.str.trim()) return false;
        if (headerY !== -1) {
            const y = Math.round(item.y / 3) * 3;
            return Math.abs(y - headerY) <= 6;
        }
        return item.y >= 40 && item.y <= 100;
    });
    
    for (const item of headerItems) {
        const text = item.str.trim().toLowerCase();
        const x = Math.round(item.x);
        
        if (text === 'n°') columns.num = { min: x - 2, max: x + 15 };
        else if (text === 'wbs') columns.wbs = { min: x - 2, max: x + 35 };
        else if (text.includes('nom') || text.includes('tâche') || text.includes('task')) {
            columns.task = { min: x - 2, max: columns.zone.min };
        }
        else if (text === 'zone') columns.zone = { min: x - 2, max: x + 26 };
        else if (text === 'lot') columns.lot = { min: x - 2, max: x + 20 };
        else if (text.includes('dur')) columns.duration = { min: x - 2, max: x + 25 };
        else if (text.includes('déb') || text.includes('debut') || text.includes('start')) {
            columns.start = { min: x - 2, max: x + 30 };
        }
        else if (text === 'fin' || text === 'end') columns.end = { min: x - 2, max: x + 28 };
        else if (text.includes('marge') || text.includes('float')) columns.margin = { min: x - 2, max: x + 20 };
    }
    
    return columns;
}

const data = { pages: [ { content: mockPageContent } ] };
const columns = detectColumns(data.pages);
console.log("DETECTED COLUMNS:", columns);

const allRows = [];
for (const page of data.pages) {
    const items = page.content.filter((item) => item.str && item.str.trim());
    
    const rowMap = new Map();
    items.forEach((item) => {
        const y = Math.round(item.y / 3) * 3;
        if (!rowMap.has(y)) rowMap.set(y, []);
        rowMap.get(y).push({ x: Math.round(item.x), text: item.str.trim() });
    });

    console.log("ROWMAP KEYS:", Array.from(rowMap.keys()));

    const sortedYs = Array.from(rowMap.keys()).sort((a, b) => a - b);
    
    for (const y of sortedYs) {
        if (y < 30 || y > 830) continue;
        
        const rowItems = rowMap.get(y).sort((a, b) => a.x - b.x);
        
        const row = {};
        for (const item of rowItems) {
            const col = getColumn(item.x, columns);
            if (col) {
                row[col] = (row[col] ? row[col] + ' ' : '') + item.text;
            }
        }
        
        console.log(`ROW Y=${y} PARSED:`, row);
        
        if ((row.wbs || row.task) && (row.start || row.duration)) {
            console.log("-> KEPT!");
            allRows.push(row);
        } else {
            console.log("-> DISCARDED.");
        }
    }
}

const merged = [];
for (const row of allRows) {
    if (!row.wbs && !row.start && !row.end && !row.duration && row.task) {
        if (merged.length > 0) {
            merged[merged.length - 1].task += ' ' + row.task;
        }
    } else {
        merged.push({ ...row });
    }
}

console.log("ALLROWS", allRows.length, "MERGED", merged.length);
