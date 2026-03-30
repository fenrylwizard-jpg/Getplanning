/* Test script to simulate getColumn and logic */

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

const headerItems = [
    { text: "n°", x: 15 },
    { text: "wbs", x: 29 },
    { text: "nom de la tâche", x: 65 },
    { text: "zone", x: 235 },
    { text: "lot", x: 265 },
    { text: "durée", x: 285 },
    { text: "début", x: 310 },
    { text: "fin", x: 343 },
    { text: "marge", x: 374 },
];

const columns = { ...DEFAULT_COLUMNS };

for (const item of headerItems) {
    const text = item.text;
    const x = item.x;
    
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

console.log("Columns:", columns);

const rowItems = [
    { x: 20, text: "1" },
    { x: 29, text: "1" },
    { x: 66, text: "ECOLE ALEXANDRE HERLIN" },
    { x: 285, text: "501 jrs?" },
    { x: 310, text: "14/05/24" },
    { x: 343, text: "29/06/26" }
];

const row = {};
for (const item of rowItems) {
    const col = getColumn(item.x, columns);
    console.log(`X: ${item.x} -> Col: ${col} -> Text: ${item.text}`);
    if (col) {
        row[col] = (row[col] ? row[col] + ' ' : '') + item.text;
    }
}

console.log("Row:", row);
console.log("Condition:", (row.wbs || row.task) && (row.start || row.duration));
