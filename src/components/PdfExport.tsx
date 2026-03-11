"use client";

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileDown } from 'lucide-react';

interface PdfTask {
    description: string;
    category: string;
    plannedQty: number;
    actualQty: number;
    unit: string;
    minutesPerUnit: number;
}

interface PdfReportData {
    projectName: string;
    weekLabel: string;
    siteManagerName: string;
    targetHours: number;
    achievedHours: number;
    tasks: PdfTask[];
    efficiency: number;
    location?: string;
}

// Extend jsPDF with autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: Record<string, unknown>) => jsPDF;
    }
}

export function generateWeeklyPDF(data: PdfReportData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(26, 5, 51); // aurora-violet
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GetPlanning', 14, 20);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rapport Hebdomadaire — ${data.weekLabel}`, 14, 32);
    
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - 14, 20, { align: 'right' });
    
    // Project Info
    let y = 55;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.projectName, 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Chef de chantier: ${data.siteManagerName}`, 14, y);
    if (data.location) {
        doc.text(`Localisation: ${data.location}`, pageWidth - 14, y, { align: 'right' });
    }
    y += 12;
    
    // KPIs
    const kpiWidth = (pageWidth - 42) / 3;
    const kpis = [
        { label: 'Heures Planifiées', value: data.targetHours.toFixed(1), unit: 'h' },
        { label: 'Heures Réalisées', value: data.achievedHours.toFixed(1), unit: 'h' },
        { label: 'Rendement', value: data.efficiency.toFixed(0), unit: '%' },
    ];
    
    kpis.forEach((kpi, i) => {
        const x = 14 + i * (kpiWidth + 7);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y, kpiWidth, 28, 4, 4, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + 8, y + 10);
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${kpi.value}${kpi.unit}`, x + 8, y + 22);
    });
    y += 38;
    
    // Tasks Table
    const tableData = data.tasks.map(t => [
        t.category,
        t.description,
        `${t.plannedQty} ${t.unit}`,
        `${t.actualQty} ${t.unit}`,
        t.plannedQty > 0 ? `${((t.actualQty / t.plannedQty) * 100).toFixed(0)}%` : '-',
    ]);
    
    doc.autoTable({
        startY: y,
        head: [['Catégorie', 'Description', 'Planifié', 'Réalisé', 'Taux']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
        styles: {
            cellPadding: 4,
            lineWidth: 0.1,
            lineColor: [226, 232, 240],
        },
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `GetPlanning — ${data.projectName} — Page ${i}/${pageCount}`,
            pageWidth / 2, 
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
    
    doc.save(`Rapport_${data.projectName.replace(/\s+/g, '_')}_${data.weekLabel}.pdf`);
}

export default function PdfExportButton({ data }: { data: PdfReportData }) {
    return (
        <button
            onClick={() => generateWeeklyPDF(data)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group"
        >
            <FileDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
            Exporter PDF
        </button>
    );
}
