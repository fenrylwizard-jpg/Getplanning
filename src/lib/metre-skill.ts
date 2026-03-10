import * as XLSX from 'xlsx';

export interface MetreTask {
    taskCode: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    minutesPerUnit: number;
    zones?: Record<string, number>; // zone name → quantity allocated to that zone
}

export interface MetreResult {
    tasks: MetreTask[];
    totalHours: number;
    projectName: string;
    zones: string[]; // detected zone column names
}

/**
 * Simplified "Bordereau de prix" Excel format parser.
 *
 * Expected column layout (header auto-detected):
 *   Poste | Désignation | Marché | Unité | Quantité | temps de pose unitaire (min) | temps total | [zone1] | [zone2] | ...
 *
 * Category detection:
 *   Rows where "Poste" has a value (like "1", "1.1", "2.3") but NO Quantité/Unité → category header.
 *   Subsequent data rows inherit the last seen category.
 *
 * Zone columns:
 *   Any columns AFTER "temps total" are treated as zone columns.
 *   Their header text = zone name, cell value = quantity for that zone.
 */
export function parseMetre(buffer: Buffer): MetreResult {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error('Le fichier Excel est vide.');

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

    // ── Auto-detect header row ──
    // Scan for the first row containing both "Désignation" and "Quantité" (accent/case insensitive)
    const normalize = (s: string) =>
        s.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (!row) continue;
        const cells = row.map(c => normalize(String(c)));
        if (cells.some(c => c.includes('designation')) && cells.some(c => c.includes('quantite'))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        throw new Error(
            "Impossible de détecter l'en-tête du fichier. " +
            "Vérifiez que le fichier contient les colonnes 'Désignation' et 'Quantité'."
        );
    }

    const headerRow = data[headerRowIdx].map(c => normalize(String(c)));

    // ── Map columns by header name ──
    const findCol = (keywords: string[]): number => {
        return headerRow.findIndex(h => keywords.some(kw => h.includes(kw)));
    };

    const COL = {
        poste: findCol(['poste', 'pos']),
        designation: findCol(['designation']),
        marche: findCol(['marche']),
        unite: findCol(['unite']),
        quantite: findCol(['quantite']),
        tempsUnitaire: findCol(['temps de pose unitaire', 'temps unitaire', 'min/unite', 'min/u']),
        tempsTotal: findCol(['temps total', 'total min', 'total']),
    };

    if (COL.designation === -1 || COL.quantite === -1) {
        throw new Error("Colonnes 'Désignation' ou 'Quantité' introuvables dans l'en-tête.");
    }

    // ── Detect zone columns (everything after "temps total") ──
    const zones: string[] = [];
    const zoneStartCol = COL.tempsTotal !== -1 ? COL.tempsTotal + 1 : headerRow.length;
    for (let c = zoneStartCol; c < headerRow.length; c++) {
        const name = String(data[headerRowIdx][c] || '').trim();
        if (name) zones.push(name);
    }

    // ── Parse data rows ──
    const tasks: MetreTask[] = [];
    let totalComputedHours = 0;
    let currentCategory = 'Non Catégorisé';

    for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i] as unknown[];
        if (!row || row.length === 0) continue;

        const poste = String(row[COL.poste] ?? '').trim();
        const designation = String(row[COL.designation] ?? '').trim();
        const unite = COL.unite !== -1 ? String(row[COL.unite] ?? '').trim() : '';
        const qtyRaw = COL.quantite !== -1 ? String(row[COL.quantite] ?? '') : '';
        const minutesRaw = COL.tempsUnitaire !== -1 ? String(row[COL.tempsUnitaire] ?? '') : '';
        const totalRaw = COL.tempsTotal !== -1 ? String(row[COL.tempsTotal] ?? '') : '';

        const qty = parseFloat(qtyRaw) || 0;
        const minutesPerUnit = parseFloat(minutesRaw) || 0;
        const totalMinutes = parseFloat(totalRaw) || 0;

        // Skip completely empty rows
        if (!designation && !poste) continue;

        // ── Category detection ──
        // A row is a category header if it has a Poste but no valid Quantité and no Unité
        const isCategoryRow = poste && (!qty || qty === 0) && !unite;
        if (isCategoryRow) {
            if (designation) {
                currentCategory = designation;
            } else if (poste) {
                currentCategory = poste;
            }
            continue;
        }

        // ── Data row ──
        if (!designation || qty <= 0) continue;

        // Task code: use poste if available, otherwise generate from row index
        const taskCode = poste ? `${poste}_${i}` : `TASK_${i}`;

        // Compute minutesPerUnit if not provided but total is
        let effectiveMinPerUnit = minutesPerUnit;
        if (effectiveMinPerUnit <= 0 && totalMinutes > 0 && qty > 0) {
            effectiveMinPerUnit = totalMinutes / qty;
        }

        // Parse zone allocations
        const zoneAlloc: Record<string, number> = {};
        for (let z = 0; z < zones.length; z++) {
            const colIdx = zoneStartCol + z;
            if (colIdx < row.length) {
                const val = parseFloat(String(row[colIdx] || '0')) || 0;
                if (val > 0) zoneAlloc[zones[z]] = val;
            }
        }

        tasks.push({
            taskCode,
            description: designation,
            category: currentCategory,
            unit: unite || 'u',
            quantity: qty,
            minutesPerUnit: Math.round(effectiveMinPerUnit * 100) / 100,
            zones: Object.keys(zoneAlloc).length > 0 ? zoneAlloc : undefined,
        });

        // Total hours
        const hours = totalMinutes > 0
            ? totalMinutes / 60
            : (qty * effectiveMinPerUnit) / 60;
        totalComputedHours += hours;
    }

    // Try to extract project name from the first few rows
    let projectName = 'Projet';
    for (let i = 0; i < Math.min(headerRowIdx, 5); i++) {
        const row = data[i];
        if (!row) continue;
        for (const cell of row) {
            const val = String(cell || '').trim();
            if (val.toLowerCase().startsWith('projet:') || val.toLowerCase().startsWith('projet :')) {
                projectName = val.replace(/^projet\s*:\s*/i, '').trim();
                break;
            }
        }
    }

    return {
        tasks,
        totalHours: Math.round(totalComputedHours * 100) / 100,
        projectName,
        zones,
    };
}
