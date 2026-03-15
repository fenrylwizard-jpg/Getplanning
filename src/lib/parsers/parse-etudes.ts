import * as XLSX from 'xlsx';

export interface EtudeTaskData {
  wbs: string | null;
  activity: string;
  assignedTo: string | null;
  startDate: Date | null;
  endDate: Date | null;
  duration: number | null;
  status: string | null;
  progress: number | null;
}

function excelDateToJS(serial: unknown): Date | null {
  if (!serial) return null;
  const num = Number(serial);
  if (isNaN(num) || num < 1000) return null;
  // Excel serial date → JS Date
  const utc_days = Math.floor(num - 25569);
  return new Date(utc_days * 86400 * 1000);
}

/**
 * Parse "Suivi des études .xlsx".
 * 
 * Real data is in the "Simple Gantt" sheet (NOT "Gantt Chart" which has template data).
 * 
 * Structure of "Simple Gantt":
 * Row 3 (0-indexed): Header row with columns:
 *   [0] # | [1] Activité | [2] Assigné à | [3] Début | [4] Fin | [5] Jours | [6] Statut | [7] % réalisé
 * Row 4+: Data rows (tasks like "Extension Institut Herlin - ELEC ...")
 * Dates are Excel serial numbers (e.g., 45768).
 */
export function parseEtudes(buffer: Buffer): EtudeTaskData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: EtudeTaskData[] = [];
  
  console.log('[parse-etudes] Sheet names found:', wb.SheetNames);
  
  // Priority order for sheet matching:
  // 1. "Simple Gantt" (the real data sheet)
  // 2. Any sheet with "gantt" + "simple" in name
  // 3. Any sheet with "suivi" or "planning" or "études"
  // 4. "Gantt Chart" (template, last resort)
  // 5. First sheet
  let ws: XLSX.WorkSheet | undefined;
  let usedSheet = '';
  
  const priorities = [
    (n: string) => n === 'Simple Gantt',
    (n: string) => n.toLowerCase().includes('simple') && n.toLowerCase().includes('gantt'),
    (n: string) => n.toLowerCase().includes('suivi') || n.toLowerCase().includes('planning'),
    (n: string) => n.toLowerCase().includes('gantt'),
    (n: string) => n.toLowerCase().includes('études') || n.toLowerCase().includes('etudes'),
  ];
  
  for (const test of priorities) {
    const match = wb.SheetNames.find(test);
    if (match && wb.Sheets[match]) {
      ws = wb.Sheets[match];
      usedSheet = match;
      break;
    }
  }
  
  if (!ws) {
    usedSheet = wb.SheetNames[0];
    ws = wb.Sheets[usedSheet];
    console.log('[parse-etudes] No matching sheet, using first:', usedSheet);
  } else {
    console.log('[parse-etudes] Using sheet:', usedSheet);
  }
  
  if (!ws || !ws['!ref']) { console.warn('[parse-etudes] No usable sheet'); return results; }
  
  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('[parse-etudes] Total rows:', data.length);
  if (data.length < 3) return results;
  
  // Find the header row - scan first 15 rows for "Activité" or "Activity"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.map((c: unknown) => String(c || '')).join('|');
    if (rowStr.includes('Activité') || rowStr.includes('Assigné à') || 
        rowStr.includes('Activity') || rowStr.includes('Task')) {
      headerRowIdx = i;
      break;
    }
  }
  
  if (headerRowIdx === -1) {
    console.warn('[parse-etudes] Could not find header row with Activité/Activity');
    return results;
  }
  
  console.log('[parse-etudes] Header row found at index:', headerRowIdx);
  
  const header = data[headerRowIdx]?.map((c: unknown) => String(c || '').trim()) || [];
  console.log('[parse-etudes] Header columns:', header.filter(h => h).join(' | '));
  
  const findCol = (keywords: string[]): number => {
    for (const keyword of keywords) {
      const idx = header.findIndex((h: string) => 
        h.toLowerCase().includes(keyword.toLowerCase())
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  // Map columns
  const colWbs = findCol(['#']);
  const colActivity = findCol(['Activité', 'Activity']);
  const colAssignee = findCol(['Assigné à', 'Assigned to', 'Assigné']);
  const colStart = findCol(['Début', 'Start']);
  const colEnd = findCol(['Fin', 'End']);
  const colDuration = findCol(['Jours', 'Duration', 'Days']);
  const colStatus = findCol(['Statut', 'Status']);
  const colProgress = findCol(['%', 'réalisé', 'progress', 'Progress']);
  
  console.log('[parse-etudes] Column mapping:', { colWbs, colActivity, colAssignee, colStart, colEnd, colDuration, colStatus, colProgress });
  
  if (colActivity === -1) {
    console.warn("[parse-etudes] Could not find required 'Activité' column.");
    return results;
  }

  // Parse data rows
  const startRow = headerRowIdx + 1;
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const getStr = (colIdx: number): string | null => {
      if (colIdx < 0 || colIdx >= (row as unknown[]).length) return null;
      const val = String((row as unknown[])[colIdx] || '').trim();
      return val || null;
    };
    
    const getNum = (colIdx: number): number | null => {
      if (colIdx < 0 || colIdx >= (row as unknown[]).length) return null;
      const val = (row as unknown[])[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      let strVal = String(val).trim();
      if (strVal.endsWith('%')) {
        strVal = strVal.substring(0, strVal.length - 1);
        const num = Number(strVal);
        return isNaN(num) ? null : num;
      }
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const getDate = (colIdx: number): Date | null => {
      if (colIdx < 0 || colIdx >= (row as unknown[]).length) return null;
      return excelDateToJS((row as unknown[])[colIdx]);
    };
    
    const activity = getStr(colActivity);
    
    // Skip empty rows
    if (!activity) continue;
    
    // Skip rows that look like section headers (e.g. "> Activer le marché")
    // but include them anyway as they might be useful for context
    
    let progress = getNum(colProgress);
    // Scale 0-1 to 0-100 if needed
    if (progress !== null && progress <= 1 && typeof (row as unknown[])[colProgress] === 'number') {
      progress = progress * 100;
    }

    results.push({
      wbs: getStr(colWbs),
      activity: activity,
      assignedTo: getStr(colAssignee),
      startDate: getDate(colStart),
      endDate: getDate(colEnd),
      duration: getNum(colDuration),
      status: getStr(colStatus),
      progress: progress,
    });
  }
  
  console.log(`[parse-etudes] Parsed ${results.length} tasks`);
  return results;
}
