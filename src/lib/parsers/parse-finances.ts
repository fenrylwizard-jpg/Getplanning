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
}

/**
 * Parse "Suivi financier.xlsx" — monthly EoC snapshots.
 * 
 * Each sheet = 1 monthly snapshot (222+ rows x 31 cols)
 * 
 * Actual layout (0-indexed):
 *   Row 0:  "End of Completion (EoC)"
 *   Row 1-5: Project info / version
 *   Row 7:  Headers: BUDGET INITIAL D'EXÉCUTION | BUDGET D'EXÉCUTION | État des lieux DD/MM/YYYY | ...
 *   Row 11: "Revenu total" with values at col 3 (budget), col 7 (état des lieux), col 11 (FIN PRÉVUE)
 *   Row 14-15: Règlements approuvés
 *   Row 24: Main d'oeuvre – # heures
 *   Row 28: taux horaire
 *   Row 29: Total charges salariales
 *   ...
 *   Last rows: Résultat y compris révision, margin %
 */
export function parseFinances(buffer: Buffer): FinanceSnapshotData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: FinanceSnapshotData[] = [];
  
  console.log('[parse-finances] Sheet names found:', wb.SheetNames);
  
  // Skip sheets that aren't monthly EoC sheets
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
      // Try row 7/8 for BUDGET
      const row7Str = data[7]?.map((c: unknown) => String(c || '')).join('') || '';
      if (!row7Str.includes('BUDGET') && !row7Str.includes('budget')) {
        console.log(`[parse-finances] Sheet "${sheetName}" doesn't look like EoC, skipping`);
        continue;
      }
    }
    
    console.log(`[parse-finances] Processing EoC sheet: "${sheetName}"`);
    
    // Parse month from the sheet header row 7 (État des lieux date)
    let month: Date;
    const row7 = data[7];
    // Search for a date in row 7 - it's typically in the "État des lieux DD/MM/YYYY" cell
    let dateFound = false;
    if (row7) {
      for (let c = 5; c < Math.min((row7 as unknown[]).length, 15); c++) {
        const cellStr = String((row7 as unknown[])[c] || '').trim();
        // Match dates like "État des lieux 08/06/2025" or "31/01/26" or "28.02.26"
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
    
    const getNum = (rowIdx: number, colIdx: number): number | null => {
      if (rowIdx >= data.length) return null;
      const row = data[rowIdx] as unknown[];
      if (!row || colIdx >= row.length) return null;
      const val = row[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    // Generic row finder by keyword
    const findRow = (keyword: string, startFrom = 0, maxRows = data.length): number => {
      for (let i = startFrom; i < Math.min(data.length, maxRows); i++) {
        const row = data[i] as unknown[];
        if (!row) continue;
        const rowStr = row.map((c: unknown) => String(c || '')).join('|');
        if (rowStr.includes(keyword)) return i;
      }
      return -1;
    };
    
    // Column L (index 11) = FIN PRÉVUE DU PROJET
    const finCol = 11;
    
    // Revenue: Find "Revenu total" row — in real files it's at row 11
    const revenueRow = findRow('Revenu total', 8, 30);
    const totalRevenue = revenueRow >= 0 ? getNum(revenueRow, finCol) : null;
    console.log(`[parse-finances]   Revenu total: row=${revenueRow}, value=${totalRevenue}`);
    
    // Settlements: Find "Règlements approuvés" (usually row 14-15)
    const settlementsRow = findRow('glements approuv', 10, 25);
    const approvedSettlements = settlementsRow >= 0 ? getNum(settlementsRow, finCol) : null;
    
    // Revenue with settlements: Find second "Revenu total:" after settlements
    const revenueTotalRow = findRow('Revenu total:', revenueRow > 0 ? revenueRow + 1 : 15, 30);
    
    // Labor: Find "# heures des ouvriers" or "heures"
    const laborHoursRow = findRow('heures des ouvriers', 18, 35);
    const laborHours = laborHoursRow >= 0 ? getNum(laborHoursRow, finCol) : null;
    
    // Hourly rate: Find "taux horaire" near labor
    const rateSearchStart = laborHoursRow > 0 ? laborHoursRow : 20;
    const rateRow = findRow('taux horaire', rateSearchStart, rateSearchStart + 8);
    const laborHourlyRate = rateRow >= 0 ? getNum(rateRow, finCol) : null;
    
    // Total salary: Find "Total des charges salariales"
    const salaryCostRow = findRow('Total des charges salariales', 20, 40);
    const laborCost = salaryCostRow >= 0 ? getNum(salaryCostRow, finCol) : null;
    
    // External labor: Find next "Total" after salary
    const extLaborRow = findRow('Total', salaryCostRow > 0 ? salaryCostRow + 2 : 30, 50);
    const externalLaborCost = extLaborRow >= 0 ? getNum(extLaborRow, finCol) : null;
    
    // Subcontractors: Find "Sous-traitance" total
    const subRow = findRow('Sous-traitance', 35, 90);
    let subcontractorCost: number | null = null;
    if (subRow >= 0) {
      const subTotalRow = findRow('Total', subRow, subRow + 35);
      subcontractorCost = subTotalRow >= 0 ? getNum(subTotalRow, finCol) : null;
    }
    
    // Materials: Find "riel" section total  
    const matRow = findRow('riel', 50, 160);
    let materialCost: number | null = null;
    if (matRow >= 0) {
      const matTotalRow = findRow('Total', matRow, matRow + 70);
      materialCost = matTotalRow >= 0 ? getNum(matTotalRow, finCol) : null;
    }
    
    // Engineering: Find "Chargé d'affaires" or internal costs section
    const engRow = findRow("Charg", 130, 210);
    let engineeringCost: number | null = null;
    if (engRow >= 0) {
      const val1 = getNum(engRow + 3, finCol);
      const ipRow = findRow('nieur', engRow + 3, engRow + 15);
      const val2 = ipRow >= 0 ? getNum(ipRow + 3, finCol) : null;
      const dessRow = findRow('essin', ipRow > 0 ? ipRow + 3 : engRow + 10, engRow + 25);
      const val3 = dessRow >= 0 ? getNum(dessRow + 3, finCol) : null;
      engineeringCost = (val1 || 0) + (val2 || 0) + (val3 || 0) || null;
    }
    
    // Provisions: Find "Provision"
    const provRow = findRow('Provision', 170, 230);
    let provisionsCost: number | null = null;
    if (provRow >= 0) {
      const provTotalRow = findRow('Total', provRow, provRow + 12);
      provisionsCost = provTotalRow >= 0 ? getNum(provTotalRow, finCol) : null;
    }
    
    // Result: Find "Résultat y compris révision" — could be in rows 200-250
    const resultRow = findRow('sultat y compris', 195, 260);
    const result = resultRow >= 0 ? getNum(resultRow, finCol) : null;
    
    // Margin %: usually right after result
    const marginPercent = resultRow >= 0 ? getNum(resultRow + 1, finCol) : null;
    
    // Calculate total cost = revenue - result
    const totalCost = (totalRevenue && result) ? totalRevenue - result : null;
    
    console.log(`[parse-finances]   Result: row=${resultRow}, revenue=${totalRevenue}, result=${result}, margin=${marginPercent}`);
    
    results.push({
      month,
      sheetName,
      totalRevenue,
      approvedSettlements,
      laborHours,
      laborHourlyRate,
      laborCost,
      externalLaborCost: externalLaborCost !== laborCost ? externalLaborCost : null,
      subcontractorCost,
      materialCost,
      engineeringCost,
      siteCost: null,
      provisionsCost,
      totalCost,
      result,
      marginPercent,
      plannedWorkers: null,
      plannedDays: null,
    });
  }
  
  // Sort by date
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
  
  // Try "Month Year" format
  for (const [monthName, monthIdx] of Object.entries(monthMap)) {
    if (lower.includes(monthName)) {
      const yearMatch = lower.match(/(\d{2,4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : 2025;
      if (year < 100) year += 2000;
      return new Date(year, monthIdx, 1);
    }
  }
  
  // Try "DD.MM.YY" format (e.g., "31.12.25")
  const dmyMatch = lower.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3]);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
  }
  
  return new Date(2025, 0, 1); // Fallback
}
