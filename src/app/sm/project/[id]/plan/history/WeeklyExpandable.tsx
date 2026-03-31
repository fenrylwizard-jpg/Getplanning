"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, CheckCircle2, ShieldAlert, Calendar, Users, Clock, ArrowLeft, Pencil, Save, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import T from '@/components/T';

// ── Types ──

interface TaskInfo {
    description: string;
    unit: string;
    minutesPerUnit: number;
    category?: string;
}

interface WeeklyPlanTaskData {
    id: string;
    plannedQuantity: number;
    actualQuantity: number;
    task: TaskInfo;
}

interface DailyTaskProgressData {
    id: string;
    quantity: number;
    hours: number | null;
    task: TaskInfo;
}

interface DailyReportData {
    id: string;
    date: string;
    remarks: string | null;
    status: string;
    lateReason: string | null;
    lateDescription: string | null;
    workersCount: number | null;
    taskProgress: DailyTaskProgressData[];
}

interface WeeklyPlanData {
    id: string;
    weekNumber: number;
    year: number;
    numberOfWorkers: number;
    isSubmitted: boolean;
    targetReached: boolean | null;
    issuesReported: string | null;
    missedTargetReason: string | null;
    tasks: WeeklyPlanTaskData[];
}

interface WeeklyExpandableProps {
    plan: WeeklyPlanData;
    projectId: string;
    weekReports: DailyReportData[];
    isAdmin: boolean;
}

// ── Main Component ──

export default function WeeklyExpandable({ plan, projectId, weekReports, isAdmin }: WeeklyExpandableProps) {
    const [expanded, setExpanded] = useState(false);

    // Calculate weekly totals
    const totalPlannedHours = plan.tasks.reduce((acc, t) => acc + (t.plannedQuantity * t.task.minutesPerUnit) / 60, 0);
    const actualHours = weekReports.reduce((sum, r) => sum + r.taskProgress.reduce((s, p) => s + (p.hours || 0), 0), 0);
    const progress = totalPlannedHours > 0 ? (actualHours / totalPlannedHours) * 100 : 0;

    return (
        <div className="relative">
            {/* Weekly Header Card */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left group"
            >
                <div className={`glass-panel p-6 border bg-[#0a1020]/60 backdrop-blur-xl transition-all rounded-md flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative ${expanded ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5 hover:border-cyan-500/30'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-white/5 p-4 rounded-md flex flex-col items-center justify-center min-w-[70px] border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">WK</span>
                            <span className="text-2xl font-black text-white">{plan.weekNumber}</span>
                            <span className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase">{plan.year}</span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {plan.isSubmitted ? (
                                    plan.targetReached ? 
                                        <span className="badge badge-success text-[10px] flex items-center gap-1 border-emerald-500/20"><CheckCircle2 size={10} /> <T k="target_hit" /></span> :
                                        <span className="badge badge-danger text-[10px] flex items-center gap-1 border-red-500/20"><ShieldAlert size={10} /> <T k="target_missed" /></span>
                                ) : (
                                    <span className="badge badge-warning text-[10px] flex items-center gap-1 border-orange-500/20"><Calendar size={10} /> <T k="planned" /></span>
                                )}
                                {weekReports.length > 0 && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                                        {weekReports.length} rapport{weekReports.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5"><Users size={12} className="text-gray-600" /> {plan.numberOfWorkers} <T k="workers" /></span>
                                <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-600" /> {actualHours.toFixed(1)}H / {totalPlannedHours.toFixed(1)}H</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex flex-col items-end gap-3">
                            <div className="w-full md:w-40 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className={`h-full transition-all duration-1000 ${plan.isSubmitted && !plan.targetReached ? 'bg-red-500' : 'bg-cyan-500'}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className={`p-2 rounded-md transition-all ${expanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500 group-hover:text-cyan-400'}`}>
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="mt-2 ml-4 md:ml-8 border-l-2 border-cyan-500/20 pl-4 md:pl-6 space-y-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    {/* Weekly Plan Tasks Summary */}
                    <WeeklyTasksSummary plan={plan} projectId={projectId} isAdmin={isAdmin} />
                    
                    {/* Daily Reports */}
                    {weekReports.length === 0 ? (
                        <div className="p-6 text-center text-gray-600 italic text-sm bg-white/[0.02] rounded-md border border-white/5">
                            Aucun rapport journalier pour cette semaine
                        </div>
                    ) : (
                        <>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2 pt-2">
                                <FileText size={12} /> Rapports journaliers
                            </h4>
                            {weekReports
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(report => (
                                    <DailyReportCard key={report.id} report={report} projectId={projectId} isAdmin={isAdmin} />
                                ))
                            }
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Weekly Tasks Summary ──

function WeeklyTasksSummary({ plan, projectId, isAdmin }: { plan: WeeklyPlanData; projectId: string; isAdmin: boolean }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({
        numberOfWorkers: plan.numberOfWorkers,
        issuesReported: plan.issuesReported || '',
        missedTargetReason: plan.missedTargetReason || '',
        tasks: plan.tasks.map(t => ({
            id: t.id,
            plannedQuantity: t.plannedQuantity,
            actualQuantity: t.actualQuantity,
        })),
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/project/${projectId}/plan/admin-edit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id, ...editData }),
            });
            if (res.ok) {
                toast.success('Plan hebdomadaire mis à jour');
                setEditing(false);
                window.location.reload();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Calendar size={12} /> Résumé hebdomadaire
                </h4>
                {isAdmin && !editing && (
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all" title="Modifier">
                        <Pencil size={12} />
                    </button>
                )}
                {isAdmin && editing && (
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(false)} className="text-[10px] font-bold text-gray-500 hover:text-gray-300 px-2 py-1">Annuler</button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                            {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Sauvegarder
                        </button>
                    </div>
                )}
            </div>

            {/* Workers */}
            <div className="flex items-center gap-2 mb-3 text-sm">
                <Users size={14} className="text-gray-600" />
                <span className="text-gray-400">Travailleurs:</span>
                {editing ? (
                    <input type="number" value={editData.numberOfWorkers} onChange={e => setEditData({ ...editData, numberOfWorkers: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-white/5 border border-cyan-500/30 rounded px-2 py-0.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
                ) : (
                    <span className="font-bold text-white">{plan.numberOfWorkers}</span>
                )}
            </div>

            {/* Issues */}
            {(plan.issuesReported || editing) && (
                <div className="mb-3">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <AlertTriangle size={10} /> Problèmes signalés
                    </span>
                    {editing ? (
                        <textarea value={editData.issuesReported} onChange={e => setEditData({ ...editData, issuesReported: e.target.value })}
                            className="w-full bg-white/5 border border-cyan-500/30 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-500 min-h-[60px]" />
                    ) : (
                        <p className="text-sm text-gray-300">{plan.issuesReported}</p>
                    )}
                </div>
            )}

            {/* Task table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-gray-500 border-b border-white/5">
                            <th className="text-left py-2 font-black uppercase tracking-wider">Tâche</th>
                            <th className="text-right py-2 font-black uppercase tracking-wider">Planifié</th>
                            <th className="text-right py-2 font-black uppercase tracking-wider">Réalisé</th>
                            <th className="text-right py-2 font-black uppercase tracking-wider">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plan.tasks.map((t, idx) => {
                            const pct = t.plannedQuantity > 0 ? (t.actualQuantity / t.plannedQuantity) * 100 : 0;
                            const editTask = editData.tasks[idx];
                            return (
                                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                                    <td className="py-2 text-white font-medium">{t.task.description}
                                        {t.task.category && <span className="ml-2 text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{t.task.category}</span>}
                                    </td>
                                    <td className="py-2 text-right">
                                        {editing ? (
                                            <input type="number" step="0.1" value={editTask.plannedQuantity} onChange={e => {
                                                const newTasks = [...editData.tasks];
                                                newTasks[idx] = { ...newTasks[idx], plannedQuantity: parseFloat(e.target.value) || 0 };
                                                setEditData({ ...editData, tasks: newTasks });
                                            }} className="w-16 bg-white/5 border border-cyan-500/30 rounded px-1 py-0.5 text-white text-xs text-right focus:outline-none focus:border-cyan-500" />
                                        ) : (
                                            <span className="text-gray-300">{t.plannedQuantity} {t.task.unit}</span>
                                        )}
                                    </td>
                                    <td className="py-2 text-right">
                                        {editing ? (
                                            <input type="number" step="0.1" value={editTask.actualQuantity} onChange={e => {
                                                const newTasks = [...editData.tasks];
                                                newTasks[idx] = { ...newTasks[idx], actualQuantity: parseFloat(e.target.value) || 0 };
                                                setEditData({ ...editData, tasks: newTasks });
                                            }} className="w-16 bg-white/5 border border-cyan-500/30 rounded px-1 py-0.5 text-white text-xs text-right focus:outline-none focus:border-cyan-500" />
                                        ) : (
                                            <span className="text-gray-300">{t.actualQuantity} {t.task.unit}</span>
                                        )}
                                    </td>
                                    <td className="py-2 text-right">
                                        <span className={`font-bold ${pct >= 100 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {pct.toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Daily Report Card ──

function DailyReportCard({ report, projectId, isAdmin }: { report: DailyReportData; projectId: string; isAdmin: boolean }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({
        workersCount: report.workersCount || 0,
        remarks: report.remarks || '',
        taskProgress: report.taskProgress.map(tp => ({
            id: tp.id,
            quantity: tp.quantity,
            hours: tp.hours || 0,
        })),
    });

    const reportDate = new Date(report.date);
    const dayName = reportDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dateStr = reportDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const totalHours = report.taskProgress.reduce((acc, p) => acc + (p.hours || 0), 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/project/${projectId}/report/admin-edit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId: report.id, ...editData }),
            });
            if (res.ok) {
                toast.success(`Rapport du ${dateStr} mis à jour`);
                setEditing(false);
                window.location.reload();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-md border border-white/5 bg-[#0a1020]/40 backdrop-blur-xl hover:border-cyan-500/20 transition-all">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-white leading-none">{reportDate.getUTCDate().toString().padStart(2, '0')}</span>
                        <span className="text-[8px] font-bold text-cyan-400 uppercase">{reportDate.toLocaleString('fr-FR', { month: 'short' })}</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white capitalize">{dayName}</div>
                        <div className="flex gap-3 text-[10px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1"><Users size={10} className="text-gray-600" /> 
                                {editing ? (
                                    <input type="number" value={editData.workersCount} onChange={e => setEditData({ ...editData, workersCount: parseInt(e.target.value) || 0 })}
                                        className="w-12 bg-white/5 border border-cyan-500/30 rounded px-1 py-0 text-white text-[10px] focus:outline-none" />
                                ) : (
                                    report.workersCount || 0
                                )}
                            </span>
                            <span className="flex items-center gap-1"><Clock size={10} className="text-gray-600" /> {totalHours.toFixed(1)}H</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${report.status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {report.status === 'SUBMITTED' ? <CheckCircle2 size={8} className="inline mr-1" /> : <Clock size={8} className="inline mr-1" />}
                        {report.status}
                    </span>
                    {isAdmin && !editing && (
                        <button onClick={() => setEditing(true)} className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all" title="Modifier">
                            <Pencil size={10} />
                        </button>
                    )}
                    {isAdmin && editing && (
                        <div className="flex gap-1">
                            <button onClick={() => setEditing(false)} className="text-[9px] font-bold text-gray-500 hover:text-gray-300 px-1.5 py-0.5">✕</button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                                {saving ? <Loader2 size={8} className="animate-spin" /> : <Save size={8} />}
                            </button>
                        </div>
                    )}
                    <Link href={`/sm/project/${projectId}/report/${report.id}`} className="p-1 rounded-md bg-white/5 border border-white/10 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all" title="Voir détails">
                        <ArrowLeft size={10} className="rotate-180" />
                    </Link>
                </div>
            </div>

            {/* Tasks */}
            <div className="space-y-1.5">
                {report.taskProgress.map((tp, idx) => {
                    const editTp = editData.taskProgress[idx];
                    return (
                        <div key={tp.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/[0.02] hover:bg-white/[0.04]">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate max-w-[200px]">{tp.task.description}</span>
                                {tp.task.category && <span className="text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0 rounded">{tp.task.category}</span>}
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                {editing ? (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <input type="number" step="0.1" value={editTp.quantity} onChange={e => {
                                                const newTp = [...editData.taskProgress];
                                                newTp[idx] = { ...newTp[idx], quantity: parseFloat(e.target.value) || 0 };
                                                setEditData({ ...editData, taskProgress: newTp });
                                            }} className="w-14 bg-white/5 border border-cyan-500/30 rounded px-1 py-0 text-white text-xs text-right focus:outline-none" />
                                            <span className="text-[9px]">{tp.task.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <input type="number" step="0.1" value={editTp.hours} onChange={e => {
                                                const newTp = [...editData.taskProgress];
                                                newTp[idx] = { ...newTp[idx], hours: parseFloat(e.target.value) || 0 };
                                                setEditData({ ...editData, taskProgress: newTp });
                                            }} className="w-14 bg-white/5 border border-cyan-500/30 rounded px-1 py-0 text-white text-xs text-right focus:outline-none" />
                                            <span className="text-[9px]">H</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span>{tp.quantity} {tp.task.unit}</span>
                                        <span className="text-gray-600">•</span>
                                        <span>{(tp.hours || 0).toFixed(1)}H</span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Remarks */}
            {(report.remarks || editing) && (
                <div className="mt-3 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <AlertTriangle size={8} /> Remarques
                    </span>
                    {editing ? (
                        <textarea value={editData.remarks} onChange={e => setEditData({ ...editData, remarks: e.target.value })}
                            className="w-full bg-white/5 border border-cyan-500/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-500 min-h-[40px]" />
                    ) : (
                        <p className="text-[11px] text-gray-400">{report.remarks}</p>
                    )}
                </div>
            )}
        </div>
    );
}
