// Deterministic PDF planning table extraction using pdf.js-extract
// Extracts structured task data from construction Gantt chart PDFs
// using X/Y coordinate-based column detection

import { PDFExtract } from 'pdf.js-extract';



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
 * Extract structured task data from a planning PDF buffer.
 * Uses coordinate-based column detection for deterministic extraction.
 */
export async function extractPlanningFromPDF(buffer: Buffer): Promise<ExtractedTask[]> {
    const pdfExtract = new PDFExtract();
    
    // pdf.js-extract natively supports Buffer extraction
    const data = await pdfExtract.extractBuffer(buffer, {});


        const allRows: Record<string, string>[] = [];

        for (const page of data.pages) {
            const items = page.content.filter((item: { str: string }) => item.str && item.str.trim());
            
            // Sort items by original Y coordinate to cluster effectively
            items.sort((a: { y: number }, b: { y: number }) => a.y - b.y);
            
            // Cluster items dynamically: Group if within 6px of the current row baseline
            const rowMap = new Map<number, Array<{ x: number; text: string }>>();
            let currentBaseline = -1;
            
            items.forEach((item: { x: number; y: number; str: string }) => {
                if (currentBaseline === -1 || Math.abs(item.y - currentBaseline) > 6) {
                    currentBaseline = item.y;
                    rowMap.set(currentBaseline, []);
                }
                rowMap.get(currentBaseline)!.push({ x: Math.round(item.x), text: item.str.trim() });
            });

            const sortedYs = Array.from(rowMap.keys()).sort((a, b) => a - b);
            
            for (const y of sortedYs) {
                // Skip extreme page borders (headers/footers)
                if (y < 30 || y > 830) continue;
                
                const rowItems = rowMap.get(y)!.sort((a, b) => a.x - b.x);
                if (rowItems.length === 0) continue;

                // Heuristic parsing instead of strict X mapping
                // Because task names can be heavily indented (overlapping with duration/date headers)
                
                const num = '';
                let wbs = '';
                let taskName = '';
                let duration = '';
                let start = '';
                let end = '';
                
                // 1. Identify Dates (dd/mm/yy or dd/mm/yyyy)
                const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/;
                const dateMatches = rowItems.filter(item => dateRegex.test(item.text));
                
                if (dateMatches.length >= 1) {
                    start = dateMatches[0].text.match(dateRegex)![0];
                    // Remove start date from pool
                    dateMatches[0].text = dateMatches[0].text.replace(start, '').trim();
                }
                if (dateMatches.length >= 2) {
                    end = dateMatches[1].text.match(dateRegex)![0];
                    dateMatches[1].text = dateMatches[1].text.replace(end, '').trim();
                }

                // 2. Identify Duration (e.g. "501 jrs", "14 jrs?", "0 jr")
                const durRegex = /(?:~?\d+[.,]?\d*\s*jrs?[?]?)|(?:\d+\s*[a-zA-Z]+)/i;
                const durItem = rowItems.find(item => durRegex.test(item.text));
                if (durItem) {
                    const match = durItem.text.match(durRegex);
                    if (match) {
                        duration = match[0];
                        durItem.text = durItem.text.replace(duration, '').trim();
                    }
                }

                // 3. WBS & Task Name
                // Everything else from left to right forms the num/WBS and task name
                // Usually the first short numeric string is N° or WBS
                const remainingTexts = rowItems.map(i => i.text).filter(t => t.length > 0);
                
                if (remainingTexts.length > 0) {
                    // Check if first item looks like a WBS (e.g., "1.1.5.9" or "3")
                    if (/^[\d.]+$/.test(remainingTexts[0])) {
                        wbs = remainingTexts.shift()!;
                    }
                    // The rest is the task name
                    taskName = remainingTexts.join(' ').trim();
                }

                if ((wbs || taskName) && (start || duration)) {
                    allRows.push({ num, wbs, task: taskName, duration, start, end });
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
            num: row.num || '',
            wbs: row.wbs || '',
            name: row.task || 'Sans nom',
            zone: row.zone || '',
            lot: row.lot || '',
            duration: row.duration || '',
            startDate: row.start ? parseFrenchDate(row.start) : '',
            endDate: row.end ? parseFrenchDate(row.end) : '',
            margin: row.margin || '',
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
