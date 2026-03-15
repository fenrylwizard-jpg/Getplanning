"use client";

import { useState, useEffect } from "react";
import { FileCheck, FileWarning, Files, FolderOpen, ClipboardCheck, CheckCircle2 } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface DossierTechniqueTabProps {
    project: { id: string };
}

interface EtudeTask {
    id: string;
    wbs: string | null;
    activity: string;
    assignedTo: string | null;
    startDate: string | null;
    endDate: string | null;
    duration: number | null;
    status: string | null;
    progress: number | null;
}

interface Summary {
    total: number;
    averageProgress: number;
    byStatus: Record<string, number>;
    byAssignee: Record<string, { total: number; avgProgress: number }>;
}

// Demo data for technical documents (fallback)
const DEMO_TASKS = [
    { wbs: "1.1", activity: "Dimensionnement fondations", assignedTo: "Bureau A", status: "Terminé", progress: 100 },
    { wbs: "1.2", activity: "Plans coffrage N0", assignedTo: "Bureau A", status: "En cours", progress: 75 },
    { wbs: "2.1", activity: "Note de calcul dalles", assignedTo: "Bureau B", status: "En cours", progress: 40 },
    { wbs: "2.2", activity: "Plans armatures", assignedTo: "Bureau B", status: "À venir", progress: 0 },
    { wbs: "3.1", activity: "Schéma unifilaire", assignedTo: "Bureau C", status: "En cours", progress: 60 },
    { wbs: "3.2", activity: "Plans câblage RDC", assignedTo: "Bureau C", status: "À venir", progress: 0 },
    { wbs: "4.1", activity: "Réseaux EU/EV", assignedTo: "Bureau D", status: "Terminé", progress: 100 },
    { wbs: "4.2", activity: "Schéma isométrique", assignedTo: "Bureau D", status: "En cours", progress: 55 },
];

const getStatusColor = (status: string | null) => {
    if (!status) return { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };
    const s = status.toLowerCase();
    if (s.includes('termin')) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (s.includes('cours') || s.includes('progress')) return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
    if (s.includes('tard') || s.includes('retard')) return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' };
    if (s.includes('attent') || s.includes('venir') || s.includes('planifi')) return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
};

export default function DossierTechniqueTab({ project }: DossierTechniqueTabProps) {
    const [tasks, setTasks] = useState<EtudeTask[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(false);
    const [filterAssignee, setFilterAssignee] = useState<string>('all');

    const fetchData = () => {
        if (!project?.id) return;
        setLoading(true);
        fetch(`/api/hub/etudes?projectId=${project.id}`)
            .then(r => r.json())
            .then(d => {
                setTasks(d.tasks || []);
                setSummary(d.summary || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [project?.id]);

    const isDemo = tasks.length === 0;

    // For demo display
    const demoAvgProgress = DEMO_TASKS.reduce((s, t) => s + t.progress, 0) / DEMO_TASKS.length;

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="technique"
                acceptTypes=".xlsx,.xls,.xlsm"
                title="Importer le Suivi des Études"
                subtitle="Glissez un fichier Excel contenant le planning des études techniques"
                accentColor="cyan"
                icon={<ClipboardCheck size={36} className="text-cyan-400" />}
                onUploadComplete={() => fetchData()}
            />

            {/* Data source indicator */}
            {isDemo ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-300">
                        <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                    </p>
                </div>
            ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-xs text-emerald-300 font-semibold">
                        Données importées actives — {tasks.length} tâche{tasks.length > 1 ? 's' : ''} d&apos;études chargée{tasks.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : isDemo ? (
                <>
                    {/* Demo: Global Progress */}
                    <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 opacity-60">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-semibold text-white mb-1">Avancement Global</h3>
                                <p className="text-blue-200/60 text-sm">Données de démonstration</p>
                            </div>
                            <div className="flex-1 max-w-md w-full">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white font-medium">{Math.round(demoAvgProgress)}%</span>
                                    <span className="text-white/50">{DEMO_TASKS.length} tâches</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${demoAvgProgress}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Demo Tasks Table */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl overflow-hidden opacity-60">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">#</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Activité</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Assigné à</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Statut</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Progression</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DEMO_TASKS.map((t, idx) => {
                                        const config = getStatusColor(t.status);
                                        return (
                                            <tr key={idx} className="border-b border-white/[0.03]">
                                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.wbs}</td>
                                                <td className="px-4 py-3 text-white text-sm font-medium">{t.activity}</td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{t.assignedTo}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>{t.status}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className="text-xs text-emerald-400 font-mono">{t.progress}%</span>
                                                        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.progress}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Real data: Global Progress Header */}
                    {summary && (
                        <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-semibold text-white mb-1">Avancement Global</h3>
                                <p className="text-blue-200/60 text-sm">Progression moyenne de toutes les tâches d&apos;ingénierie</p>
                            </div>
                            <div className="flex-1 max-w-md w-full">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white font-medium">{Math.round(summary.averageProgress)}%</span>
                                    <span className="text-white/50">{summary.total} tâches au total</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${summary.averageProgress}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assignee Cards */}
                    {summary && Object.keys(summary.byAssignee).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Object.entries(summary.byAssignee).sort().map(([assignee, stats]) => (
                                <button key={assignee}
                                    onClick={() => setFilterAssignee(filterAssignee === assignee ? 'all' : assignee)}
                                    className={`bg-[#080d1a]/80 border rounded-xl p-5 text-left transition-all hover:border-white/15 ${filterAssignee === assignee ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs uppercase">{assignee.substring(0, 2)}</div>
                                        <h4 className="text-white font-medium text-sm truncate max-w-[120px]" title={assignee}>{assignee}</h4>
                                        <span className="text-gray-500 text-xs ml-auto bg-white/5 px-2 py-1 rounded-md">{stats.total} t.</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.avgProgress}%` }} />
                                    </div>
                                    <div className="text-[10px] text-gray-400 text-right">{Math.round(stats.avgProgress)}% achevé</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Status filter bar */}
                    {summary && (
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-xl p-4">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setFilterAssignee('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterAssignee === 'all' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:text-white border border-transparent'}`}>
                                    Tous ({summary.total})
                                </button>
                                {Object.entries(summary.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                                    const config = getStatusColor(status);
                                    return (
                                        <span key={status} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                                            {status} ({count})
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tasks Table */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase w-16">#</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Activité</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Assigné à</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Dates</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Durée</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase w-32">Statut</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase w-24">Progression</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks
                                        .filter(t => filterAssignee === 'all' || (t.assignedTo || 'Non assigné') === filterAssignee)
                                        .map(t => {
                                        const config = getStatusColor(t.status);
                                        return (
                                            <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.wbs || '—'}</td>
                                                <td className="px-4 py-3 text-white text-sm max-w-[300px]">
                                                    <div className="font-medium truncate" title={t.activity}>{t.activity}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-400 text-xs px-2 py-1 bg-white/5 rounded-md">{t.assignedTo || 'Non assigné'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">
                                                    {t.startDate ? new Date(t.startDate).toLocaleDateString('fr-FR') : '—'}
                                                    <span className="mx-1 text-gray-600">→</span>
                                                    {t.endDate ? new Date(t.endDate).toLocaleDateString('fr-FR') : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{t.duration != null ? `${t.duration} j` : '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>{t.status || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {t.progress !== null && t.progress !== undefined ? (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <span className="text-xs text-emerald-400 font-mono">{Math.round(t.progress)}%</span>
                                                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {tasks.length > 0 && (
                            <div className="px-4 py-2 border-t border-white/5 text-gray-500 text-xs">
                                {tasks.filter(t => filterAssignee === 'all' || (t.assignedTo || 'Non assigné') === filterAssignee).length} tâche(s) affichée(s)
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
