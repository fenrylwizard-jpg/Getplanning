"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight, Calendar } from 'lucide-react';

interface WeekData {
    weekLabel: string;
    plannedHours: number;
    achievedHours: number;
    efficiency: number;
    taskCount: number;
}

interface WeekComparisonProps {
    projectId: string;
}

export default function WeekComparison({ projectId }: WeekComparisonProps) {
    const [weekA, setWeekA] = useState<WeekData | null>(null);
    const [weekB, setWeekB] = useState<WeekData | null>(null);
    const [weeks, setWeeks] = useState<string[]>([]);
    const [selectedA, setSelectedA] = useState('');
    const [selectedB, setSelectedB] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWeeks() {
            try {
                const res = await fetch(`/api/project/${projectId}/weeks`);
                if (res.ok) {
                    const data = await res.json();
                    setWeeks(data.weeks || []);
                    if (data.weeks?.length >= 2) {
                        setSelectedA(data.weeks[1]);
                        setSelectedB(data.weeks[0]);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch weeks:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchWeeks();
    }, [projectId]);

    useEffect(() => {
        async function fetchWeekData(weekLabel: string, setter: (d: WeekData) => void) {
            try {
                const res = await fetch(`/api/project/${projectId}/weeks/${weekLabel}`);
                if (res.ok) {
                    const data = await res.json();
                    setter(data);
                }
            } catch (e) {
                console.error('Failed to fetch week data:', e);
            }
        }
        if (selectedA) fetchWeekData(selectedA, setWeekA);
        if (selectedB) fetchWeekData(selectedB, setWeekB);
    }, [selectedA, selectedB, projectId]);

    const DeltaIndicator = ({ a, b, unit = '', inverted = false }: { a: number; b: number; unit?: string; inverted?: boolean }) => {
        const diff = b - a;
        const pct = a > 0 ? ((diff / a) * 100).toFixed(0) : '∞';
        const isPositive = inverted ? diff < 0 : diff > 0;
        
        if (Math.abs(diff) < 0.01) {
            return <span className="text-gray-400 flex items-center gap-1"><Minus size={14} /> Pareil</span>;
        }
        
        return (
            <span className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit} ({pct}%)
            </span>
        );
    };

    if (loading) return null;
    if (weeks.length < 2) return null;

    return (
        <div className="glass-card bg-[#0a1020]/80 border border-white/5 rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <ArrowLeftRight size={18} className="text-purple-400" />
                    Comparaison Semaine par Semaine
                </h3>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-1 block">
                        <Calendar size={12} className="inline mr-1" /> Semaine A
                    </label>
                    <select 
                        value={selectedA} 
                        onChange={e => setSelectedA(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                    >
                        {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
                <div className="flex items-end pb-2">
                    <ArrowLeftRight size={16} className="text-gray-500" />
                </div>
                <div className="flex-1">
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-1 block">
                        <Calendar size={12} className="inline mr-1" /> Semaine B
                    </label>
                    <select 
                        value={selectedB} 
                        onChange={e => setSelectedB(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                    >
                        {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            {weekA && weekB && (
                <div className="grid grid-cols-3 gap-4">
                    <ComparisonCard 
                        label="Heures Planifiées"
                        valueA={weekA.plannedHours}
                        valueB={weekB.plannedHours}
                        unit="h"
                        DeltaIndicator={DeltaIndicator}
                    />
                    <ComparisonCard 
                        label="Heures Réalisées"
                        valueA={weekA.achievedHours}
                        valueB={weekB.achievedHours}
                        unit="h"
                        DeltaIndicator={DeltaIndicator}
                    />
                    <ComparisonCard 
                        label="Rendement"
                        valueA={weekA.efficiency}
                        valueB={weekB.efficiency}
                        unit="%"
                        DeltaIndicator={DeltaIndicator}
                    />
                </div>
            )}
        </div>
    );
}

function ComparisonCard({ label, valueA, valueB, unit, DeltaIndicator }: {
    label: string;
    valueA: number;
    valueB: number;
    unit: string;
    DeltaIndicator: React.ComponentType<{ a: number; b: number; unit?: string }>;
}) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">{label}</div>
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">{valueA.toFixed(1)}{unit}</span>
                <span className="text-white font-bold">{valueB.toFixed(1)}{unit}</span>
            </div>
            <DeltaIndicator a={valueA} b={valueB} unit={unit} />
        </div>
    );
}
