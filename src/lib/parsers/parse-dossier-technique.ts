import * as XLSX from 'xlsx';

export interface DossierDocumentData {
  /** Which sheet/category: 'materiel' | 'plans' | 'calculs' */
  category: 'materiel' | 'plans' | 'calculs';
  /** Document ID / name */
  documentId: string;
  /** Document object/description */
  description: string;
  /** Document type: FT, PL, SCH, NC */
  docType: string;
  /** Document number */
  docNumber: string | null;
  /** LOT */
  lot: string | null;
  /** Submitted date (Transmis le) */
  submittedDate: Date | null;
  /** Due date (Échu le) */
  dueDate: Date | null;
  /** BE (Bureau d'Études) status: APP, APR, ATT, BPE, ASB, REF */
  beStatus: string | null;
  /** AR (Architect) status */
  arStatus: string | null;
  /** Client status (only for Calculs) */
  clientStatus: string | null;
}

export interface DossierSummary {
  category: 'materiel' | 'plans' | 'calculs';
  label: string;
  total: number;
  transmitted: number;
  /** Status breakdown */
  statuses: Record<string, number>;
}

function excelDateToJS(serial: unknown): Date | null {
  if (!serial) return null;
  const num = Number(serial);
  if (isNaN(num) || num < 1000) return null;
  const utc_days = Math.floor(num - 25569);
  return new Date(utc_days * 86400 * 1000);
}

/**
 * Status code legend (from the Excel file itself):
 * ATT = En attente d'approbation
 * APP = Approuvé
 * APR = Approuvé avec remarques
 * BPE = Bon pour exécution
 * ASB = As built
 * REF = Refusé
 */

interface SheetConfig {
  sheetName: string;
  category: 'materiel' | 'plans' | 'calculs';
  label: string;
  headerRow: number; // 0-indexed row where header columns are
  dataStartRow: number;
  /** Column indices for key fields */
  cols: {
    documentId: number;
    description: number;
    docType: number;
    docNumber: number;
    lot: number;
    transmittedDate: number;
    dueDate: number;
    beStatusCol: number;
    arStatusCol: number;
    clientStatusCol: number; // -1 if n/a
  };
  /** How to detect template/test rows */
  templatePattern: RegExp;
}

const SHEET_CONFIGS: SheetConfig[] = [
  {
    sheetName: 'Suivi Matériel',
    category: 'materiel',
    label: 'Fiches Techniques',
    headerRow: 11,
    dataStartRow: 12,
    cols: {
      documentId: 5,     // ID Document
      description: 9,    // Objet du document
      docType: 10,       // Type Docu (FT)
      docNumber: 11,     // N° Docu
      lot: 6,            // LOT
      transmittedDate: 19, // Transmis le
      dueDate: 20,       // Échu le
      beStatusCol: 22,   // BE Statut
      arStatusCol: 24,   // AR Statut
      clientStatusCol: -1,
    },
    templatePattern: /test\s*x|template/i,
  },
  {
    sheetName: 'Suivi Docu Graphique',
    category: 'plans',
    label: 'Plans & Schémas',
    headerRow: 11,
    dataStartRow: 12,
    cols: {
      documentId: 3,     // ID Document
      description: 3,    // same as ID for this sheet
      docType: 8,        // Type Docu (PL, SCH)
      docNumber: 9,      // N° Docu
      lot: 4,            // LOT
      transmittedDate: 18, // Transmis le
      dueDate: 19,       // Échu le
      beStatusCol: 21,   // BE Statut
      arStatusCol: 23,   // AR Statut
      clientStatusCol: -1,
    },
    templatePattern: /test\s*x|template/i,
  },
  {
    sheetName: 'Suivi Calculs',
    category: 'calculs',
    label: 'Notes de Calcul',
    headerRow: 11,
    dataStartRow: 12,
    cols: {
      documentId: 4,     // ID Document
      description: 8,    // Objet du document
      docType: 9,        // Type Docu (NC)
      docNumber: 10,     // N° Docu
      lot: 5,            // LOT
      transmittedDate: 16, // Transmis le
      dueDate: 17,       // Échu le
      beStatusCol: 19,   // BE Statut
      arStatusCol: 21,   // AR Statut
      clientStatusCol: 23, // CLIENT Statut
    },
    templatePattern: /test\s*x|test\s*\d+|template/i,
  },
];

/**
 * Parse the dossier technique sheets from the études Excel file.
 * Returns per-document data and per-category summaries.
 */
export function parseDossierTechnique(buffer: Buffer): { 
  documents: DossierDocumentData[]; 
  summaries: DossierSummary[];
} {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const allDocuments: DossierDocumentData[] = [];
  const summaries: DossierSummary[] = [];
  
  console.log('[parse-dossier] Sheet names found:', wb.SheetNames);
  
  for (const config of SHEET_CONFIGS) {
    const ws = wb.Sheets[config.sheetName];
    if (!ws) {
      console.warn(`[parse-dossier] Sheet "${config.sheetName}" not found`);
      continue;
    }
    
    const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`[parse-dossier] Processing "${config.sheetName}" (${data.length} rows)`);
    
    const documents: DossierDocumentData[] = [];
    
    for (let i = config.dataStartRow; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row) continue;
      
      const getStr = (colIdx: number): string | null => {
        if (colIdx < 0 || colIdx >= row.length) return null;
        const val = String(row[colIdx] || '').trim();
        return val || null;
      };
      
      const docType = getStr(config.cols.docType);
      const docId = getStr(config.cols.documentId);
      const description = getStr(config.cols.description);
      const docNumber = getStr(config.cols.docNumber);
      
      // Skip empty rows (no doc type or no doc number)
      if (!docType && !docNumber) continue;
      
      // Skip template/test rows
      const checkStr = `${docId || ''} ${description || ''} ${getStr(3) || ''}`;
      if (config.templatePattern.test(checkStr)) {
        console.log(`[parse-dossier]   Skipping template row ${i}: ${checkStr.substring(0, 50)}`);
        continue;
      }
      
      // Skip rows with no actual content (just structure)
      if (!description && !docId) continue;
      
      const beStatus = getStr(config.cols.beStatusCol)?.toUpperCase() || null;
      const arStatus = getStr(config.cols.arStatusCol)?.toUpperCase() || null;
      const clientStatus = config.cols.clientStatusCol >= 0 ? 
        getStr(config.cols.clientStatusCol)?.toUpperCase() || null : null;
      
      documents.push({
        category: config.category,
        documentId: docId || `${docType}-${docNumber}`,
        description: description || docId || '',
        docType: docType || '',
        docNumber,
        lot: getStr(config.cols.lot),
        submittedDate: excelDateToJS(row[config.cols.transmittedDate]),
        dueDate: excelDateToJS(row[config.cols.dueDate]),
        beStatus,
        arStatus,
        clientStatus,
      });
    }
    
    console.log(`[parse-dossier]   Parsed ${documents.length} documents from "${config.sheetName}"`);
    
    // Build summary for this category
    // "Most authoritative" status = use the most advanced status column available
    // Priority: client > AR > BE
    const statusCounter: Record<string, number> = {};
    let transmitted = 0;
    
    for (const doc of documents) {
      // Determine the "final" status (most recent/authoritative)
      const finalStatus = doc.clientStatus || doc.arStatus || doc.beStatus || 'PENDING';
      statusCounter[finalStatus] = (statusCounter[finalStatus] || 0) + 1;
      
      if (doc.submittedDate) transmitted++;
    }
    
    summaries.push({
      category: config.category,
      label: config.label,
      total: documents.length,
      transmitted,
      statuses: statusCounter,
    });
    
    console.log(`[parse-dossier]   Summary: total=${documents.length}, transmitted=${transmitted}, statuses=`, statusCounter);
    
    allDocuments.push(...documents);
  }
  
  console.log(`[parse-dossier] Total: ${allDocuments.length} documents, ${summaries.length} categories`);
  return { documents: allDocuments, summaries };
}
