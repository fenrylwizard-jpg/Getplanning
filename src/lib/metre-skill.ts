import * as XLSX from 'xlsx';

export interface MetreTask {
    taskCode: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    minutesPerUnit: number;
}

export interface MetreResult {
    tasks: MetreTask[];
    totalHours: number;
    projectName: string;
}

/**
 * Herlin Excel Column Layout (Meetstaat sheet, with row 8 as header):
 * Col 0:  CODE          - Decomposition string (e.g. "20&u")
 * Col 1:  MAT           - Material cost
 * Col 2:  STRT          - External works cost
 * Col 3:  TECH (via BO) - Tech/Budget code (e.g. "EB1", "VK1") → links to BUDGETCODES
 * Col 6:  NR            - Row number
 * Col 7:  N° Article    - Article code (e.g. "00.3.01.01")
 * Col 9:  Description   - Task description
 * Col 10: Marché        - Market type (FF = forfait)
 * Col 11: Unité         - Unit (PG for forfait, SR, u, m, etc.)
 * Col 12: Qté           - Quantity (always 1 for forfaits)
 * Col 16: MO min/unité  - Installation time in minutes per unit
 * Col 30: Total minutes  - Total MO minutes (= Qté × moMin)
 * Col 31: Total heures  - Total MO hours
 *
 * BUDGETCODES sheet (row 0 is header):
 * Col 0: Naam (Dutch name)
 * Col 1: Nom FR (French name)
 * Col 2: Code (the code, e.g. "P-DAK")
 * Col 3: Categorie ("Activité" or "Matériau")
 * Col 4: Uurtarief (hourly rate)
 * Col 5: Bedrijfseenheid
 *
 * The TECH column (col 3) in Meetstaat does NOT directly match to BUDGETCODES codes.
 * Instead, we use the Marché (col 10) field for the category grouping.
 */
export function parseMetre(buffer: Buffer): MetreResult {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;
    
    // Find sheets
    const meetstaatName = sheets.find(s => s.toLowerCase().includes('meetstaat') || s.toLowerCase().includes('vorderstaat')) || sheets[0];
    const boName = sheets.find(s => s === 'BO');

    const meetstaatSheet = workbook.Sheets[meetstaatName];
    if (!meetstaatSheet) throw new Error(`Impossible de trouver la feuille Meetstaat (${meetstaatName})`);

    const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1, defval: '' }) as unknown[][];

    // Column indices (based on Herlin file analysis — header is row 8)
    const HEADER_ROW = 8;
    const COL = {
        decomp:   0,  // CODE / decomposition string
        tech:     3,  // TECH (via BO) - tech/budget code
        article:  7,  // N° Article
        desc:     9,  // Description
        marche:  10,  // Marché (FF, SR, ...)
        unit:    11,  // Unité (PG, u, m, ...)
        qty:     12,  // Qté
        moMin:   16,  // MO min/unité
        totalMin:30,  // Total minutes
        totalHrs:31,  // Total heures
    };

    // Build category map from BO sheet
    const categoryMap: Record<string, string> = {};
    if (boName) {
        const boSheet = workbook.Sheets[boName];
        if (boSheet) {
            const boData = XLSX.utils.sheet_to_json(boSheet, { header: 1, defval: '' }) as unknown[][];
            // Skip headers to where lines start defining tech codes (Line >= 10 in standard Herlin)
            boData.slice(10).forEach(row => {
                const code = String(row[2] || '').trim(); // Index 2 is "Code"
                const description = String(row[4] || '').trim(); // Index 4 is Description of Code line
                if (code && description) categoryMap[code] = description;
            });
        }
    }

    const tasks: MetreTask[] = [];
    let totalComputedHours = 0;

    for (let i = HEADER_ROW + 1; i < meetstaatData.length; i++) {
        const row = meetstaatData[i] as unknown[];
        if (!row || row.length < 17) continue;

        const desc = String(row[COL.desc] || '').trim();
        const unit = String(row[COL.unit] || '').trim();
        const marche = String(row[COL.marche] || '').trim();
        const techCode = String(row[COL.tech] || '').trim();
        const articleCode = String(row[COL.article] || '').trim();
        
        const moMin = parseFloat(String(row[COL.moMin] || '0'));
        const totalHrs = parseFloat(String(row[COL.totalHrs] || '0'));
        const decompStr = String(row[COL.decomp] || '').trim();

        // Only process rows where there is actual labour time
        if (!desc || isNaN(moMin) || moMin <= 0) continue;

        // Determine quantity
        // For forfaits (Marché=FF or Unité=PG), the official Qté is 1.
        // The "real" quantity is derived from the decomposition string (first number).
        let qty = parseFloat(String(row[COL.qty] || '1'));
        
        if ((marche === 'FF' || unit === 'PG') && decompStr) {
            const match = decompStr.match(/^(\d+(?:[.,]\d+)?)/);
            if (match) {
                qty = parseFloat(match[1].replace(',', '.'));
            }
        }

        if (isNaN(qty) || qty <= 0) qty = 1;

        // Category mapping logic from BO mapping
        let category = 'Non Catégorisé';
        
        if (techCode && categoryMap[techCode]) {
            category = categoryMap[techCode];
        } else if (marche === 'FF' || marche === 'SR') {
             // Keyword based refinement ONLY if we don't have a strict strict BO class OR we want subcategories.
             // Given user priority: stick tightly to what the BO gives.
             const lowerDesc = desc.toLowerCase();
             if (lowerDesc.includes('éclairage') || lowerDesc.includes('luminaire')) category = 'Éclairage';
             else if (lowerDesc.includes('incendie') || lowerDesc.includes('détection')) category = 'Détection incendie';
             else if (lowerDesc.includes('câble') || lowerDesc.includes('cablage')) category = 'Câblage';
             else if (lowerDesc.includes('prise') || lowerDesc.includes('interrupteur')) category = 'Appareillage';
        }

        // Use article code + row index for uniqueness
        const taskCode = articleCode ? `${articleCode}_${i}` : `TASK_${i}`;

        // Compute correct minutesPerUnit:
        const totalMOminutes = isNaN(totalHrs) || totalHrs <= 0
            ? moMin  // totalHrs not available, use moMin as total minutes
            : totalHrs * 60; // convert hours to minutes
        
        const minutesPerUnitCorrected = qty > 0 ? totalMOminutes / qty : totalMOminutes;

        tasks.push({
            taskCode,
            description: desc,
            category,
            unit: unit || 'u',
            quantity: qty,
            minutesPerUnit: Math.round(minutesPerUnitCorrected * 100) / 100,
        });

        // Total hours: directly from totalHrs or computed
        totalComputedHours += isNaN(totalHrs) || totalHrs <= 0
            ? moMin / 60
            : totalHrs;

    }

    return {
        tasks,
        totalHours: Math.round(totalComputedHours * 100) / 100,
        projectName: 'Herlin'
    };
}
