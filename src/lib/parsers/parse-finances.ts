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
 * Each sheet = 1 monthly snapshot (222 rows x 31 cols)
 * Key row positions (0-indexed from data array):
 *   Row 1:  Title "End of Completion (EoC)"
 *   Row 8:  Headers: BUDGET INITIAL, BUDGET D'EXÉCUTION, État des lieux, Estimation, FIN PRÉVUE
 *   Row 12: Revenu total → col D = budget, col H = état des lieux (actual invoiced), col L = FIN PRÉVUE
 *   Row 15: Règlements approuvés
 *   Row 20: Revenu total (with settlements)
 *   Row 25: Main d'oeuvre – # heures des ouvriers
 *   Row 29: taux horaire
 *   Row 30: Total des charges salariales propres
 *   Row 35: External labor total  
 *   ~Row 45-65: Sous-traitance
 *   ~Row 70-130: Material purchases 
 *   ~Row 150-180: Engineering/internal costs
 *   Row 221: Résultat y compris révision
 *   Row 222: Margin %
 */
export function parseFinances(buffer: Buffer): FinanceSnapshotData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: FinanceSnapshotData[] = [];
  
  // Skip sheets that aren't monthly EoC sheets
  const skipSheets = ['sheet1', 'bbd export', 'ea'];
  
  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase().trim();
    if (skipSheets.some(s => lower === s || lower.startsWith('ea '))) continue;
    
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;
    
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (data.length < 30) continue; // Too small to be an EoC sheet
    
    // Verify this looks like an EoC sheet
    const firstRow = data[0]?.map((c: any) => String(c || '')).join('') || '';
    if (!firstRow.includes('End of Completion') && !firstRow.includes('EoC')) {
      // Try to detect by row structure
      const row8 = data[7]?.map((c: any) => String(c || '')).join('') || '';
      if (!row8.includes('BUDGET') && !row8.includes('budget')) continue;
    }
    
    // Parse month from the sheet header row 8 (État des lieux date)
    let month: Date;
    const dateHeader = String(data[7]?.[7] || '').trim(); // Column H, row 8
    const dateMatch = dateHeader.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      month = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
    } else {
      // Try to parse from sheet name
      month = parseMonthFromSheetName(sheetName);
    }
    
    const getNum = (rowIdx: number, colIdx: number): number | null => {
      if (rowIdx >= data.length) return null;
      const row = data[rowIdx];
      if (!row || colIdx >= row.length) return null;
      const val = row[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    // Find key rows by searching for keywords
    const findRow = (keyword: string, startFrom = 0, maxRows = data.length): number => {
      for (let i = startFrom; i < Math.min(data.length, maxRows); i++) {
        const row = data[i];
        if (!row) continue;
        const rowStr = row.map((c: any) => String(c || '')).join('|');
        if (rowStr.includes(keyword)) return i;
      }
      return -1;
    };
    
    // Column L (index 11) = FIN PRÉVUE DU PROJET
    const finCol = 11;
    
    // Revenue: Find "Revenu total:" row (usually around row 20)
    const revenueRow = findRow('Revenu total:', 15, 25);
    const totalRevenue = revenueRow >= 0 ? getNum(revenueRow, finCol) : null;
    
    // Settlements: Find "Règlements approuvés" (usually row 15)
    const settlementsRow = findRow('glements approuv', 12, 20);
    const approvedSettlements = settlementsRow >= 0 ? getNum(settlementsRow, finCol) : null;
    
    // Labor: Find "# heures des ouvriers" (usually row 25)
    const laborHoursRow = findRow('heures des ouvriers', 20, 30);
    const laborHours = laborHoursRow >= 0 ? getNum(laborHoursRow, finCol) : null;
    
    // Hourly rate: Find "taux horaire" near labor
    const rateRow = findRow('taux horaire', laborHoursRow > 0 ? laborHoursRow : 25, (laborHoursRow > 0 ? laborHoursRow : 25) + 6);
    const laborHourlyRate = rateRow >= 0 ? getNum(rateRow, finCol) : null;
    
    // Total salary: Find "Total des charges salariales"
    const salaryCostRow = findRow('Total des charges salariales', 25, 35);
    const laborCost = salaryCostRow >= 0 ? getNum(salaryCostRow, finCol) : null;
    
    // External labor: Find external labor total (after salary cost)
    const extLaborRow = findRow('Total', salaryCostRow > 0 ? salaryCostRow + 2 : 32, 45);
    const externalLaborCost = extLaborRow >= 0 ? getNum(extLaborRow, finCol) : null;
    
    // Subcontractors: Find "Sous-traitance" total
    const subRow = findRow('Sous-traitance', 40, 80);
    let subcontractorCost: number | null = null;
    if (subRow >= 0) {
      // Find the total row in the subcontractor section
      const subTotalRow = findRow('Total', subRow, subRow + 30);
      subcontractorCost = subTotalRow >= 0 ? getNum(subTotalRow, finCol) : null;
    }
    
    // Materials: Find "Mat" section total  
    const matRow = findRow('riel', 60, 150);
    let materialCost: number | null = null;
    if (matRow >= 0) {
      // Look for a "Total" nearby
      const matTotalRow = findRow('Total', matRow, matRow + 60);
      materialCost = matTotalRow >= 0 ? getNum(matTotalRow, finCol) : null;
    }
    
    // Engineering: Find "Chargé d'affaires" or internal costs section
    const engRow = findRow("Charg", 140, 200);
    let engineeringCost: number | null = null;
    if (engRow >= 0) {
      // Sum: chargé d'affaires + ingénieur projet + dessinateurs
      const val1 = getNum(engRow + 3, finCol); // Total CA
      const ipRow = findRow('nieur', engRow + 3, engRow + 15);
      const val2 = ipRow >= 0 ? getNum(ipRow + 3, finCol) : null;
      const dessRow = findRow('essin', ipRow > 0 ? ipRow + 3 : engRow + 10, engRow + 25);
      const val3 = dessRow >= 0 ? getNum(dessRow + 3, finCol) : null;
      engineeringCost = (val1 || 0) + (val2 || 0) + (val3 || 0) || null;
    }
    
    // Provisions: Find "Provision"
    const provRow = findRow('Provision', 180, 220);
    let provisionsCost: number | null = null;
    if (provRow >= 0) {
      const provTotalRow = findRow('Total', provRow, provRow + 10);
      provisionsCost = provTotalRow >= 0 ? getNum(provTotalRow, finCol) : null;
    }
    
    // Result: Find "Résultat y compris révision" (usually row 221)
    const resultRow = findRow('sultat y compris', 210, 225);
    const result = resultRow >= 0 ? getNum(resultRow, finCol) : null;
    
    // Margin %: usually right after result
    const marginPercent = resultRow >= 0 ? getNum(resultRow + 1, finCol) : null;
    
    // Calculate total cost = revenue - result
    const totalCost = (totalRevenue && result) ? totalRevenue - result : null;
    
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
      siteCost: null, // Complex to extract, will improve later
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
