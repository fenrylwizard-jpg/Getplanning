interface ProjectSummary {
    projectName: string;
    siteManagerName: string;
    totalTasks: number;
    completedTasks: number;
    completionPercent: number;
    plannedHours: number;
    achievedHours: number;
    efficiency: number;
    weekNumber: number;
    year: number;
    tasksWithProgress: { name: string; planned: number; actual: number; unit: string }[];
    issues: string | null;
}

export function buildWeeklySummaryHtml(summary: ProjectSummary): string {
    const efficiencyColor = summary.efficiency >= 100 ? '#34d399' : summary.efficiency >= 70 ? '#fbbf24' : '#ef4444';
    const completionBar = Math.min(summary.completionPercent, 100);

    const taskRows = summary.tasksWithProgress
        .map(t => `
            <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 8px 12px; color: #d1d5db;">${t.name}</td>
                <td style="padding: 8px 12px; text-align: center; color: #9ca3af;">${t.planned} ${t.unit}</td>
                <td style="padding: 8px 12px; text-align: center; color: #e2e8f0; font-weight: bold;">${t.actual} ${t.unit}</td>
            </tr>
        `).join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', Tahoma, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #1e293b; border-radius: 12px; overflow: hidden;">
                <!-- Header -->
                <tr>
                    <td style="padding: 30px 30px 20px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                        <h1 style="margin: 0; color: #38bdf8; font-size: 22px;">📋 Rapport Hebdomadaire</h1>
                        <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Semaine ${summary.weekNumber} — ${summary.year}</p>
                    </td>
                </tr>

                <!-- Project Info -->
                <tr>
                    <td style="padding: 20px 30px;">
                        <h2 style="color: #e2e8f0; font-size: 18px; margin: 0 0 5px;">${summary.projectName}</h2>
                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Chef de chantier : ${summary.siteManagerName}</p>
                    </td>
                </tr>

                <!-- Stats Cards -->
                <tr>
                    <td style="padding: 0 30px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="8">
                            <tr>
                                <td width="33%" style="background: #0f172a; border-radius: 8px; padding: 15px; text-align: center;">
                                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Heures Planifiées</div>
                                    <div style="color: #38bdf8; font-size: 24px; font-weight: bold; margin-top: 4px;">${summary.plannedHours.toFixed(1)}</div>
                                </td>
                                <td width="33%" style="background: #0f172a; border-radius: 8px; padding: 15px; text-align: center;">
                                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Heures Réalisées</div>
                                    <div style="color: ${efficiencyColor}; font-size: 24px; font-weight: bold; margin-top: 4px;">${summary.achievedHours.toFixed(1)}</div>
                                </td>
                                <td width="33%" style="background: #0f172a; border-radius: 8px; padding: 15px; text-align: center;">
                                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Efficience</div>
                                    <div style="color: ${efficiencyColor}; font-size: 24px; font-weight: bold; margin-top: 4px;">${summary.efficiency.toFixed(0)}%</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Progress Bar -->
                <tr>
                    <td style="padding: 0 30px 20px;">
                        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">Avancement global : ${summary.completionPercent.toFixed(1)}%</div>
                        <div style="background: #0f172a; border-radius: 6px; height: 8px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #38bdf8, #818cf8); width: ${completionBar}%; height: 100%; border-radius: 6px;"></div>
                        </div>
                    </td>
                </tr>

                <!-- Task Table -->
                ${taskRows ? `
                <tr>
                    <td style="padding: 0 30px 20px;">
                        <h3 style="color: #e2e8f0; font-size: 14px; margin: 0 0 10px;">Tâches de la semaine</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; border-radius: 8px; overflow: hidden;">
                            <tr style="background: #334155;">
                                <th style="padding: 8px 12px; text-align: left; color: #94a3b8; font-size: 12px;">Tâche</th>
                                <th style="padding: 8px 12px; text-align: center; color: #94a3b8; font-size: 12px;">Prévu</th>
                                <th style="padding: 8px 12px; text-align: center; color: #94a3b8; font-size: 12px;">Réalisé</th>
                            </tr>
                            ${taskRows}
                        </table>
                    </td>
                </tr>
                ` : ''}

                <!-- Issues -->
                ${summary.issues ? `
                <tr>
                    <td style="padding: 0 30px 20px;">
                        <div style="background: #451a03; border: 1px solid #78350f; border-radius: 8px; padding: 12px;">
                            <div style="color: #fbbf24; font-size: 12px; font-weight: bold; margin-bottom: 4px;">⚠️ Problèmes signalés</div>
                            <div style="color: #fde68a; font-size: 13px;">${summary.issues}</div>
                        </div>
                    </td>
                </tr>
                ` : ''}

                <!-- Footer -->
                <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid #334155;">
                        <p style="color: #64748b; font-size: 11px; margin: 0; text-align: center;">
                            Généré automatiquement par EEG Management — getplanning.org
                        </p>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;
}
