// Deterministic PDF planning table extraction using pdf.js-extract
// Extracts structured task data from construction Gantt chart PDFs
// using X/Y coordinate-based column detection

import { PDFExtract } from 'pdf.js-extract';

// Column boundaries for standard MS Project / Primavera Gantt PDF exports
// These are calibrated for "LOUIS DE WAELE" style plannings but work adaptively
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

function getColumn(x: number, columns: typeof DEFAULT_COLUMNS): string | null {
    for (const [name, bounds] of Object.entries(columns)) {
        if (x >= bounds.min && x < bounds.max) return name;
    }
    return null;
}

function parseFrenchDate(dateStr: string): string {
    // Handles "14/05/24", "6/07/24", "20/10/25", etc.
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return dateStr;
    const [d, m, y] = parts;
    const yearNum = parseInt(y);
    const year = yearNum < 50 ? `20${y.padStart(2, '0')}` : `19${y.padStart(2, '0')}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export interface ExtractedTask {
    num?: string;
    wbs: string;
    name: string;
    zone?: string;
    lot?: string;
    duration: string;
    startDate: string;
    endDate: string;
    margin?: string;
}

/**
 * Auto-detect column boundaries by analyzing the header row of the first page.
 * Falls back to DEFAULT_COLUMNS if headers aren't found.
 */
function detectColumns(pages: Array<{ content: Array<{ x: number; y: number; str: string; width: number }> }>): typeof DEFAULT_COLUMNS {
    const columns = { ...DEFAULT_COLUMNS };
    
    if (!pages.length) return columns;
    
    const page = pages[0];
    
    // Dynamically find the Y coordinate of the header row
    let headerY = -1;
    for (const item of page.content) {
        if (item.y > 400) continue; // Only look in the top half
        const text = (item.str || '').trim().toLowerCase();
        if (text === 'wbs' || text === 'tâche' || text === 'task' || text === 'nom' || text.includes('déb') || text.includes('libell') || text.includes('désign') || text.includes('descrip') || text.includes('activ')) {
            headerY = Math.round(item.y / 3) * 3;
            break;
        }
    }

    const headerItems = page.content.filter((item: { y: number; str: string }) => {
        if (!item.str || !item.str.trim()) return false;
        // If we found a dynamic header, match within a tolerance. Otherwise use the old fallback range.
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

/**
 * Extract structured task data from a planning PDF buffer.
 * Uses coordinate-based column detection for deterministic extraction.
 */
export async function extractPlanningFromPDF(buffer: Buffer): Promise<ExtractedTask[]> {
    const pdfExtract = new PDFExtract();
    
    // pdf.js-extract natively supports Buffer extraction
    const data = await pdfExtract.extractBuffer(buffer, {});

    const columns = detectColumns(data.pages as unknown as Array<{ content: Array<{ x: number; y: number; str: string; width: number }> }>);
        const allRows: Record<string, string>[] = [];

        for (const page of data.pages) {
            const items = page.content.filter((item: { str: string }) => item.str && item.str.trim());
            
            // Group by Y coordinate (tolerance 3px for same row)
            const rowMap = new Map<number, Array<{ x: number; text: string }>>();
            items.forEach((item: { x: number; y: number; str: string }) => {
                const y = Math.round(item.y / 3) * 3;
                if (!rowMap.has(y)) rowMap.set(y, []);
                rowMap.get(y)!.push({ x: Math.round(item.x), text: item.str.trim() });
            });

            const sortedYs = Array.from(rowMap.keys()).sort((a, b) => a - b);
            
            for (const y of sortedYs) {
                // Skip extreme page borders (headers/footers) instead of hardcoded 78 to 815
                if (y < 30 || y > 830) continue;
                
                const rowItems = rowMap.get(y)!.sort((a, b) => a.x - b.x);
                
                const row: Record<string, string> = {};
                for (const item of rowItems) {
                    const col = getColumn(item.x, columns);
                    if (col) {
                        row[col] = (row[col] ? row[col] + ' ' : '') + item.text;
                    }
                }
                
                // Only keep rows that look like actual task data
                if ((row.wbs || row.task) && (row.start || row.duration)) {
                    allRows.push(row);
                }
            }
        }

        // Merge multi-line task names
        const merged: Record<string, string>[] = [];
        for (const row of allRows) {
            if (!row.wbs && !row.start && !row.end && !row.duration && row.task) {
                if (merged.length > 0) {
                    merged[merged.length - 1].task += ' ' + row.task;
                }
            } else {
                merged.push({ ...row });
            }
        }

        // Convert to structured output with parsed dates
        return merged.map(row => ({
            num: row.num,
            wbs: row.wbs || '',
            name: row.task || 'Sans nom',
            zone: row.zone,
            lot: row.lot,
            duration: row.duration || '',
            startDate: row.start ? parseFrenchDate(row.start) : '',
            endDate: row.end ? parseFrenchDate(row.end) : '',
            margin: row.margin,
        }));
}

/**
 * DEBUG FUNCTION: Extracts and formats the exact text with coordinates
 * from the top of the first page to help us understand non-standard PDF structures.
 */
export async function extractRawTextFromPDF(buffer: Buffer): Promise<string[]> {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(buffer, {});
    const lines: string[] = [];
    if (!data.pages.length) return ["Aucune page trouvée."];
    
    const page = data.pages[0];
    const items = page.content.filter((item: { str: string }) => item.str && item.str.trim());
    
    // Sort by Y first (top to bottom), then X (left to right)
    items.sort((a: { x: number; y: number }, b: { x: number; y: number }) => {
        const yA = Math.round(a.y / 3) * 3;
        const yB = Math.round(b.y / 3) * 3;
        if (yA !== yB) return yA - yB;
        return a.x - b.x;
    });

    lines.push("--- PDF RAW HEADERS & TOP TASKS ---");
    // Limit to top ~120 elements to fit in a screenshot/alert box nicely
    items.slice(0, 120).forEach((item: { x: number; y: number; str: string }) => {
        lines.push(`Y:${Math.round(item.y).toString().padStart(3, ' ')} X:${Math.round(item.x).toString().padStart(3, ' ')} | "${item.str.trim()}"`);
    });
    
    return lines;
}
