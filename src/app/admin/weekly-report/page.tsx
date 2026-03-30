"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Download, BarChart3, Target, Users, Clock,
    CheckCircle, XCircle, TrendingUp, Printer, FileText
} from 'lucide-react';

interface TaskBreakdown {
    description: string;
    category: string;
    unit: string;
    planned: number;
    actual: number;
    pct: number;
}

interface ProjectSummary {
    planId: string;
    projectId: string;
    projectName: string;
    pmName: string;
    smName: string;
    weekNumber: number;
    year: number;
    workers: number;
    avgWorkers: number;
    targetHours: number;
    plannedHours: number;
    achievedHours: number;
    productivity: number;
    targetReached: boolean;
    reportsCount: number;
    attendanceHours: number;
    issues: string;
    checks: { drawings: boolean; materials: boolean; tools: boolean; sub: boolean; };
    taskBreakdown: TaskBreakdown[];
}

interface ReportData {
    closedCount: number;
    weekNumber: number;
    year: number;
    totals: {
        plannedHours: number;
        achievedHours: number;
        productivity: number;
        targetHitCount: number;
        targetHitRate: number;
    };
    projects: ProjectSummary[];
}

export default function WeeklyReportPage() {
    const searchParams = useSearchParams();
    const [report, setReport] = useState<ReportData | null>(null);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load report data from localStorage (stored by the close action)
        const stored = localStorage.getItem('weeklyReport');
        if (stored) {
            try {
                setReport(JSON.parse(stored));
            } catch { /* ignore */ }
        }
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (!report) {
        return (
            <div className="aurora-page min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-400 mb-2">Aucun rapport disponible</h2>
                    <p className="text-gray-600 text-sm mb-6">Exécutez la clôture de semaine depuis le tableau de bord admin.</p>
                    <Link href="/admin/dashboard" className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-md font-bold text-sm hover:bg-purple-500/30 transition-all">
                        ← Retour au dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const week = report.weekNumber;
    const year = report.year;
    const totals = report.totals;

    // Color helpers
    const prodColor = (pct: number) => pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';
    const prodBg = (pct: number) => pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
    const prodBorder = (pct: number) => pct >= 90 ? 'border-emerald-500/30' : pct >= 70 ? 'border-amber-500/30' : 'border-red-500/30';

    return (
        <>
            {/* Print-specific styles */}
            <style>{`
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .aurora-page { background: white !important; }
                    .no-print { display: none !important; }
                    .print-break { page-break-before: always; }
                    .glass-card, [class*="bg-[#"] { background: #f8f9fa !important; border-color: #dee2e6 !important; }
                    * { color: #1a1a1a !important; }
                    .print-color-keep { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            <div className="aurora-page min-h-screen text-white" ref={reportRef}>
                {/* Header */}
                <div className="bg-[#060b18]/90 border-b border-white/5 no-print">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                        <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
                                <ArrowLeft size={16} />
                            </div>
                            <span className="text-sm font-bold">Dashboard Admin</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-bold"
                            >
                                <Printer size={16} /> Imprimer
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold"
                            >
                                <Download size={16} /> Télécharger PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Report Title */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
                            <BarChart3 size={14} /> Rapport Hebdomadaire
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                            Semaine {week} — {year}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {report.closedCount} projet{report.closedCount > 1 ? 's' : ''} clôturé{report.closedCount > 1 ? 's' : ''} • Généré le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Global KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[#0a1020] border border-blue-500/20 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-blue-400" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Heures Planifiées</span>
                            </div>
                            <div className="text-2xl font-black text-blue-400">{totals.plannedHours}h</div>
                        </div>
                        <div className="bg-[#0a1020] border border-emerald-500/20 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-emerald-400" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Heures Réalisées</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{totals.achievedHours}h</div>
                        </div>
                        <div className="bg-[#0a1020] border border-purple-500/20 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={16} className="text-purple-400" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Productivité</span>
                            </div>
                            <div className={`text-2xl font-black ${prodColor(totals.productivity)}`}>{totals.productivity}%</div>
                        </div>
                        <div className="bg-[#0a1020] border border-amber-500/20 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={16} className="text-amber-400" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Objectifs Atteints</span>
                            </div>
                            <div className="text-2xl font-black text-amber-400">{totals.targetHitCount}/{report.closedCount}</div>
                            <div className="text-xs text-gray-600">{totals.targetHitRate}% des projets</div>
                        </div>
                    </div>

                    {/* Overall Productivity Bar */}
                    <div className="bg-[#0a1020] border border-white/10 rounded-lg p-6 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Productivité Globale</h3>
                        <div className="relative">
                            <div className="flex items-end gap-4 justify-center">
                                {report.projects.map((p, i) => {
                                    const maxBar = 200;
                                    const barHeight = Math.max(20, (p.productivity / 120) * maxBar);
                                    const colors = ['from-blue-500 to-blue-400', 'from-purple-500 to-purple-400', 'from-cyan-500 to-cyan-400', 'from-amber-500 to-amber-400', 'from-emerald-500 to-emerald-400', 'from-pink-500 to-pink-400'];
                                    const color = colors[i % colors.length];
                                    return (
                                        <div key={p.planId} className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                                            <span className={`text-sm font-black ${prodColor(p.productivity)}`}>{p.productivity}%</span>
                                            <div className="w-full relative flex justify-center">
                                                <div
                                                    className={`w-12 sm:w-16 rounded-t-lg bg-gradient-to-t ${color} transition-all duration-700 print-color-keep relative`}
                                                    style={{ height: `${barHeight}px` }}
                                                >
                                                    {/* Target line */}
                                                    <div className="absolute left-0 right-0 border-t-2 border-dashed border-white/30" style={{ bottom: `${Math.min(100, (90 / 120) * 100)}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-bold text-center leading-tight mt-1 max-w-full truncate" title={p.projectName}>
                                                {p.projectName.length > 12 ? p.projectName.slice(0, 12) + '…' : p.projectName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-gray-600">
                                <div className="w-6 border-t-2 border-dashed border-white/30" />
                                <span>Objectif 90%</span>
                            </div>
                        </div>
                    </div>

                    {/* Per-Project Cards */}
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-purple-400" /> Détail par Projet
                    </h3>
                    <div className="space-y-4 mb-8">
                        {report.projects.map((p) => {
                            const isExpanded = expandedProject === p.planId;
                            return (
                                <div key={p.planId} className={`bg-[#0a1020] border ${p.targetReached ? 'border-emerald-500/20' : 'border-red-500/20'} rounded-lg overflow-hidden transition-all`}>
                                    {/* Project Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-white/3 transition-colors no-print-hover"
                                        onClick={() => setExpandedProject(isExpanded ? null : p.planId)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-black text-white truncate">{p.projectName}</h4>
                                                    <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${p.targetReached ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                        {p.targetReached ? '✓ Objectif atteint' : '✗ Objectif manqué'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Users size={12} /> SM: <strong className="text-gray-300">{p.smName}</strong>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Users size={12} /> PM: <strong className="text-gray-300">{p.pmName}</strong>
                                                    </span>
                                                    <span>👷 {p.avgWorkers} ouvriers (moy.)</span>
                                                    <span>📋 {p.reportsCount} rapport{p.reportsCount > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={`text-3xl font-black ${prodColor(p.productivity)}`}>{p.productivity}%</div>
                                                <div className="text-[10px] text-gray-600 font-bold uppercase">Productivité</div>
                                            </div>
                                        </div>

                                        {/* Inline bar chart */}
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Planifié</span>
                                                    <span className="text-blue-400 font-bold">{p.plannedHours}h</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700 print-color-keep" style={{ width: `${Math.min(100, (p.plannedHours / Math.max(p.targetHours, p.plannedHours)) * 100)}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Réalisé</span>
                                                    <span className={`font-bold ${prodColor(p.productivity)}`}>{p.achievedHours}h</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 print-color-keep ${prodBg(p.productivity)}`} style={{ width: `${Math.min(100, (p.achievedHours / Math.max(p.targetHours, p.plannedHours)) * 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Readiness Checks */}
                                        <div className="flex gap-3 mt-3">
                                            {[
                                                { label: 'Plans', ok: p.checks.drawings },
                                                { label: 'Matériaux', ok: p.checks.materials },
                                                { label: 'Outillage', ok: p.checks.tools },
                                                { label: 'Sous-traitants', ok: p.checks.sub },
                                            ].map(c => (
                                                <span key={c.label} className={`flex items-center gap-1 text-[10px] font-bold ${c.ok ? 'text-emerald-400/60' : 'text-red-400/40'}`}>
                                                    {c.ok ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                    {c.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expanded: Task Breakdown Table */}
                                    {(isExpanded || true) && (
                                        <div className={`border-t border-white/5 ${isExpanded ? '' : 'hidden print:block'}`}>
                                            <div className="p-5">
                                                {p.issues && (
                                                    <div className="mb-4 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                                                        <strong>Problèmes signalés:</strong> {p.issues}
                                                    </div>
                                                )}
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-gray-600 uppercase text-[10px] tracking-wider border-b border-white/5">
                                                            <th className="text-left pb-2 pr-3">Tâche</th>
                                                            <th className="text-left pb-2 pr-3">Catégorie</th>
                                                            <th className="text-right pb-2 pr-3">Planifié</th>
                                                            <th className="text-right pb-2 pr-3">Réalisé</th>
                                                            <th className="text-right pb-2">%</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {p.taskBreakdown.map((t, i) => (
                                                            <tr key={i} className="border-b border-white/3 hover:bg-white/3">
                                                                <td className="py-2 pr-3 text-gray-300 max-w-[200px] truncate" title={t.description}>{t.description}</td>
                                                                <td className="py-2 pr-3 text-gray-500">{t.category}</td>
                                                                <td className="py-2 pr-3 text-right text-gray-400">{t.planned} {t.unit}</td>
                                                                <td className="py-2 pr-3 text-right text-gray-300 font-bold">{t.actual} {t.unit}</td>
                                                                <td className={`py-2 text-right font-black ${prodColor(t.pct)}`}>{t.pct}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-700 py-6 border-t border-white/5">
                        GetPlanning • Rapport S{week}/{year} • {new Date().toLocaleString('fr-FR')}
                    </div>
                </div>
            </div>
        </>
    );
}
