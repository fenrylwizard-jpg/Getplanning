"use client";

import { useState } from "react";
import { CalendarRange, Target, Flag, Clock, Save, Trash2, CheckCircle, Wrench } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";
// useRouter removed — no longer needed after handleConfirm fix

interface PlanningMilestone {
    name: string;
    category: string;
    startDate: string;
    endDate: string;
    progress: number;
    color?: string;
    isUserTrade?: boolean;
    wbs?: string;
    wbsLevel?: number;
    lot?: string;
}

const TRADE_OPTIONS = [
    { value: "electricien", label: "⚡ Électricien", icon: "⚡" },
    { value: "chauffagiste", label: "🔥 Chauffagiste / HVAC", icon: "🔥" },
    { value: "plombier", label: "🔧 Plombier", icon: "🔧" },
    { value: "gainiste", label: "🌀 Gainiste", icon: "🌀" },
    { value: "menuisier", label: "🪵 Menuisier", icon: "🪵" },
    { value: "peintre", label: "🎨 Peintre", icon: "🎨" },
    { value: "carreleur", label: "🧱 Carreleur", icon: "🧱" },
    { value: "general", label: "🏗️ Tous corps d'état", icon: "🏗️" },
];

interface PlanningTabProps {
    project: {
        id: string;
        weeklyPlans: {
            id: string;
            weekNumber: number;
            year: number;
            isClosed: boolean;
            isSubmitted: boolean;
            targetReached: boolean | null;
        }[];
        planningMilestones?: {
            id: string;
            name: string;
            category: string | null;
            startDate: Date;
            endDate: Date;
            progress: number;
            isComplete: boolean;
            wbs: string | null;
            wbsLevel: number;
            isUserTrade: boolean;
            lot: string | null;
        }[];
    };
    readonlyMode?: boolean;
}

const DEMO_MILESTONES: PlanningMilestone[] = [
    { name: "Terrassement & Fondations", category: "Gros Œuvre", startDate: "2025-09-01", endDate: "2025-11-15", progress: 1.0, color: "emerald", isUserTrade: false },
    { name: "Élévation Murs Porteurs", category: "Gros Œuvre", startDate: "2025-11-01", endDate: "2026-02-28", progress: 0.85, color: "emerald", isUserTrade: false },
    { name: "Dalle & Planchers", category: "Gros Œuvre", startDate: "2026-01-15", endDate: "2026-04-30", progress: 0.45, color: "blue", isUserTrade: false },
    { name: "Charpente & Toiture", category: "Gros Œuvre", startDate: "2026-03-01", endDate: "2026-06-15", progress: 0.15, color: "blue", isUserTrade: false },
    { name: "Menuiseries Extérieures", category: "Second Œuvre", startDate: "2026-04-01", endDate: "2026-07-30", progress: 0, color: "amber", isUserTrade: false },
    { name: "Plomberie & Électricité", category: "Second Œuvre", startDate: "2026-05-15", endDate: "2026-09-30", progress: 0, color: "amber", isUserTrade: false },
    { name: "Revêtements & Finitions", category: "Finitions", startDate: "2026-08-01", endDate: "2026-11-30", progress: 0, color: "purple", isUserTrade: false },
    { name: "Réception & Livraison", category: "Livraison", startDate: "2026-11-15", endDate: "2026-12-31", progress: 0, color: "rose", isUserTrade: false },
];

const colorClasses: Record<string, { bg: string; bar: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", bar: "bg-gradient-to-r from-emerald-500 to-green-400", text: "text-emerald-400", border: "border-emerald-500/30" },
    blue: { bg: "bg-blue-500/10", bar: "bg-gradient-to-r from-blue-500 to-cyan-400", text: "text-blue-400", border: "border-blue-500/30" },
    amber: { bg: "bg-amber-500/10", bar: "bg-gradient-to-r from-amber-500 to-orange-400", text: "text-amber-400", border: "border-amber-500/30" },
    purple: { bg: "bg-purple-500/10", bar: "bg-gradient-to-r from-purple-500 to-indigo-400", text: "text-purple-400", border: "border-purple-500/30" },
    rose: { bg: "bg-rose-500/10", bar: "bg-gradient-to-r from-rose-500 to-pink-400", text: "text-rose-400", border: "border-rose-500/30" },
    default: { bg: "bg-white/10", bar: "bg-gradient-to-r from-gray-500 to-gray-400", text: "text-gray-400", border: "border-white/20" },
};

function assignColor(category: string) {
    const c = category.toLowerCase();
    if (c.includes("gros") || c.includes("fondation")) return "emerald";
    if (c.includes("charpente") || c.includes("toiture")) return "blue";
    if (c.includes("menuiserie") || c.includes("second") || c.includes("hvac") || c.includes("elec")) return "amber";
    if (c.includes("finition")) return "purple";
    if (c.includes("reception") || c.includes("livraison")) return "rose";
    return "blue";
}

export default function PlanningTab({ project, readonlyMode }: PlanningTabProps) {
    
    // Check if we have real DB milestones
    const existingMilestones = project.planningMilestones && project.planningMilestones.length > 0 
        ? project.planningMilestones.map(m => ({
            name: m.name,
            category: m.category || "Général",
            startDate: new Date(m.startDate).toISOString().split('T')[0],
            endDate: new Date(m.endDate).toISOString().split('T')[0],
            progress: m.progress,
            color: assignColor(m.category || "Général"),
            wbs: m.wbs || undefined,
            wbsLevel: m.wbsLevel || 0,
            isUserTrade: m.isUserTrade || false,
            lot: m.lot || undefined,
          }))
        : null;

    const [milestones, setMilestones] = useState<PlanningMilestone[] | null>(existingMilestones);
    const [isParsed, setIsParsed] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<string>("");
    const [showAll, setShowAll] = useState(false);
    const [hideFinished, setHideFinished] = useState(true);

    // If no existing milestones and no parsed ones, show demo. Or show real ones.
    const allMilestones = milestones || DEMO_MILESTONES;
    const isShowingRealData = milestones !== null;

    // Filter smartly: trade lines + their WBS parent section headers
    const tradeCount = allMilestones.filter(m => m.isUserTrade).length;
    // Collect all parent WBS prefixes of trade lines
    const parentPrefixes = new Set<string>();
    for (const m of allMilestones) {
        if (m.isUserTrade && m.wbs) {
            const parts = m.wbs.split('.');
            for (let i = 1; i < parts.length; i++) {
                parentPrefixes.add(parts.slice(0, i).join('.'));
            }
        }
    }
    const activeMilestones = (() => {
        let base = allMilestones;
        if (!showAll && allMilestones.length > 50 && tradeCount > 0) {
            // Include: trade lines + parent section headers + title lines (no lot = structural header)
            base = allMilestones.filter(m => {
                if (m.isUserTrade) return true;
                if (m.wbs && parentPrefixes.has(m.wbs)) return true;
                if (!m.isUserTrade && !m.lot && m.wbs) return true;
                return false;
            });
        }
        // Hide finished tasks (100%) if enabled
        if (hideFinished) {
            base = base.filter(m => m.progress < 1);
        }
        return base;
    })();
    const finishedCount = allMilestones.filter(m => m.progress >= 1).length;

    // Calculate timeline bounds safely (no spread to avoid stack overflow with 1000+ items)
    let minDate = Infinity;
    let maxDate = -Infinity;
    for (const m of activeMilestones) {
        const s = new Date(m.startDate).getTime();
        const e = new Date(m.endDate).getTime();
        if (!isNaN(s)) { minDate = Math.min(minDate, s); maxDate = Math.max(maxDate, s); }
        if (!isNaN(e)) { minDate = Math.min(minDate, e); maxDate = Math.max(maxDate, e); }
    }
    if (!isFinite(minDate) || !isFinite(maxDate)) {
        minDate = Date.now();
        maxDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    const totalSpan = Math.max(86400000, maxDate - minDate);
    const today = Date.now();
    const todayPct = Math.max(0, Math.min(100, ((today - minDate) / totalSpan) * 100));

    const completedCount = allMilestones.filter(m => m.progress >= 1).length;
    const inProgressCount = allMilestones.filter(m => m.progress > 0 && m.progress < 1).length;
    const upcomingCount = allMilestones.filter(m => m.progress === 0).length;

    const handleUploadComplete = (data: unknown) => {
        const d = data as { data?: Record<string, unknown>[] };
        if (d.data && Array.isArray(d.data)) {
            const processed: PlanningMilestone[] = d.data.map((m: Record<string, unknown>) => ({
                name: (m.name as string) || "Inconnu",
                category: (m.category as string) || "Général",
                startDate: (m.startDate as string) || new Date().toISOString().split('T')[0],
                endDate: (m.endDate as string) || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                progress: (m.progress as number) || 0,
                color: assignColor((m.category as string) || ""),
                isUserTrade: (m.isUserTrade as boolean) || false,
                wbs: (m.wbs as string) || "",
                wbsLevel: (m.wbsLevel as number) || 0,
            }));
            
            // Keep original order (PDF order = planning structure)
            setMilestones(processed);
            setIsParsed(true);
        }
    };

    const handleConfirm = async () => {
        if (!milestones) return;
        setSubmitting(true);
        
        try {
            const res = await fetch(`/api/project/${project.id}/planning/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ milestones })
            });

            if (res.ok) {
                // Mark as saved (no longer a "preview") — keep milestones in state
                setIsParsed(false);
                // Don't call refresh() — it would reset state to initial value
                // The milestones are already in state and will display correctly
            } else {
                const errData = await res.json().catch(() => null);
                alert(errData?.error || "Erreur de sauvegarde");
            }
        } catch (e) {
            console.error(e);
            alert("Erreur réseau requete API confirm");
        } finally {
            setSubmitting(false);
        }
    };

    const clearParsed = () => {
        setMilestones(existingMilestones);
        setIsParsed(false);
    };

    const handleProgressChange = (idx: number, newProgress: number) => {
        if (!milestones) return;
        const updated = [...milestones];
        // Find correct index in allMilestones (in case we're in filtered mode)
        const milestone = activeMilestones[idx];
        const realIdx = allMilestones.indexOf(milestone);
        if (realIdx >= 0 && realIdx < updated.length) {
            updated[realIdx] = { ...updated[realIdx], progress: newProgress };
            setMilestones(updated);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            {!readonlyMode && (
                <div className={isParsed ? "opacity-50 pointer-events-none" : ""}>
                    {/* Trade selector */}
                    {!selectedTrade ? (
                        <div className="bg-[#080d1a]/80 border border-purple-500/20 rounded-md p-6">
                            <h4 className="flex items-center gap-2 text-purple-300 font-bold mb-4">
                                <Wrench size={18} />
                                Quel est votre corps de métier ?
                            </h4>
                            <p className="text-xs text-gray-400 mb-4">
                                L&apos;IA mettra en évidence les tâches qui vous concernent directement.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {TRADE_OPTIONS.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setSelectedTrade(t.value)}
                                        className="px-4 py-3 rounded-md bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-sm text-gray-300 hover:text-purple-300 font-medium transition-all flex items-center gap-2"
                                    >
                                        <span className="text-lg">{t.icon}</span>
                                        {t.label.split(" ").slice(1).join(" ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs text-gray-400">Corps de métier :</span>
                                <span className="px-3 py-1 rounded-sm bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                                    {TRADE_OPTIONS.find(t => t.value === selectedTrade)?.label}
                                </span>
                                <button
                                    onClick={() => setSelectedTrade("")}
                                    className="text-[10px] text-gray-500 hover:text-purple-400 underline transition-colors"
                                >
                                    Changer
                                </button>
                            </div>
                            <FileUploadZone
                                projectId={project.id}
                                module="planning"
                                acceptTypes=".pdf"
                                title="Importer le Planning"
                                subtitle={isParsed ? "Un planning est en cours de révision..." : "Glissez un PDF (Gantt) pour laisser l'IA Gemini extraire les jalons"}
                                accentColor="purple"
                                onUploadComplete={handleUploadComplete}
                                icon={<CalendarRange size={36} className="text-purple-400" />}
                                extraFormData={{ trade: selectedTrade }}
                            />
                        </>
                    )}
                </div>
            )}

            {/* AI Confirmation Banner */}
            {isParsed && (
                <div className="bg-purple-900/30 border border-purple-500/40 rounded-md p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h4 className="flex items-center gap-2 text-purple-300 font-bold mb-1">
                            <span className="text-lg">✨</span> IA Gemini a analysé le document
                        </h4>
                        <p className="text-sm text-purple-200/80">
                            {milestones?.length} jalons extraits. Veuillez vérifier le résultat ci-dessous.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={clearParsed} 
                            className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Annuler
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="px-6 py-2 rounded-md bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/> : <Save size={16} />}
                            Sauvegarder et Valider
                        </button>
                    </div>
                </div>
            )}

            {/* KPI Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Flag size={22} className="text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black"><T k="hub_milestones_completed" /></div>
                        <div className="text-2xl font-black text-emerald-400">{completedCount}</div>
                    </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Clock size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black"><T k="hub_in_progress" /></div>
                        <div className="text-2xl font-black text-blue-400">{inProgressCount}</div>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Target size={22} className="text-amber-400" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-amber-400 font-black"><T k="hub_upcoming" /></div>
                        <div className="text-2xl font-black text-amber-400">{upcomingCount}</div>
                    </div>
                </div>
            </div>

            {/* Gantt Timeline */}
            <div className={`bg-[#080d1a]/80 border ${isParsed ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-white/5'} rounded-md p-6 overflow-x-auto overflow-y-auto max-h-[80vh] transition-all relative`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-black uppercase tracking-widest text-gray-300 flex items-center gap-2">
                        <CalendarRange size={18} className={isParsed ? "text-purple-400" : "text-blue-400"} />
                        <T k="hub_project_timeline" />
                        {isParsed && <span className="ml-2 px-2 py-0.5 rounded-sm bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">PREVIEW IA</span>}
                        <span className="text-xs text-gray-400 font-normal ml-2">({activeMilestones.length}{!showAll && tradeCount > 0 && allMilestones.length > 50 ? ` ⭐ / ${allMilestones.length} total` : ''})</span>
                    </h3>
                    <div className="flex gap-2">
                        {finishedCount > 0 && (
                            <button
                                onClick={() => setHideFinished(!hideFinished)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-sm transition-all border flex items-center gap-1.5 ${hideFinished ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}
                            >
                                <CheckCircle size={14} />
                                {hideFinished ? `Afficher terminés (${finishedCount})` : `Masquer terminés`}
                            </button>
                        )}
                        {allMilestones.length > 50 && tradeCount > 0 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all border"
                                style={showAll ? {background: 'rgba(168,85,247,0.2)', borderColor: 'rgba(168,85,247,0.4)', color: '#c084fc'} : {background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af'}}
                            >
                                {showAll ? `⭐ Mon métier (${tradeCount})` : `Tout afficher (${allMilestones.length})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Timeline header with year + month rows */}
                <div className="relative min-w-[900px]">
                    {(() => {
                        // Build proper monthly columns from minDate to maxDate
                        const startD = new Date(minDate);
                        const endD = new Date(maxDate);
                        const months: { year: number; month: number; label: string }[] = [];
                        const cur = new Date(startD.getFullYear(), startD.getMonth(), 1);
                        while (cur <= endD) {
                            months.push({
                                year: cur.getFullYear(),
                                month: cur.getMonth(),
                                label: cur.toLocaleString('fr', { month: 'short' }).toUpperCase()
                            });
                            cur.setMonth(cur.getMonth() + 1);
                        }
                        // Group months by year
                        const years: { year: number; colCount: number }[] = [];
                        for (const m of months) {
                            const last = years[years.length - 1];
                            if (last && last.year === m.year) { last.colCount++; }
                            else { years.push({ year: m.year, colCount: 1 }); }
                        }
                        const LABEL_W = 380;
                        return (
                            <div className="sticky top-0 z-10 bg-[#080d1a] pb-1 border-b border-white/15">
                                {/* Year row */}
                                <div className="flex" style={{ marginLeft: LABEL_W }}>
                                    {years.map((y, i) => (
                                        <div key={i} className="text-center border-l border-white/10 first:border-l-0" style={{ flex: y.colCount }}>
                                            <span className="text-sm font-black text-white tracking-widest">{y.year}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Month row */}
                                <div className="flex" style={{ marginLeft: LABEL_W }}>
                                    {months.map((m, i) => (
                                        <div key={i} className="flex-1 text-center border-l border-white/5 first:border-l-0 py-0.5">
                                            <span className="text-[11px] font-bold text-gray-300 tracking-wider">{m.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Today marker — properly positioned */}
                    {todayPct >= 0 && todayPct <= 100 && (
                        <div
                            className="absolute top-0 bottom-0 z-20 pointer-events-none"
                            style={{ left: `calc(380px + (100% - 380px) * ${todayPct / 100})` }}
                        >
                            <div className="w-0.5 h-full bg-red-500/70" />
                            <div className="absolute top-1 -left-[22px] px-2 py-0.5 rounded bg-red-500 text-[9px] font-black text-white uppercase tracking-wider whitespace-nowrap">
                                Aujourd&apos;hui
                            </div>
                        </div>
                    )}

                    {/* Gantt bars */}
                    <div className="flex flex-col gap-0.5 mt-1">
                        {activeMilestones.map((milestone, idx) => {
                            const startNum = new Date(milestone.startDate).getTime();
                            const endNum = new Date(milestone.endDate).getTime();
                            
                            const safeStart = isNaN(startNum) ? minDate : startNum;
                            const safeEnd = isNaN(endNum) ? maxDate : endNum;

                            const startPct = Math.max(0, Math.min(100, ((safeStart - minDate) / totalSpan) * 100));
                            const widthPct = Math.max(1, Math.min(100, ((safeEnd - safeStart) / totalSpan) * 100));
                            
                            const c = colorClasses[milestone.color || 'blue'] || colorClasses.blue;
                            const pctValue = Math.round(milestone.progress * 100);
                            const isSection = !milestone.isUserTrade && !!milestone.wbs && (!milestone.lot || parentPrefixes.has(milestone.wbs));
                            const indent = Math.min(3, (milestone.wbsLevel || 1) - 1);

                            // Section headers
                            if (isSection) {
                                return (
                                    <div key={idx} className="flex items-center gap-2 rounded-md px-2 py-2 mt-1.5 border-b border-white/10 bg-white/[0.03]">
                                        <div className="w-[320px] flex-shrink-0" style={{ paddingLeft: `${indent * 14}px` }}>
                                            <div className="text-sm font-black uppercase tracking-wide text-white">
                                                <span className="text-gray-500 mr-1.5">{milestone.wbs}</span>
                                                {milestone.name}
                                            </div>
                                            <span className={`text-[11px] uppercase tracking-widest ${c.text} font-bold`}>{milestone.category}</span>
                                        </div>
                                        <div className="w-[56px] flex-shrink-0">
                                            {!readonlyMode ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={pctValue}
                                                    onChange={(e) => {
                                                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                        handleProgressChange(idx, val / 100);
                                                    }}
                                                    className="w-full text-center text-sm font-black bg-white/10 border border-white/20 rounded px-1 py-1 text-white outline-none focus:border-purple-500/50 focus:bg-purple-500/10 transition-colors"
                                                    title="% avancement"
                                                />
                                            ) : (
                                                <span className="text-sm font-black text-white text-center block">{pctValue}%</span>
                                            )}
                                        </div>
                                        <div className="flex-1 relative h-6">
                                            <div
                                                className={`absolute top-1 h-4 rounded ${c.bg} border ${c.border}`}
                                                style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            // Regular task rows
                            return (
                                <div key={idx} className="flex items-center gap-2 group hover:bg-white/5 rounded-md px-2 py-1.5 transition-colors">
                                    <div className="w-[320px] flex-shrink-0" style={{ paddingLeft: `${indent * 14}px` }}>
                                        <div className={`text-sm font-bold leading-tight ${milestone.isUserTrade ? 'text-yellow-300' : 'text-gray-100'}`}>
                                            {milestone.isUserTrade && <span className="mr-1">⭐</span>}
                                            <span className="text-gray-500 mr-1">{milestone.wbs}</span>
                                            {milestone.name}
                                        </div>
                                        <span className={`text-[11px] uppercase tracking-widest ${c.text} font-bold`}>{milestone.category}</span>
                                    </div>
                                    <div className="w-[56px] flex-shrink-0">
                                        {!readonlyMode ? (
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={pctValue}
                                                onChange={(e) => {
                                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                    handleProgressChange(idx, val / 100);
                                                }}
                                                className="w-full text-center text-sm font-black bg-white/10 border border-white/20 rounded px-1 py-1 text-white outline-none focus:border-purple-500/50 focus:bg-purple-500/10 transition-colors"
                                                title="% avancement"
                                            />
                                        ) : (
                                            <span className="text-sm font-black text-white text-center block">{pctValue}%</span>
                                        )}
                                    </div>
                                    <div className="flex-1 relative h-8">
                                        <div
                                            className={`absolute top-0.5 h-7 rounded-lg ${c.bg} border ${c.border} overflow-hidden transition-all`}
                                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                        >
                                            <div
                                                className={`h-full ${c.bar} rounded-lg transition-all duration-700`}
                                                style={{ width: `${Math.min(100, pctValue)}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-black text-white drop-shadow-lg">
                                                    {pctValue}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Info banner if no REAL data and not currently previewing */}
            {!isShowingRealData && !isParsed && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-md p-4 text-center">
                    <p className="text-xs text-purple-300 flex items-center justify-center gap-2">
                        <CheckCircle size={14} className="text-purple-400" />
                        <T k="hub_demo_data_notice" /> — Importez un PDF Gantt pour analyser avec l&apos;IA
                    </p>
                </div>
            )}
        </div>
    );
}

