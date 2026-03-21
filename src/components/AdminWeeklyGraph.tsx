"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceLine } from 'recharts';
import T from '@/components/T';

interface GraphData {
    timeLabel: string;
    [key: string]: string | number;
}

const PROJECT_THEMES = [
    { hex: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-500/15', activeDot: 'bg-violet-500' },
    { hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500/15', activeDot: 'bg-blue-500' },
    { hex: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500/15', activeDot: 'bg-emerald-500' },
    { hex: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500/15', activeDot: 'bg-amber-500' },
    { hex: '#ef4444', border: 'border-red-500', bg: 'bg-red-500/15', activeDot: 'bg-red-500' },
    { hex: '#ec4899', border: 'border-pink-500', bg: 'bg-pink-500/15', activeDot: 'bg-pink-500' },
    { hex: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-500/15', activeDot: 'bg-cyan-500' },
    { hex: '#84cc16', border: 'border-lime-500', bg: 'bg-lime-500/15', activeDot: 'bg-lime-500' },
    { hex: '#6366f1', border: 'border-indigo-500', bg: 'bg-indigo-500/15', activeDot: 'bg-indigo-500' },
    { hex: '#14b8a6', border: 'border-teal-500', bg: 'bg-teal-500/15', activeDot: 'bg-teal-500' }
];

type ViewMode = 'hours' | 'pct';

export default function AdminWeeklyGraph() {
    const [data, setData] = useState<GraphData[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [visibleProjects, setVisibleProjects] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('hours');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/weekly-stats');
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data || []);
                    setProjects(result.projects || []);
                    setVisibleProjects(new Set(result.projects || []));
                }
            } catch (err) {
                console.error('Failed to fetch weekly stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleProject = (proj: string) => {
        setVisibleProjects(prev => {
            const next = new Set(prev);
            if (next.has(proj)) {
                next.delete(proj);
            } else {
                next.add(proj);
            }
            return next;
        });
    };

    const toggleAll = (showAll: boolean) => {
        if (showAll) {
            setVisibleProjects(new Set(projects));
        } else {
            setVisibleProjects(new Set());
        }
    };

    if (loading) {
        return (
            <div className="glass-panel rounded-md p-6 min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="glass-panel rounded-md p-6 min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span>
                <p>Aucune donnée historique trouvée pour le graphique.</p>
            </div>
        );
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null;
        return (
            <div className="bg-[#0a1428] border border-white/10 rounded-lg p-3 shadow-xl min-w-[180px]">
                <p className="text-xs text-gray-400 mb-2 font-bold">{label}</p>
                {payload.map((entry: any, i: number) => {
                    const name = entry.name as string;
                    const isPlanned = name.includes('(Planifié)');
                    return (
                        <div key={i} className="flex justify-between items-center gap-4 py-0.5">
                            <span className="flex items-center gap-1.5 text-xs text-gray-300">
                                <span className="w-2.5 h-0.5 rounded-full" style={{
                                    backgroundColor: entry.color,
                                    opacity: isPlanned ? 0.5 : 1,
                                }} />
                                {name}
                            </span>
                            <span className="text-xs font-bold text-white">
                                {typeof entry.value === 'number' 
                                    ? viewMode === 'hours' ? `${entry.value.toFixed(1)}h` : `${entry.value}%`
                                    : entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="glass-panel rounded-md p-6 w-full mt-6 border border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        <T k="weekly_performance_graph" />
                    </h2>
                    <p className="text-sm text-gray-400">
                        Planifié vs Réalisé — par projet et par semaine
                    </p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-2 items-center">
                    {/* View Mode Toggle */}
                    <div className="flex rounded-md overflow-hidden border border-white/10 mr-2">
                        <button
                            onClick={() => setViewMode('hours')}
                            className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'hours' ? 'bg-purple-500/30 text-purple-300 border-r border-purple-500/30' : 'bg-white/3 text-gray-500 border-r border-white/10 hover:text-white/80'}`}
                        >
                            ⏱ Heures
                        </button>
                        <button
                            onClick={() => setViewMode('pct')}
                            className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'pct' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/3 text-gray-500 hover:text-white/80'}`}
                        >
                            % Productivité
                        </button>
                    </div>
                    <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10">Tout cocher</button>
                    <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10">Tout décocher</button>
                </div>
            </div>

            {/* Project Toggles */}
            <div className="flex flex-wrap gap-2 mb-6 max-h-32 overflow-y-auto pb-2 pr-2 custom-scrollbar">
                {projects.map((proj, idx) => {
                    const isVisible = visibleProjects.has(proj);
                    const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];
                    const activeClasses = isVisible ? `${theme.border} ${theme.bg} text-white` : 'border-white/10 bg-white/2 text-slate-500 opacity-60 hover:opacity-100';
                    const activeDotClass = isVisible ? theme.activeDot : 'bg-slate-700';

                    return (
                        <button
                            key={proj}
                            onClick={() => toggleProject(proj)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-semibold transition-all ${activeClasses}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activeDotClass}`} />
                            {proj}
                        </button>
                    );
                })}
            </div>

            {/* Legend hint */}
            <div className="flex items-center gap-4 mb-3 text-[10px] text-gray-600 uppercase tracking-wider font-bold">
                <span className="flex items-center gap-1.5">
                    <span className="w-6 h-0.5 bg-gray-500 rounded" /> Planifié (trait continu)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-6 h-0.5 border-t-2 border-dashed border-gray-500" /> Réalisé (trait pointillé épais)
                </span>
            </div>

            {/* Chart Area */}
            <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            {projects.map((proj, idx) => {
                                const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];
                                return (
                                    <linearGradient key={proj} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0}/>
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                            dataKey="timeLabel" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickMargin={10}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12}
                            tickFormatter={(val) => viewMode === 'hours' ? `${val}h` : `${val}%`}
                            width={50}
                            domain={viewMode === 'pct' ? [0, 'auto'] : [0, 'auto']}
                        />
                        {viewMode === 'pct' && (
                            <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="6 4" strokeWidth={1} label={{ value: '100%', position: 'right', fill: '#22c55e', fontSize: 10 }} />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} 
                            formatter={(value: string) => {
                                return <span className="text-gray-400 text-[11px]">{value}</span>;
                            }}
                        />
                        
                        {projects.map((proj, idx) => {
                            const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];
                            if (!visibleProjects.has(proj)) return null;

                            if (viewMode === 'pct') {
                                // In % mode: just show productivity % per project
                                return (
                                    <Line
                                        key={`${proj}_pct`}
                                        type="monotone"
                                        dataKey={`${proj}_pct`}
                                        name={`${proj}`}
                                        stroke={theme.hex}
                                        strokeWidth={3}
                                        dot={{ fill: '#0f172a', strokeWidth: 2, r: 4, stroke: theme.hex }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.hex }}
                                        connectNulls
                                    />
                                );
                            }

                            // Hours mode: show planned (solid) + achieved (dashed) per-project
                            return (
                                <React.Fragment key={proj}>
                                    <Line
                                        type="monotone"
                                        dataKey={`${proj}_planned`}
                                        name={`${proj} (Planifié)`}
                                        stroke={theme.hex}
                                        strokeWidth={2}
                                        strokeOpacity={0.5}
                                        dot={{ fill: '#0f172a', strokeWidth: 2, r: 3, stroke: theme.hex }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: theme.hex }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={`${proj}_achieved`}
                                        name={`${proj} (Réalisé)`}
                                        stroke={theme.hex}
                                        strokeWidth={3}
                                        strokeDasharray="8 4"
                                        dot={{ fill: theme.hex, strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: theme.hex }}
                                        connectNulls
                                    />
                                </React.Fragment>
                            );
                        })}

                        <Brush 
                            dataKey="timeLabel" 
                            height={30} 
                            stroke="#8b5cf6"
                            fill="#0f172a"
                            travellerWidth={10}
                            tickFormatter={() => ''}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
