"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import T from '@/components/T';

interface GraphData {
    timeLabel: string;
    [projectName: string]: string | number;
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

export default function AdminWeeklyGraph() {
    const [data, setData] = useState<GraphData[]>([]);
    const [projects, setProjects] = useState<string[]>([]);
    const [visibleProjects, setVisibleProjects] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/weekly-stats');
                if (res.ok) {
                    const result = await res.json();
                    setData(result.data || []);
                    setProjects(result.projects || []);
                    // Initially show all projects
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
            <div className="glass-panel rounded-md p-6 min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">analytics</span>
                <p>Aucune donnée historique trouvée pour le graphique.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-md p-6 w-full mt-6 bg-[#060b18]/50 border border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        <T k="weekly_performance_graph" />
                    </h2>
                    <p className="text-sm text-slate-400">
                        <T k="weekly_performance_desc" />
                    </p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-2">
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

            {/* Chart Area */}
            <div className="h-[400px] w-full mt-4">
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
                            tickFormatter={(val) => `${val}h`}
                            width={50}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#e2e8f0', fontSize: '13px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
                            formatter={(value: string | number | undefined) => {
                                if (typeof value === 'number') {
                                    return [`${value.toFixed(1)}h`, undefined];
                                }
                                return [String(value), undefined];
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        
                        {projects.map((proj, idx) => {
                            const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];
                            if (!visibleProjects.has(proj)) return null;
                            return (
                                <Line
                                    key={proj}
                                    type="monotone"
                                    dataKey={proj}
                                    stroke={theme.hex}
                                    strokeWidth={3}
                                    dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    connectNulls
                                />
                            );
                        })}

                        <Brush 
                            dataKey="timeLabel" 
                            height={30} 
                            stroke="#8b5cf6"
                            fill="#0f172a"
                            travellerWidth={10}
                            tickFormatter={() => ''} /* hide ticks */
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
