import * as XLSX from 'xlsx';

export interface PurchaseCategoryData {
  category: string;
  peInitials: string | null;
  status: string | null;
  isInterco: boolean;
  inProgress: boolean;
  offerPriceSoum: number | null;
  commercialDiscount: number | null;
  hypothesisInjected: number | null;
  costPrice: number | null;
  supplierSoum: string | null;
  supplierExe: string | null;
  negotiatedPrice: number | null;
  returnAmount: number | null;
  comments: string | null;
}

/**
 * Parse the Synthèse sheet from "Comparatif achats.xlsx"
 * The Synthèse sheet is typically the 3rd sheet (index 2).
 * 
 * Layout:
 * Row 6 (header): Initiales PE | Statut | Interco | PARTIE ACHATS | En traitement | ... | Prix offre soumission | Remise commerciale | Hypothèse injectée ODOO | Prix de revient/achat | ... | Fournisseur soumission | Fournisseur exécution | ... | Prix achat Négocié | RETURN | ... | Commentaires
 * Rows 8-31: Data rows (purchase categories)
 * Row 33: Totals
 */
export function parsePurchases(buffer: Buffer): PurchaseCategoryData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  
  console.log('[parse-purchases] Sheet names found:', wb.SheetNames);
  
  // Find the Synthèse sheet - try by name first, then by index
  let sheetName = wb.SheetNames.find(n => 
    n.toLowerCase().includes('synth') || n.toLowerCase().includes('recap')
  );
  if (!sheetName) {
    // Fallback to 3rd sheet (index 2) since it's typically there
    sheetName = wb.SheetNames[2] || wb.SheetNames[0];
    console.log('[parse-purchases] No "Synthèse" sheet found, using fallback:', sheetName);
  } else {
    console.log('[parse-purchases] Using sheet:', sheetName);
  }
  
  const ws = wb.Sheets[sheetName];
  if (!ws) { console.warn('[parse-purchases] Sheet not found'); return []; }
  
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('[parse-purchases] Total rows in sheet:', data.length);
  
  // Log first 10 rows for debugging
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.slice(0, 8).map((c: any) => String(c || '').substring(0, 20)).join(' | ');
    console.log(`[parse-purchases]   Row ${i}: ${rowStr}`);
  }
  
  // Find the header row by looking for "PARTIE ACHATS" or "Initiales PE"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.map((c: any) => String(c || '')).join('|');
    if (rowStr.includes('PARTIE ACHATS') || rowStr.includes('Initiales PE')) {
      headerRowIdx = i;
      break;
    }
  }
  
  if (headerRowIdx === -1) {
    console.warn('[parse-purchases] Could not find header row with "PARTIE ACHATS" or "Initiales PE" in first 15 rows');
    return [];
  }
  console.log('[parse-purchases] Header row found at index:', headerRowIdx);
  
  const header = data[headerRowIdx].map((c: any) => String(c || '').trim());
  
  // Find column indices dynamically
  const findCol = (keywords: string[]): number => {
    for (const keyword of keywords) {
      const idx = header.findIndex((h: string) => 
        h.toLowerCase().includes(keyword.toLowerCase())
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  const colPE = findCol(['Initiales PE', 'Initiales']);
  const colStatus = findCol(['Statut']);
  const colInterco = findCol(['Interco']);
  const colCategory = findCol(['PARTIE ACHATS', 'Partie achats']);
  const colInProgress = findCol(['En traitement']);
  const colOfferPrice = findCol(['Prix offre soumission', 'offre soumission']);
  const colDiscount = findCol(['Remise commerciale']);
  const colHypothesis = findCol(['Hypothèse', 'Hypoth']);
  const colCostPrice = findCol(['Prix de revient', 'revient']);
  const colSupplierSoum = findCol(['Fournisseur soumission', 'Fournisseur soum']);
  const colSupplierExe = findCol(['Fournisseur ex', 'exécution']);
  const colNegotiatedPrice = findCol(['Prix achat', 'Négocié', 'N\u00e9goci']);
  const colReturn = findCol(['RETURN']);
  const colComments = findCol(['Commentaires', 'VRI']);
  
  const results: PurchaseCategoryData[] = [];
  
  // Parse data rows (start after header, skip empty/total rows)
  for (let i = headerRowIdx + 2; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    // Get category name
    const categoryName = colCategory >= 0 ? String(row[colCategory] || '').trim() : '';
    
    // Skip empty rows, total rows, and rows without a category
    if (!categoryName) continue;
    if (categoryName.toLowerCase().startsWith('total')) continue;
    
    const getNum = (colIdx: number): number | null => {
      if (colIdx < 0 || colIdx >= row.length) return null;
      const val = row[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const getStr = (colIdx: number): string | null => {
      if (colIdx < 0 || colIdx >= row.length) return null;
      const val = String(row[colIdx] || '').trim();
      return val || null;
    };
    
    results.push({
      category: categoryName,
      peInitials: getStr(colPE),
      status: getStr(colStatus),
      isInterco: getStr(colInterco)?.toLowerCase() === 'x',
      inProgress: !!getNum(colInProgress),
      offerPriceSoum: getNum(colOfferPrice),
      commercialDiscount: getNum(colDiscount),
      hypothesisInjected: getNum(colHypothesis),
      costPrice: getNum(colCostPrice),
      supplierSoum: getStr(colSupplierSoum),
      supplierExe: getStr(colSupplierExe),
      negotiatedPrice: getNum(colNegotiatedPrice),
      returnAmount: getNum(colReturn),
      comments: getStr(colComments),
    });
  }
  
  return results;
}
