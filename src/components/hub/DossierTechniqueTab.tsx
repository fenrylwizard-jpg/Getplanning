"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, FileText, Map, Calculator, Send, Clock, AlertTriangle, XCircle, ShieldCheck, Hammer } from "lucide-react";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface DossierTechniqueTabProps {
    project: { id: string };
}

interface DossierSummary {
    category: string;
    label: string;
    total: number;
    transmitted: number;
    statuses: Record<string, number>;
}

// Removed EtudeTask

/** Status code legend from the Excel file */
const STATUS_LEGEND: Record<string, { label: string; color: string; bgColor: string; borderColor: string; Icon: typeof CheckCircle2 }> = {
    APP: { label: "Approuvé", color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-500/30", Icon: CheckCircle2 },
    APR: { label: "Approuvé avec remarques", color: "text-amber-400", bgColor: "bg-amber-500/15", borderColor: "border-amber-500/30", Icon: AlertTriangle },
    ATT: { label: "En attente", color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-blue-500/30", Icon: Clock },
    BPE: { label: "Bon pour exécution", color: "text-cyan-400", bgColor: "bg-cyan-500/15", borderColor: "border-cyan-500/30", Icon: Hammer },
    ASB: { label: "As built", color: "text-purple-400", bgColor: "bg-purple-500/15", borderColor: "border-purple-500/30", Icon: ShieldCheck },
    REF: { label: "Refusé", color: "text-red-400", bgColor: "bg-red-500/15", borderColor: "border-red-500/30", Icon: XCircle },
    PENDING: { label: "Non transmis", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/20", Icon: Send },
};

const CATEGORY_ICONS: Record<string, typeof FileText> = {
    materiel: FileText,
    plans: Map,
    calculs: Calculator,
};

const CATEGORY_COLORS: Record<string, { gradient: string; accent: string }> = {
    materiel: { gradient: "from-blue-500/20 to-cyan-500/20", accent: "text-cyan-400" },
    plans: { gradient: "from-purple-500/20 to-pink-500/20", accent: "text-purple-400" },
    calculs: { gradient: "from-amber-500/20 to-orange-500/20", accent: "text-amber-400" },
};

function DonutChart({ statuses, total }: { statuses: Record<string, number>; total: number }) {
    if (total === 0) return null;
    
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    
    // Order: APP, BPE, ASB, APR, ATT, PENDING, REF
    const order = ['APP', 'BPE', 'ASB', 'APR', 'ATT', 'PENDING', 'REF'];
    const segments = order
        .filter(s => (statuses[s] || 0) > 0)
        .map(status => ({
            status,
            count: statuses[status] || 0,
            pct: ((statuses[status] || 0) / total) * 100,
        }));
    
    // Colors for SVG
    const svgColors: Record<string, string> = {
        APP: '#34d399', BPE: '#22d3ee', ASB: '#a78bfa', APR: '#fbbf24', ATT: '#60a5fa', PENDING: '#6b7280', REF: '#f87171',
    };

    // Calculate approved percentage (APP + BPE + ASB)
    const approvedCount = (statuses['APP'] || 0) + (statuses['BPE'] || 0) + (statuses['ASB'] || 0);
    const approvedPct = Math.round((approvedCount / total) * 100);
    
    return (
        <div className="relative w-[96px] h-[96px] flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                {segments.map(({ status, pct }) => {
                    const dashLen = (pct / 100) * circumference;
                    const gap = circumference - dashLen;
                    const currentOffset = offset;
                    offset += dashLen;
                    return (
                        <circle key={status} cx="40" cy="40" r={radius} fill="none"
                            stroke={svgColors[status] || '#6b7280'} strokeWidth="7"
                            strokeDasharray={`${dashLen} ${gap}`}
                            strokeDashoffset={-currentOffset}
                            strokeLinecap="butt"
                            className="transition-all duration-700"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{approvedPct}%</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">validé</span>
            </div>
        </div>
    );
}

function CategoryCard({ summary }: { summary: DossierSummary }) {
    const colors = CATEGORY_COLORS[summary.category] || CATEGORY_COLORS.materiel;
    const CategoryIcon = CATEGORY_ICONS[summary.category] || FileText;
    
    const order = ['APP', 'BPE', 'ASB', 'APR', 'ATT', 'PENDING', 'REF'];
    
    return (
        <div className={`bg-gradient-to-br ${colors.gradient} backdrop-blur-sm border border-white/10 rounded-md p-6`}>
            <div className="flex items-start gap-5">
                <DonutChart statuses={summary.statuses} total={summary.total} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <CategoryIcon size={18} className={colors.accent} />
                        <h3 className="text-white font-semibold text-base">{summary.label}</h3>
                        <span className="text-gray-400 text-xs ml-auto bg-white/5 px-2 py-1 rounded-md">{summary.total} docs</span>
                    </div>
                    
                    {/* Transmitted bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300">Transmis</span>
                            <span className={colors.accent}>{summary.transmitted}/{summary.total} ({summary.total > 0 ? Math.round((summary.transmitted / summary.total) * 100) : 0}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
                                style={{ width: `${summary.total > 0 ? (summary.transmitted / summary.total) * 100 : 0}%` }} />
                        </div>
                    </div>
                    
                    {/* Status breakdown */}
                    <div className="flex flex-wrap gap-1.5">
                        {order.filter(s => (summary.statuses[s] || 0) > 0).map(status => {
                            const cfg = STATUS_LEGEND[status];
                            if (!cfg) return null;
                            const count = summary.statuses[status] || 0;
                            return (
                                <span key={status} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
                                    <cfg.Icon size={10} />
                                    {cfg.label}: {count}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Global summary bar across all 3 categories */
function GlobalSummary({ summaries }: { summaries: DossierSummary[] }) {
    const totalDocs = summaries.reduce((s, d) => s + d.total, 0);
    const totalTransmitted = summaries.reduce((s, d) => s + d.transmitted, 0);
    
    const allStatuses: Record<string, number> = {};
    for (const s of summaries) {
        for (const [k, v] of Object.entries(s.statuses)) {
            allStatuses[k] = (allStatuses[k] || 0) + v;
        }
    }
    
    const approved = (allStatuses['APP'] || 0) + (allStatuses['BPE'] || 0) + (allStatuses['ASB'] || 0);
    const withRemarks = allStatuses['APR'] || 0;
    const refused = allStatuses['REF'] || 0;
    const pending = (allStatuses['PENDING'] || 0) + (allStatuses['ATT'] || 0);
    
    return (
        <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 backdrop-blur-sm rounded-md border border-white/10 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-semibold text-white mb-1">Dossier Technique</h3>
                    <p className="text-blue-200/60 text-sm">{totalDocs} documents au total — {totalTransmitted} transmis</p>
                </div>
                <div className="flex gap-5">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{approved}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Approuvés</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">{withRemarks}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Avec remarques</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{refused}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Refusés</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{pending}</div>
                        <div className="text-[10px] text-gray-400 uppercase">En attente</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Removed getStatusColor

export default function DossierTechniqueTab({ project }: DossierTechniqueTabProps) {
    const [dossierSummaries, setDossierSummaries] = useState<DossierSummary[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = () => {
        if (!project?.id) return;
        setLoading(true);

        // Fetch documents summaries from DB
        fetch(`/api/hub/etudes?projectId=${project.id}`)
            .then(r => r.json())
            .then(d => {
                setDossierSummaries(d.summaries || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [project?.id]);

    const hasData = dossierSummaries.length > 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="technique"
                acceptTypes=".xlsx,.xls,.xlsm"
                title="Importer le Suivi des Études"
                subtitle="Glissez un fichier Excel contenant le suivi des études techniques (Gantt + Dossier Technique)"
                accentColor="cyan"
                icon={<ClipboardCheck size={36} className="text-cyan-400" />}
                onUploadComplete={() => {
                    fetchData();
                }}
            />

            {/* Data source indicator */}
            {!hasData ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-4 text-center">
                    <p className="text-xs text-amber-300">
                        Aucune donnée importée — importez un fichier Suivi des Études pour voir le dossier technique
                    </p>
                </div>
            ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-xs text-emerald-300 font-semibold">
                        Données importées actives — {dossierSummaries.reduce((s, d) => s + d.total, 0)} documents techniques suivis
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : hasData ? (
                <>
                    {dossierSummaries.length > 0 && (
                        <>
                            {/* Global summary */}
                            <GlobalSummary summaries={dossierSummaries} />

                            {/* Per-category cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {dossierSummaries.map(s => (
                                    <CategoryCard key={s.category} summary={s} />
                                ))}
                            </div>

                            {/* Status Legend */}
                            <div className="bg-[#080d1a]/60 border border-white/5 rounded-md p-4">
                                <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Légende des statuts</h4>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(STATUS_LEGEND).map(([code, cfg]) => (
                                        <span key={code} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
                                            <cfg.Icon size={12} />
                                            <strong>{code}</strong> = {cfg.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : null}
        </div>
    );
}
