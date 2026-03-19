import * as XLSX from 'xlsx';

export interface FinanceSnapshotData {
  month: Date;
  sheetName: string;
  totalRevenue: number | null;
  approvedSettlements: number | null;
  laborHours: number | null;
  laborHourlyRate: number | null;
  laborCost: number | null;
  externalLaborCost: number | null;
  subcontractorCost: number | null;
  materialCost: number | null;
  engineeringCost: number | null;
  siteCost: number | null;
  provisionsCost: number | null;
  totalCost: number | null;
  result: number | null;
  marginPercent: number | null;
  plannedWorkers: number | null;
  plannedDays: number | null;
  // RAF (Reste À Faire) fields
  rafLabor: number | null;
  rafSubcontractor: number | null;
  rafMaterial: number | null;
  rafEngineering: number | null;
  rafSite: number | null;
  rafTotal: number | null;
}

/**
 * Parse "Suivi financier.xlsx" — monthly EoC snapshots.
 * 
 * Column layout (0-indexed):
 *   Col 3:  BUDGET INITIAL D'EXÉCUTION
 *   Col 5:  BUDGET D'EXÉCUTION (revised)
 *   Col 7:  État des lieux (current actual values — the "blue column")
 *   Col 9:  RAF = Reste À Faire (remaining — the "green column")
 *   Col 11: FIN PRÉVUE DU PROJET (planned end total = budget)
 * 
 * Key rows (approximate, found by keyword search):
 *   "Revenu total"                        — row ~11
 *   "Total des charges salariales propres" — row ~29 (Main d'oeuvre)
 *   "STT forfait" section, "Montant forfaitaire total OA" — row ~57 (Sous-traitance)
 *   "Gestion totale du projet"            — row ~76 (Encadrement)  
 *   Material total (row before "COÛTS TOTALS") — row ~209
 *   "Frais généraux sur le chiffre d'affaires" — row ~213
 *   "Résultat y compris révision"         — row ~221
 */
export function parseFinances(buffer: Buffer): FinanceSnapshotData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: FinanceSnapshotData[] = [];
  
  console.log('[parse-finances] Sheet names found:', wb.SheetNames);
  
  const skipPatterns = ['sheet1', 'bbd export', 'ea ', 'bbdexport'];
  
  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase().trim();
    if (skipPatterns.some(s => lower === s || lower.startsWith(s))) {
      console.log(`[parse-finances] Skipping sheet: "${sheetName}"`);
      continue;
    }
    
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;
    
    const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (data.length < 15) {
      console.log(`[parse-finances] Sheet "${sheetName}" too small (${data.length} rows), skipping`);
      continue;
    }
    
    // Verify this looks like an EoC sheet
    const row0Str = data[0]?.map((c: unknown) => String(c || '')).join('') || '';
    if (!row0Str.includes('End of Completion') && !row0Str.includes('EoC')) {
      const row7Str = data[7]?.map((c: unknown) => String(c || '')).join('') || '';
      if (!row7Str.includes('BUDGET') && !row7Str.includes('budget')) {
        console.log(`[parse-finances] Sheet "${sheetName}" doesn't look like EoC, skipping`);
        continue;
      }
    }
    
    console.log(`[parse-finances] Processing EoC sheet: "${sheetName}"`);
    
    // ── Parse month from header row 7 ──
    let month: Date = new Date();
    const row7 = data[7];
    let dateFound = false;
    if (row7) {
      for (let c = 5; c < Math.min((row7 as unknown[]).length, 15); c++) {
        const cellStr = String((row7 as unknown[])[c] || '').trim();
        const dateMatch = cellStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})/);
        if (dateMatch) {
          let year = parseInt(dateMatch[3]);
          if (year < 100) year += 2000;
          month = new Date(year, parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
          dateFound = true;
          break;
        }
      }
    }
    if (!dateFound) {
      month = parseMonthFromSheetName(sheetName);
    }
    
    // ── Helpers ──
    // Col 7 = État des lieux (current actual totals — "blue column")
    // Col 9 = RAF (Reste À Faire — "green column")
    // Col 11 = FIN PRÉVUE (planned end total = budget)
    const ACTUAL_COL = 7;
    const RAF_COL = 9;
    const BUDGET_COL = 11;
    
    const getNum = (rowIdx: number, colIdx: number): number | null => {
      if (rowIdx >= data.length || rowIdx < 0) return null;
      const row = data[rowIdx] as unknown[];
      if (!row || colIdx >= row.length) return null;
      const val = row[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const findRow = (keyword: string, startFrom = 0, maxRow = data.length): number => {
      for (let i = startFrom; i < Math.min(data.length, maxRow); i++) {
        const row = data[i] as unknown[];
        if (!row) continue;
        const rowStr = row.map((c: unknown) => String(c || '')).join('|');
        if (rowStr.includes(keyword)) return i;
      }
      return -1;
    };
    
    // ── Revenue ──
    const revenueRow = findRow('Revenu total', 8, 25);
    const totalRevenue = revenueRow >= 0 ? getNum(revenueRow, ACTUAL_COL) : null;
    console.log(`[parse-finances]   Revenue: row=${revenueRow}, actual(c7)=${totalRevenue}, budget(c11)=${revenueRow >= 0 ? getNum(revenueRow, BUDGET_COL) : '-'}`);
    
    // Settlements
    const settlementsRow = findRow('glements approuv', 10, 25);
    const approvedSettlements = settlementsRow >= 0 ? getNum(settlementsRow, ACTUAL_COL) : null;
    
    // ── Main d'oeuvre (charges salariales propres) ──
    const salaryCostRow = findRow('Total des charges salariales', 20, 40);
    const laborCost = salaryCostRow >= 0 ? getNum(salaryCostRow, ACTUAL_COL) : null;
    const rafLabor = salaryCostRow >= 0 ? getNum(salaryCostRow, RAF_COL) : null;
    console.log(`[parse-finances]   Labor: row=${salaryCostRow}, actual=${laborCost}, raf=${rafLabor}`);
    
    // Labor hours & rate (for reference)
    const laborHoursRow = findRow('heures des ouvriers', 18, 35);
    const laborHours = laborHoursRow >= 0 ? getNum(laborHoursRow, ACTUAL_COL) : null;
    const rateRow = findRow('taux horaire', laborHoursRow > 0 ? laborHoursRow : 20, (laborHoursRow > 0 ? laborHoursRow : 20) + 8);
    const laborHourlyRate = rateRow >= 0 ? getNum(rateRow, ACTUAL_COL) : null;
    
    // ── External labor (Performance externe en régie) ──
    // After salary section, look for "Total" that indicates ext. labor total
    let externalLaborCost: number | null = null;
    if (salaryCostRow >= 0) {
      // Look for "performance externe" or the next "Total" row after salary
      const extRow = findRow('performance ext', salaryCostRow + 1, salaryCostRow + 20);
      if (extRow >= 0) {
        const extTotalRow = findRow('Total', extRow, extRow + 10);
        externalLaborCost = extTotalRow >= 0 ? getNum(extTotalRow, ACTUAL_COL) : null;
      } else {
        // Fallback: look for next "Total" after salary
        const nextTotalRow = findRow('Total', salaryCostRow + 2, salaryCostRow + 15);
        const nextVal = nextTotalRow >= 0 ? getNum(nextTotalRow, ACTUAL_COL) : null;
        // Only use if different from laborCost
        if (nextVal !== null && nextVal !== laborCost) {
          externalLaborCost = nextVal;
        }
      }
    }
    
    // ── Sous-traitance (SST forfait) ──
    // Find "Montant forfaitaire total OA" or the total of the SST section
    let subcontractorCost: number | null = null;
    let rafSubcontractor: number | null = null;
    const sstHeaderRow = findRow('STT forfait', 40, 65);
    if (sstHeaderRow >= 0) {
      // The total is the last row in this section with "Montant forfaitaire total OA"
      const sstTotalRow = findRow('Montant forfaitaire total', sstHeaderRow, sstHeaderRow + 15);
      if (sstTotalRow >= 0) {
        subcontractorCost = getNum(sstTotalRow, ACTUAL_COL);
        rafSubcontractor = getNum(sstTotalRow, RAF_COL);
      } else {
        // Fallback: find the last row before section separator
        for (let i = sstHeaderRow + 10; i > sstHeaderRow; i--) {
          const val = getNum(i, ACTUAL_COL);
          if (val !== null && val > 0) {
            subcontractorCost = val;
            rafSubcontractor = getNum(i, RAF_COL);
            break;
          }
        }
      }
    }
    // Alternative: look for "Sous-traitance" or the SST summary row
    if (subcontractorCost === null) {
      const altRow = findRow('Sous-traitance', 35, 90);
      if (altRow >= 0) {
        const altTotalRow = findRow('Total', altRow, altRow + 35);
        subcontractorCost = altTotalRow >= 0 ? getNum(altTotalRow, ACTUAL_COL) : null;
        rafSubcontractor = altTotalRow >= 0 ? getNum(altTotalRow, RAF_COL) : null;
      }
    }
    console.log(`[parse-finances]   SST: actual=${subcontractorCost}, raf=${rafSubcontractor}`);
    
    // ── Gestion de projet (Encadrement) ──
    let engineeringCost: number | null = null;
    let rafEngineering: number | null = null;
    const gestionTotalRow = findRow('Gestion totale du projet', 60, 85);
    if (gestionTotalRow >= 0) {
      engineeringCost = getNum(gestionTotalRow, ACTUAL_COL);
      rafEngineering = getNum(gestionTotalRow, RAF_COL);
    } else {
      // Fallback: look for "Gestion de projet" header and sum individual rows
      const gestionRow = findRow('Gestion de projet', 55, 80);
      if (gestionRow >= 0) {
        // Find the total row (usually "Gestion totale du projet:" within 15 rows)
        const totalRow = findRow('Total', gestionRow + 1, gestionRow + 15);
        if (totalRow >= 0) {
          engineeringCost = getNum(totalRow, ACTUAL_COL);
          rafEngineering = getNum(totalRow, RAF_COL);
        }
      }
    }
    console.log(`[parse-finances]   Encadrement: actual=${engineeringCost}, raf=${rafEngineering}`);
    
    // ── Matériel ──
    // The total for materials is at the row just before "COÛTS TOTALS"
    let materialCost: number | null = null;
    let rafMaterial: number | null = null;
    const coutsTotalsRow = findRow('TS TOTALS', 200, 220);
    if (coutsTotalsRow >= 0) {
      // Material total is typically 2 rows above (the summary row of all material items)
      materialCost = getNum(coutsTotalsRow - 2, ACTUAL_COL);
      rafMaterial = getNum(coutsTotalsRow - 2, RAF_COL);
      // Validate: should be a significant number. If not, try row just before
      if (materialCost === null || materialCost === 0) {
        materialCost = getNum(coutsTotalsRow - 1, ACTUAL_COL);
        rafMaterial = getNum(coutsTotalsRow - 1, RAF_COL);
      }
    }
    // Fallback: search for "Total des achats" or "Total matériaux"
    if (materialCost === null) {
      const matTotalRow = findRow('Total des achats', 80, 210);
      if (matTotalRow >= 0) {
        materialCost = getNum(matTotalRow, ACTUAL_COL);
        rafMaterial = getNum(matTotalRow, RAF_COL);
      }
    }
    console.log(`[parse-finances]   Matériel: actual=${materialCost}, raf=${rafMaterial}`);
    
    // ── Frais généraux ──
    let siteCost: number | null = null;
    let rafSite: number | null = null;
    const fraisRow = findRow('Frais g', 210, 245);
    if (fraisRow >= 0) {
      siteCost = getNum(fraisRow, ACTUAL_COL);
      rafSite = getNum(fraisRow, RAF_COL);
    }
    console.log(`[parse-finances]   Frais généraux: actual=${siteCost}, raf=${rafSite}`);
    
    // ── Provisions ──
    let provisionsCost: number | null = null;
    const provRow = findRow('Provision', 170, 230);
    if (provRow >= 0) {
      const provTotalRow = findRow('Total', provRow, provRow + 12);
      provisionsCost = provTotalRow >= 0 ? getNum(provTotalRow, ACTUAL_COL) : null;
    }
    
    // ── COÛTS TOTAUX ──
    let totalCost: number | null = null;
    let rafTotal: number | null = null;
    if (coutsTotalsRow >= 0) {
      totalCost = getNum(coutsTotalsRow, ACTUAL_COL);
      rafTotal = getNum(coutsTotalsRow, RAF_COL);
    }
    // If not found via "COÛTS TOTALS", compute from components
    if (totalCost === null) {
      totalCost = (laborCost || 0) + (externalLaborCost || 0) + (subcontractorCost || 0) +
                  (materialCost || 0) + (engineeringCost || 0) + (siteCost || 0) + (provisionsCost || 0) || null;
    }
    
    // ── Résultat ──
    const resultRow = findRow('sultat y compris', 210, 260);
    // Use BUDGET_COL (col 11 = FIN PRÉVUE) for the result — this is the projected final result  
    // Col 7 shows the result of actual vs. actuals spent so far (often very negative because
    // the project isn't finished yet and costs have been incurred but not all revenue billed)
    // Col 11 shows the true projected result at project end
    const result = resultRow >= 0 ? getNum(resultRow, BUDGET_COL) : null;
    
    // Margin %: right after result row
    const marginPercent = resultRow >= 0 ? getNum(resultRow + 1, BUDGET_COL) : null;
    
    console.log(`[parse-finances]   Result: row=${resultRow}, projected(c11)=${result}, margin=${marginPercent}`);
    console.log(`[parse-finances]   Total Cost: actual=${totalCost}, raf=${rafTotal}`);
    
    results.push({
      month,
      sheetName,
      totalRevenue: totalRevenue ?? getNum(revenueRow, BUDGET_COL),
      approvedSettlements,
      laborHours,
      laborHourlyRate,
      laborCost,
      externalLaborCost,
      subcontractorCost,
      materialCost,
      engineeringCost,
      siteCost,
      provisionsCost,
      totalCost,
      result,
      marginPercent,
      plannedWorkers: null,
      plannedDays: null,
      rafLabor,
      rafSubcontractor,
      rafMaterial,
      rafEngineering,
      rafSite,
      rafTotal,
    });
  }
  
  results.sort((a, b) => a.month.getTime() - b.month.getTime());
  console.log(`[parse-finances] Total snapshots parsed: ${results.length}`);
  return results;
}

function parseMonthFromSheetName(name: string): Date {
  const lower = name.toLowerCase().trim();
  const monthMap: Record<string, number> = {
    'janvier': 0, 'jan': 0,
    'février': 1, 'fevrier': 1, 'fev': 1, 'feb': 1,
    'mars': 2, 'mar': 2,
    'avril': 3, 'avr': 3, 'apr': 3,
    'mai': 4, 'may': 4,
    'juin': 5, 'jun': 5,
    'juillet': 6, 'jul': 6,
    'août': 7, 'aout': 7, 'aug': 7,
    'septembre': 8, 'sept': 8, 'sep': 8,
    'octobre': 9, 'oct': 9,
    'novembre': 10, 'nov': 10,
    'décembre': 11, 'decembre': 11, 'dec': 11,
  };
  
  for (const [monthName, monthIdx] of Object.entries(monthMap)) {
    if (lower.includes(monthName)) {
      const yearMatch = lower.match(/(\d{2,4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : 2025;
      if (year < 100) year += 2000;
      return new Date(year, monthIdx, 1);
    }
  }
  
  const dmyMatch = lower.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3]);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
  }
  
  return new Date(2025, 0, 1);
}
