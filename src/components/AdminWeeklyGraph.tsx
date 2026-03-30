"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import T from '@/components/T';

interface GraphData {
    timeLabel: string;
    [key: string]: string | number;
}

const PROJECT_THEMES = [
    { hex: '#8b5cf6', hexAlt: '#c084fc' },
    { hex: '#3b82f6', hexAlt: '#60a5fa' },
    { hex: '#10b981', hexAlt: '#34d399' },
    { hex: '#f59e0b', hexAlt: '#fbbf24' },
    { hex: '#ef4444', hexAlt: '#f87171' },
    { hex: '#ec4899', hexAlt: '#f472b6' },
    { hex: '#06b6d4', hexAlt: '#22d3ee' },
    { hex: '#84cc16', hexAlt: '#a3e635' },
    { hex: '#6366f1', hexAlt: '#818cf8' },
    { hex: '#14b8a6', hexAlt: '#2dd4bf' }
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
            next.has(proj) ? next.delete(proj) : next.add(proj);
            return next;
        });
    };

    const toggleAll = (showAll: boolean) => {
        setVisibleProjects(showAll ? new Set(projects) : new Set());
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
                <p>Aucune donnée historique trouvée.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: '#0a1428', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '2px 0' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1' }}>
                            <span style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: entry.color, display: 'inline-block' }} />
                            {entry.name}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                            {typeof entry.value === 'number'
                                ? viewMode === 'hours' ? `${entry.value.toFixed(1)}h` : `${entry.value}%`
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="glass-panel rounded-md p-6 w-full mt-6 border border-white/5">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        <T k="weekly_performance_graph" />
                    </h2>
                    <p className="text-sm text-gray-400">
                        {viewMode === 'hours'
                            ? 'Heures cumulées — Planifié vs Réalisé par projet'
                            : 'Productivité hebdomadaire (%) par projet'}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2 items-center">
                    <div className="flex rounded-md overflow-hidden border border-white/10 mr-2">
                        <button
                            onClick={() => setViewMode('hours')}
                            className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'hours' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-500 hover:text-white/80'}`}
                        >
                            ⏱ Heures
                        </button>
                        <button
                            onClick={() => setViewMode('pct')}
                            className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'pct' ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-gray-500 hover:text-white/80'}`}
                        >
                            📊 %
                        </button>
                    </div>
                    <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10">Tout cocher</button>
                    <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10">Tout décocher</button>
                </div>
            </div>

            {/* Project Toggles */}
            <div className="flex flex-wrap gap-2 mb-4">
                {projects.map((proj, idx) => {
                    const isVisible = visibleProjects.has(proj);
                    const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];
                    return (
                        <button
                            key={proj}
                            onClick={() => toggleProject(proj)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-semibold transition-all ${isVisible ? 'text-white border-white/20' : 'text-slate-600 border-white/5 opacity-50 hover:opacity-100'}`}
                            style={isVisible ? { backgroundColor: `${theme.hex}20`, borderColor: `${theme.hex}40` } : {}}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isVisible ? theme.hex : '#475569' }} />
                            {proj}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            {viewMode === 'hours' && (
                <div className="flex items-center gap-6 mb-3 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-2">
                        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#94a3b8" strokeWidth="2"/></svg>
                        Planifié
                    </span>
                    <span className="flex items-center gap-2">
                        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 3"/></svg>
                        Réalisé
                    </span>
                </div>
            )}

            {/* Chart */}
            <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(val) => viewMode === 'hours' ? `${val}h` : `${val}%`}
                            width={55}
                            domain={[0, 'auto']}
                        />
                        {viewMode === 'pct' && (
                            <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="6 4" strokeWidth={1} />
                        )}
                        <Tooltip content={<CustomTooltip />} />

                        {projects.map((proj, idx) => {
                            if (!visibleProjects.has(proj)) return null;
                            const theme = PROJECT_THEMES[idx % PROJECT_THEMES.length];

                            if (viewMode === 'pct') {
                                return (
                                    <Line
                                        key={`${proj}_pct`}
                                        type="monotone"
                                        dataKey={`${proj}_pct`}
                                        name={proj}
                                        stroke={theme.hex}
                                        strokeWidth={3}
                                        dot={{ fill: '#0f172a', strokeWidth: 2, r: 4, stroke: theme.hex }}
                                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: theme.hex }}
                                        connectNulls
                                    />
                                );
                            }

                            // Hours mode: cumulative planned (solid) + achieved (dashed bold)
                            return (
                                <React.Fragment key={proj}>
                                    <Line
                                        type="monotone"
                                        dataKey={`${proj}_planned`}
                                        name={`${proj} (Planifié)`}
                                        stroke={theme.hex}
                                        strokeWidth={2}
                                        dot={{ fill: '#0f172a', strokeWidth: 2, r: 3, stroke: theme.hex }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: theme.hex }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={`${proj}_achieved`}
                                        name={`${proj} (Réalisé)`}
                                        stroke={theme.hexAlt}
                                        strokeWidth={3}
                                        strokeDasharray="6 3"
                                        dot={{ fill: theme.hexAlt, strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: theme.hexAlt }}
                                        connectNulls
                                    />
                                </React.Fragment>
                            );
                        })}

                        {data.length > 6 && (
                            <Brush
                                dataKey="timeLabel"
                                height={30}
                                stroke="#8b5cf6"
                                fill="#0f172a"
                                travellerWidth={10}
                                tickFormatter={() => ''}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
