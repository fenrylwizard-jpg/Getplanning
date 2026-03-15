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
 * Relevant sheet to parse:
 * - "Gantt Chart" 
 * 
 * Structure:
 * Header area: row 5 
 * Data starts: row 6+
 */
export function parseEtudes(buffer: Buffer): EtudeTaskData[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const results: EtudeTaskData[] = [];
  
  console.log('[parse-etudes] Sheet names found:', wb.SheetNames);
  
  // Try to find the gantt chart sheet - flexible matching
  let ws = wb.Sheets['Gantt Chart'];
  let usedSheet = 'Gantt Chart';
  
  if (!ws) {
    // Try case-insensitive and partial match
    const ganttName = wb.SheetNames.find(n => 
      n.toLowerCase().includes('gantt') || 
      n.toLowerCase().includes('planning') ||
      n.toLowerCase().includes('études') ||
      n.toLowerCase().includes('etudes') ||
      n.toLowerCase().includes('suivi')
    );
    if (ganttName) {
      ws = wb.Sheets[ganttName];
      usedSheet = ganttName;
      console.log('[parse-etudes] Using sheet by fuzzy match:', ganttName);
    } else {
      // Fall back to first sheet
      usedSheet = wb.SheetNames[0];
      ws = wb.Sheets[usedSheet];
      console.log('[parse-etudes] No matching sheet found, trying first sheet:', usedSheet);
    }
  } else {
    console.log('[parse-etudes] Found exact "Gantt Chart" sheet');
  }
  
  if (!ws || !ws['!ref']) { console.warn('[parse-etudes] No usable sheet'); return results; }
  
  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('[parse-etudes] Total rows:', data.length);
  if (data.length < 5) return results;
  
  // Log first 10 rows for debugging
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = (row as unknown[]).slice(0, 8).map((c: unknown) => String(c || '').substring(0, 25)).join(' | ');
    console.log(`[parse-etudes]   Row ${i}: ${rowStr}`);
  }
  
  // Find the header row - typically containing "Activité", "Assigné à"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.map((c: unknown) => String(c || '')).join('|');
    if (rowStr.includes('Activité') || rowStr.includes('Assigné à') || rowStr.includes('Activity') || rowStr.includes('Task')) {
      headerRowIdx = i;
      break;
    }
  }
  
  if (headerRowIdx === -1) {
    headerRowIdx = 4; // 0-indexed, row 5 in Excel
    console.log('[parse-etudes] Header not detected, defaulting to row index 4');
  } else {
    console.log('[parse-etudes] Header row found at index:', headerRowIdx);
  }
  
  const header = data[headerRowIdx]?.map((c: unknown) => String(c || '').trim()) || [];
  
  const findCol = (keywords: string[]): number => {
    for (const keyword of keywords) {
      const idx = header.findIndex((h: string) => 
        h.toLowerCase().includes(keyword.toLowerCase())
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  // Map columns for Simple Gantt
  const colWbs = findCol(['#']);
  const colActivity = findCol(['Activité', 'Activity']);
  const colAssignee = findCol(['Assigné à', 'Assigned to']);
  const colStart = findCol(['Début', 'Start']);
  const colEnd = findCol(['Fin', 'End']);
  const colDuration = findCol(['Jours', 'Duration', 'Days']);
  const colStatus = findCol(['Statut', 'Status']);
  const colProgress = findCol(['%', 'réalisé', 'progress']);
  
  if (colActivity === -1) {
    console.warn("Could not find required 'Activité' column in Simple Gantt sheet.");
    return results;
  }

  // Parse data rows
  const startRow = headerRowIdx + 1;
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const getStr = (colIdx: number): string | null => {
      if (colIdx < 0 || colIdx >= row.length) return null;
      const val = String(row[colIdx] || '').trim();
      return val || null;
    };
    
    const getNum = (colIdx: number): number | null => {
      if (colIdx < 0 || colIdx >= row.length) return null;
      const val = row[colIdx];
      if (val === '' || val === undefined || val === null) return null;
      // handle percentage formatting like "50%" or decimal standard 0.5
      let strVal = String(val).trim();
      if (strVal.endsWith('%')) {
        strVal = strVal.substring(0, strVal.length - 1);
        const num = Number(strVal);
        return isNaN(num) ? null : num; // store as 0-100 or 0-1 based on user preference, we'll keep pure numbers
      }
      
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const getDate = (colIdx: number): Date | null => {
      if (colIdx < 0 || colIdx >= row.length) return null;
      return excelDateToJS(row[colIdx]);
    };
    
    const activity = getStr(colActivity);
    
    // Skip empty rows or rows which are just structural blanks
    if (!activity) continue;
    
    // Sometimes structural summary rows are just caps or lack assignees, etc. 
    // We add them anyway but they might just serve as headers "PREMIERES ACTIONS"
    let progress = getNum(colProgress);
    
    // Make sure a raw 0.5 becomes 50 if that's what we expect, but usually 
    // sheet_to_json returns decimals for percents unless raw string parsing
    // Let's ensure percentage is scaled to 0-100 if it's less than 1.
    if (progress !== null && progress <= 1 && typeof row[colProgress] === 'number') {
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
  
  return results;
}
