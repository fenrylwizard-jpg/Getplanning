"use client";

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function WeeklyReportGenerator({ project }: { project: any }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async () => {
        setIsGenerating(true);

        try {
            // Build a printable report in a new window
            const latestPlan = project.weeklyPlans?.sort((a: any, b: any) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.weekNumber - a.weekNumber;
            })[0];

            const today = new Date().toLocaleDateString('fr-FR');
            const HOURLY_RATE = 43.35;
            const totalBudgetHrs = project.tasks.reduce((s: number, t: any) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
            const totalEarnedHrs = project.tasks.reduce((s: number, t: any) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
            const pct = totalBudgetHrs > 0 ? ((totalEarnedHrs / totalBudgetHrs) * 100).toFixed(1) : '0';

            // Build task rows for the latest plan
            let taskRows = '';
            if (latestPlan?.tasks) {
                taskRows = latestPlan.tasks.map((pt: any) => {
                    const percent = pt.plannedQuantity > 0
                        ? Math.round((pt.actualQuantity / pt.plannedQuantity) * 100)
                        : 0;
                    const color = percent >= 90 ? '#059669' : percent >= 70 ? '#d97706' : '#dc2626';
                    return `<tr>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${pt.task?.description || '—'}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${pt.task?.unit || ''}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${pt.plannedQuantity}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;">${pt.actualQuantity}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;color:${color};">${percent}%</td>
                    </tr>`;
                }).join('');
            }

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rapport Hebdo - ${project.name}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color:#1a1a2e; padding:40px; }
        .header { border-bottom:4px solid #0891b2; padding-bottom:16px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:flex-end; }
        .header h1 { font-size:24px; color:#0f172a; }
        .header h2 { font-size:16px; color:#0891b2; margin-top:4px; }
        .header .meta { text-align:right; font-size:12px; color:#64748b; }
        .header .meta p { margin:2px 0; }
        .section { margin-bottom:24px; }
        .section h3 { font-size:14px; font-weight:700; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-bottom:12px; }
        .kpi-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px; }
        .kpi { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; text-align:center; }
        .kpi .label { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:700; }
        .kpi .value { font-size:22px; font-weight:900; color:#0f172a; margin-top:4px; }
        .kpi .sub { font-size:11px; color:#94a3b8; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead tr { background:#f1f5f9; }
        th { padding:8px; text-align:center; font-weight:700; color:#334155; border-bottom:2px solid #cbd5e1; }
        th:first-child { text-align:left; }
        .issues { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px; font-size:13px; margin-top:12px; }
        .footer { margin-top:48px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:12px; }
        .footer .sig { text-align:center; width:40%; }
        .footer .sig .line { border-bottom:1px solid #94a3b8; width:120px; margin:40px auto 0; }
        @media print { body { padding:20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>RAPPORT HEBDOMADAIRE</h1>
            <h2>${project.name}</h2>
        </div>
        <div class="meta">
            <p><strong>Date:</strong> ${today}</p>
            <p><strong>Réf:</strong> PRJ-${project.id.substring(0, 8).toUpperCase()}</p>
            ${latestPlan ? `<p><strong>Semaine:</strong> ${latestPlan.weekNumber} / ${latestPlan.year}</p>` : ''}
            ${project.siteManager?.name ? `<p><strong>Chef de chantier:</strong> ${project.siteManager.name}</p>` : ''}
        </div>
    </div>

    <div class="section">
        <h3>Progression Globale</h3>
        <div class="kpi-grid">
            <div class="kpi">
                <div class="label">Budget MO</div>
                <div class="value">${Math.round(totalBudgetHrs)} h</div>
                <div class="sub">${Math.round(totalBudgetHrs * HOURLY_RATE).toLocaleString()} €</div>
            </div>
            <div class="kpi">
                <div class="value" style="color:#059669;">${Math.round(totalEarnedHrs)} h</div>
                <div class="label">Réalisé</div>
                <div class="sub">${Math.round(totalEarnedHrs * HOURLY_RATE).toLocaleString()} €</div>
            </div>
            <div class="kpi">
                <div class="value" style="color:#6366f1;">${pct}%</div>
                <div class="label">Avancement</div>
                <div class="sub">${project.tasks.length} postes suivis</div>
            </div>
        </div>
    </div>

    ${latestPlan ? `
    <div class="section">
        <h3>Détail Semaine ${latestPlan.weekNumber} — ${latestPlan.numberOfWorkers} ouvriers — ${latestPlan.targetHoursCapacity}h capacité</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align:left;">Tâche</th>
                    <th>Unité</th>
                    <th>Prévu</th>
                    <th>Réalisé</th>
                    <th>Efficacité</th>
                </tr>
            </thead>
            <tbody>
                ${taskRows}
            </tbody>
        </table>
        ${latestPlan.issuesReported ? `<div class="issues"><strong>Problèmes signalés:</strong> ${latestPlan.issuesReported}</div>` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h3>Remarques</h3>
        <p style="font-size:12px;color:#64748b;">
            Document généré automatiquement par GetPlanning — ${project.name} — ${today}.
        </p>
    </div>

    <div class="footer">
        <div class="sig">
            <p><strong>Le Chef de Projet</strong></p>
            <div class="line"></div>
        </div>
        <div class="sig">
            <p><strong>Le Conducteur de Travaux</strong></p>
            <div class="line"></div>
        </div>
    </div>
</body>
</html>`;

            // Open in new window and trigger print (Save as PDF)
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                // Wait for content to render then trigger print
                setTimeout(() => {
                    printWindow.print();
                }, 300);
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="btn btn-primary flex items-center gap-2"
        >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Générer Rapport Hebdo PDF
        </button>
    );
}
