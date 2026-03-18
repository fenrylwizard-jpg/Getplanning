import fs from 'fs';
import PDFParser from 'pdf2json';
import * as XLSX from 'xlsx';

const pdfPath = "C:\\Users\\Imam\\Downloads\\herlin\\6127.1 ECOLE HERLIN PLANNING D'INTENTION détaillé du 20251111 A3.pdf";
const outPath = "C:\\Users\\Imam\\Downloads\\herlin\\planning_extracted.xlsx";

if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
}

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));

pdfParser.on("pdfParser_dataReady", pdfData => {
    let allRows = [];
    
    // Some basic layout parsing
    (pdfData.formImage.Pages || []).forEach((page) => {
        let textItems = page.Texts || [];
        let rowMap = new Map();
        
        textItems.forEach(item => {
            if (!item || !item.R || !item.R[0]) return;
            const y = Math.round(item.y * 2) / 2; // Tolerance 0.5
            let text = decodeURIComponent(item.R[0].T).trim();
            if (text) {
                if (!rowMap.has(y)) rowMap.set(y, []);
                rowMap.get(y).push({ x: item.x, text: text, w: item.w || 1 });
            }
        });
        
        let sortedY = Array.from(rowMap.keys()).sort((a,b) => a-b);
        
        sortedY.forEach(y => {
            let rowItems = rowMap.get(y).sort((a,b) => a.x - b.x);
            let rowData = [];
            let lastXEnd = -999;
            
            for(let i=0; i; i++) {
                if (i >= rowItems.length) break;
                let item = rowItems[i];
                let gap = item.x - lastXEnd;
                
                if (gap < 2 && rowData.length > 0) {
                    rowData[rowData.length - 1] += " " + item.text;
                } else {
                    rowData.push(item.text);
                }
                lastXEnd = item.x + item.w; 
            }
            if(rowData.length > 0) allRows.push(rowData);
        });
    });
    
    console.log(`Extracted ${allRows.length} rows.`);
    
    try {
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Planning");
        XLSX.writeFile(wb, outPath);
        console.log(`Excel file successfully exported to ${outPath}`);
    } catch(e) {
        console.error("Error creating excel:", e);
    }
});

console.log(`Reading ${pdfPath}...`);
pdfParser.loadPDF(pdfPath);
