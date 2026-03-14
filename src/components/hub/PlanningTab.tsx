"use client";

import { useState } from "react";
import { CalendarRange, Target, Flag, Clock, ChevronRight } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

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
    };
}

// Demo milestones to showcase the timeline design
const DEMO_MILESTONES = [
    { name: "Terrassement & Fondations", category: "Gros Œuvre", startDate: "2025-09-01", endDate: "2025-11-15", progress: 1.0, color: "emerald" },
    { name: "Élévation Murs Porteurs", category: "Gros Œuvre", startDate: "2025-11-01", endDate: "2026-02-28", progress: 0.85, color: "emerald" },
    { name: "Dalle & Planchers", category: "Gros Œuvre", startDate: "2026-01-15", endDate: "2026-04-30", progress: 0.45, color: "blue" },
    { name: "Charpente & Toiture", category: "Gros Œuvre", startDate: "2026-03-01", endDate: "2026-06-15", progress: 0.15, color: "blue" },
    { name: "Menuiseries Extérieures", category: "Second Œuvre", startDate: "2026-04-01", endDate: "2026-07-30", progress: 0, color: "amber" },
    { name: "Plomberie & Électricité", category: "Second Œuvre", startDate: "2026-05-15", endDate: "2026-09-30", progress: 0, color: "amber" },
    { name: "Revêtements & Finitions", category: "Finitions", startDate: "2026-08-01", endDate: "2026-11-30", progress: 0, color: "purple" },
    { name: "Réception & Livraison", category: "Livraison", startDate: "2026-11-15", endDate: "2026-12-31", progress: 0, color: "rose" },
];

const colorClasses: Record<string, { bg: string; bar: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", bar: "bg-gradient-to-r from-emerald-500 to-green-400", text: "text-emerald-400", border: "border-emerald-500/30" },
    blue: { bg: "bg-blue-500/10", bar: "bg-gradient-to-r from-blue-500 to-cyan-400", text: "text-blue-400", border: "border-blue-500/30" },
    amber: { bg: "bg-amber-500/10", bar: "bg-gradient-to-r from-amber-500 to-orange-400", text: "text-amber-400", border: "border-amber-500/30" },
    purple: { bg: "bg-purple-500/10", bar: "bg-gradient-to-r from-purple-500 to-indigo-400", text: "text-purple-400", border: "border-purple-500/30" },
    rose: { bg: "bg-rose-500/10", bar: "bg-gradient-to-r from-rose-500 to-pink-400", text: "text-rose-400", border: "border-rose-500/30" },
};

export default function PlanningTab({ project }: PlanningTabProps) {
    const [showDemo] = useState(true);

    // Calculate timeline bounds for demo
    const allDates = DEMO_MILESTONES.flatMap(m => [new Date(m.startDate).getTime(), new Date(m.endDate).getTime()]);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const totalSpan = maxDate - minDate;
    const today = new Date().getTime();
    const todayPct = Math.max(0, Math.min(100, ((today - minDate) / totalSpan) * 100));

    const completedCount = DEMO_MILESTONES.filter(m => m.progress >= 1).length;
    const inProgressCount = DEMO_MILESTONES.filter(m => m.progress > 0 && m.progress < 1).length;
    const upcomingCount = DEMO_MILESTONES.filter(m => m.progress === 0).length;

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="planning"
                acceptTypes=".pdf,.xlsx,.xls"
                title="Importer le Planning"
                subtitle="Glissez un PDF ou fichier Excel du planning projet pour extraire les jalons"
                accentColor="purple"
                icon={<CalendarRange size={36} className="text-purple-400" />}
            />

            {/* Demo Timeline Section */}
            {showDemo && (
                <>
                    {/* KPI Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Flag size={22} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black"><T k="hub_milestones_completed" /></div>
                                <div className="text-2xl font-black text-emerald-400">{completedCount}</div>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Clock size={22} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black"><T k="hub_in_progress" /></div>
                                <div className="text-2xl font-black text-blue-400">{inProgressCount}</div>
                            </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Target size={22} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-amber-400 font-black"><T k="hub_upcoming" /></div>
                                <div className="text-2xl font-black text-amber-400">{upcomingCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Gantt Timeline */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6 overflow-x-auto">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <CalendarRange size={16} className="text-purple-400" />
                            <T k="hub_project_timeline" />
                        </h3>

                        {/* Timeline header with months */}
                        <div className="relative min-w-[800px]">
                            {/* Month markers */}
                            <div className="flex mb-4 ml-[220px]">
                                {Array.from({ length: 16 }, (_, i) => {
                                    const d = new Date(2025, 8 + i, 1);
                                    return (
                                        <div key={i} className="flex-1 text-center">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                                                {d.toLocaleString("fr", { month: "short" })}
                                            </span>
                                            <span className="text-[8px] text-gray-600 ml-1">{d.getFullYear().toString().slice(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Today marker */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500/60 z-20"
                                style={{ left: `calc(220px + ${todayPct}% * (100% - 220px) / 100)` }}
                            >
                                <div className="absolute -top-1 -left-3 px-1.5 py-0.5 rounded bg-red-500 text-[8px] font-black text-white uppercase tracking-wider whitespace-nowrap">
                                    Aujourd&apos;hui
                                </div>
                            </div>

                            {/* Gantt bars */}
                            <div className="flex flex-col gap-2">
                                {DEMO_MILESTONES.map((milestone, idx) => {
                                    const startPct = ((new Date(milestone.startDate).getTime() - minDate) / totalSpan) * 100;
                                    const widthPct = ((new Date(milestone.endDate).getTime() - new Date(milestone.startDate).getTime()) / totalSpan) * 100;
                                    const c = colorClasses[milestone.color] || colorClasses.blue;

                                    return (
                                        <div key={idx} className="flex items-center gap-4 group hover:bg-white/5 rounded-xl p-1.5 transition-colors">
                                            {/* Label */}
                                            <div className="w-[200px] flex-shrink-0">
                                                <div className="text-xs font-bold text-gray-200 truncate">{milestone.name}</div>
                                                <div className={`text-[9px] uppercase tracking-widest ${c.text} font-bold`}>{milestone.category}</div>
                                            </div>
                                            {/* Bar area */}
                                            <div className="flex-1 relative h-8">
                                                {/* Background track */}
                                                <div
                                                    className={`absolute top-1 h-6 rounded-lg ${c.bg} border ${c.border} overflow-hidden transition-all`}
                                                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                                >
                                                    {/* Progress fill */}
                                                    <div
                                                        className={`h-full ${c.bar} rounded-lg transition-all duration-700`}
                                                        style={{ width: `${milestone.progress * 100}%` }}
                                                    />
                                                    {/* Progress label */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-[9px] font-black text-white/80 drop-shadow">
                                                            {Math.round(milestone.progress * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Status icon */}
                                            <div className="w-6 flex-shrink-0 flex justify-center">
                                                {milestone.progress >= 1 ? (
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                                        <ChevronRight size={10} className="text-emerald-400" />
                                                    </div>
                                                ) : milestone.progress > 0 ? (
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center animate-pulse">
                                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Info banner */}
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-purple-300">
                            <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
