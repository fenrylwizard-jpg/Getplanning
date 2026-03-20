/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as BarTooltip, LineChart, Line, BarChart, Bar, Sector } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

// Color helper for efficiency bars
function getEfficiencyColor(efficiency: number): string {
    if (efficiency >= 100) return '#10b981'; // emerald-500
    if (efficiency >= 90) return '#22c55e';  // green-500
    if (efficiency >= 70) return '#f59e0b';  // amber-500
    if (efficiency >= 50) return '#f97316';  // orange-500
    return '#ef4444';                        // red-500
}

export default function ProjectAnalyticsCharts({ tasks, weeklyPlans, dailyReports = [] }: { tasks: any[], weeklyPlans: any[], dailyReports?: any[] }) {
    const { t, tData } = useTranslation();
    const [weeksToShow, setWeeksToShow] = useState<number>(0);
    const [startIndex, setStartIndex] = useState<number>(0);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [chartMode, setChartMode] = useState<'percent' | 'hours'>('percent');

    // 1. Prepare Pie Chart Data (Hours per Category)
    const pieData = useMemo(() => {
        const catMap: Record<string, number> = {};
        let totalHours = 0;

        tasks.forEach(t => {
            const hrs = (t.quantity * t.minutesPerUnit) / 60;
            const cat = t.category || "Autre";
            catMap[cat] = (catMap[cat] || 0) + hrs;
            totalHours += hrs;
        });

        const threshold = totalHours * 0.02; // 2% 
        const finalData: { name: string, value: number }[] = [];
        let othersHours = 0;

        Object.entries(catMap).forEach(([name, value]) => {
            if (value > threshold) {
                finalData.push({ name: tData(name), value });
            } else {
                othersHours += value;
            }
        });

        if (othersHours > 0) {
            finalData.push({ name: t("others"), value: othersHours });
        }

        return finalData.sort((a, b) => b.value - a.value);
    }, [tasks, t, tData]);

    const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#84CC16', '#64748B'];
    const BORDER_COLORS = ['border-[#F59E0B]', 'border-[#10B981]', 'border-[#3B82F6]', 'border-[#6366F1]', 'border-[#8B5CF6]', 'border-[#EC4899]', 'border-[#F43F5E]', 'border-[#14B8A6]', 'border-[#84CC16]', 'border-[#64748B]'];
    const BG_COLORS = ['bg-[#F59E0B]', 'bg-[#10B981]', 'bg-[#3B82F6]', 'bg-[#6366F1]', 'bg-[#8B5CF6]', 'bg-[#EC4899]', 'bg-[#F43F5E]', 'bg-[#14B8A6]', 'bg-[#84CC16]', 'bg-[#64748B]'];

    const getCategoryIcon = (catName: string) => {
        const lower = catName.toLowerCase();
        if (lower.includes('câble') || lower.includes('chemin') || lower.includes('treillis')) return '/categories/cable.png';
        if (lower.includes('tableau') || lower.includes('coffret') || lower.includes('commut') || lower.includes('cc / cv')) return '/categories/panel.png';
        if (lower.includes('eclairage') || lower.includes('lumi') || lower.includes('luminaire')) return '/categories/light.png';
        if (lower.includes('equipement') || lower.includes('appareillage') || lower.includes('prise')) return '/categories/plug.png';
        if (lower.includes('astrid') || lower.includes('réseau') || lower.includes('donnée')) return '/categories/network.png';
        return '/categories/generic.png';
    };

    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 8}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 12}
                    outerRadius={outerRadius + 15}
                    fill={fill}
                    opacity={0.3}
                />
            </g>
        );
    };

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };
    
    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    // 2. Prepare Progression Chart Data (Weekly Planned vs Executed)
    const lineData = useMemo(() => {
        const sortedPlans = [...weeklyPlans].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.weekNumber - b.weekNumber;
        });

        return sortedPlans.map(plan => {
            let plannedHrs = 0;
            let executedHrs = 0;

            plan.tasks.forEach((pt: any) => {
                const minsPerUnit = pt.task?.minutesPerUnit || 0;
                plannedHrs += (pt.plannedQuantity * minsPerUnit) / 60;
                executedHrs += (pt.actualQuantity * minsPerUnit) / 60;
            });

            // Very simple week-to-month approximation mapping for visualization
            // Week 1 -> Jan, Week 5 -> Feb, Week 9 -> Mar...
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            let approxMonthIdx = Math.floor((plan.weekNumber - 1) / 4.33);
            if (approxMonthIdx > 11) approxMonthIdx = 11;
            const monthLabel = monthNames[approxMonthIdx];

            return {
                name: `S${plan.weekNumber} (${monthLabel})`,
                [t("planned")]: Number(plannedHrs.toFixed(1)),
                [t("executed")]: Number(executedHrs.toFixed(1)),
            };
        });
    }, [weeklyPlans, t]);

    const displayLineData = useMemo(() => {
        if (weeksToShow === 0) return lineData;
        const start = Math.max(0, startIndex);
        return lineData.slice(start, start + weeksToShow);
    }, [lineData, weeksToShow, startIndex]);

    const handleNext = () => {
        if (startIndex + weeksToShow < lineData.length) {
            setStartIndex(s => s + weeksToShow);
        }
    };
    
    const handlePrev = () => {
        if (startIndex - weeksToShow >= 0) {
            setStartIndex(s => s - weeksToShow);
        } else {
            setStartIndex(0);
        }
    };

    // 3. Prepare Heatmap Data (Efficiency per Category)
    const heatmapData = useMemo(() => {
        const catMap: Record<string, { planned: number, executed: number }> = {};
        
        weeklyPlans.forEach(plan => {
            plan.tasks.forEach((pt: any) => {
                const cat = pt.task?.category || "Autre";
                const minsPerUnit = pt.task?.minutesPerUnit || 0;
                
                if (!catMap[cat]) catMap[cat] = { planned: 0, executed: 0 };
                catMap[cat].planned += (pt.plannedQuantity * minsPerUnit) / 60;
                catMap[cat].executed += (pt.actualQuantity * minsPerUnit) / 60;
            });
        });

        return Object.entries(catMap)
            .map(([name, data]) => {
                const efficiency = data.planned > 0 ? (data.executed / data.planned) * 100 : 0;
                return {
                    name: tData(name),
                    efficiency: Number(efficiency.toFixed(1)),
                    planned: Number(data.planned.toFixed(1)),
                    executed: Number(data.executed.toFixed(1)),
                };
            })
            .filter(item => item.planned > 0 || item.executed > 0)
            .sort((a, b) => b.planned - a.planned);
    }, [weeklyPlans, tData]);

    // 4. Prepare Burn Down Chart Data
    const burnDownData = useMemo(() => {
        let totalHrs = 0;
        tasks.forEach(t => {
            totalHrs += (t.quantity * t.minutesPerUnit) / 60;
        });

        const sortedPlans = [...weeklyPlans].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.weekNumber - b.weekNumber;
        });

        const numWeeks = sortedPlans.length > 0 ? sortedPlans.length : 1;
        const idealDropPerWeek = totalHrs / numWeeks; 

        const data = [];
        data.push({
            name: "Début",
            "Idéal": Number(totalHrs.toFixed(1)),
            "Reste Réel": Number(totalHrs.toFixed(1)),
            "Reste Prévu": Number(totalHrs.toFixed(1))
        });

        let currentActual = totalHrs;
        let currentPlanned = totalHrs;

        sortedPlans.forEach((plan, i) => {
            let plannedHrs = 0;
            let executedHrs = 0;

            plan.tasks.forEach((pt: any) => {
                const minsPerUnit = pt.task?.minutesPerUnit || 0;
                plannedHrs += (pt.plannedQuantity * minsPerUnit) / 60;
                executedHrs += (pt.actualQuantity * minsPerUnit) / 60;
            });

            currentActual -= executedHrs;
            currentPlanned -= plannedHrs;
            
            if (currentActual < 0) currentActual = 0;
            if (currentPlanned < 0) currentPlanned = 0;

            const ideal = totalHrs - (idealDropPerWeek * (i + 1));

            data.push({
                name: `S${plan.weekNumber}`,
                "Idéal": Number(Math.max(0, ideal).toFixed(1)),
                "Reste Réel": Number(currentActual.toFixed(1)),
                "Reste Prévu": Number(currentPlanned.toFixed(1))
            });
        });

        return data;
    }, [tasks, weeklyPlans]);

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency < 70) return '#ef4444'; // Red
        if (efficiency < 90) return '#f59e0b'; // Amber
        return '#10b981'; // Green
    };

    return (
        <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="glass-card neon-card-blue flex flex-col h-[400px]">
                <h3 className="mb-4">{t("hour_distribution")}</h3>
                <div className="flex-1 flex overflow-hidden min-h-0 min-w-0 items-center">
                    <div className="w-1/2 relative h-full min-h-0 min-w-0 flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="99%" height="99%">
                                <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="50%"
                                    outerRadius="80%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    {...{ activeIndex, activeShape: renderActiveShape, onMouseEnter: onPieEnter, onMouseLeave: onPieLeave } as any}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                            opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.4}
                                            className="outline-none transition-opacity duration-200 ease-in-out"
                                        />
                                    ))}
                                </Pie>
                                <PieTooltip 
                                    formatter={(value: any, name: any) => [`${Number(value).toFixed(0)} ${t("hours")}`, name]} 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                        border: '1px solid var(--accent-primary)', 
                                        borderRadius: '8px', 
                                        color: '#fff', 
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                                    }} 
                                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                                    labelStyle={{ display: 'none' }} // Pie charts don't use label typically, hide to prevent black text
                                />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-secondary">{t("no_data")}</div>
                        )}
                    </div>
                    
                    <div className="w-1/2 h-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3 justify-center">
                        {pieData.map((entry, idx) => {
                            const percent = (pieData.reduce((acc, curr) => acc + curr.value, 0) > 0) ? ((entry.value / pieData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1) : 0;
                            const isActive = activeIndex === idx;
                            return (
                                <div 
                                    key={entry.name} 
                                    className={`flex items-center gap-3 p-2 rounded transition-all cursor-default border ${
                                        isActive 
                                            ? `bg-white/10 ${BORDER_COLORS[idx % COLORS.length]} scale-105 origin-left shadow-lg` 
                                            : `bg-white/5 border-white/5 opacity-${activeIndex === -1 ? '100' : '40'} hover:border-white/20`}
                                    `}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                >
                                    <div className={`rounded-md overflow-hidden flex-shrink-0 border flex items-center justify-center bg-black w-10 h-10 ${BORDER_COLORS[idx % COLORS.length]} ${isActive ? 'shadow-[0_0_10px_currentColor] shadow-' + COLORS[idx % COLORS.length].replace('#','') : ''}`}>
                                        <img src={getCategoryIcon(entry.name)} alt={entry.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`} title={entry.name}>{entry.name}</div>
                                        <div className="text-xs text-secondary flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${BG_COLORS[idx % COLORS.length]} ${isActive ? 'animate-pulse' : ''}`}></span>
                                            {percent}% ({Number(entry.value).toFixed(0)}h)
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


            <div className="glass-card neon-card-green h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3>{t("efficiency_progression")} <span className="text-xs text-gray-500 font-normal ml-2">(par jour)</span></h3>
                    
                    <div className="flex items-center gap-4">
                        {/* Toggle % / Hours */}
                        <div className="flex bg-[#0a1020]/80 rounded-md p-0.5 border border-white/10">
                            <button
                                className={`px-3 py-1 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${chartMode === 'percent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-white border border-transparent'}`}
                                onClick={() => setChartMode('percent')}
                            >%</button>
                            <button
                                className={`px-3 py-1 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${chartMode === 'hours' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white border border-transparent'}`}
                                onClick={() => setChartMode('hours')}
                            >Heures</button>
                        </div>

                        <select 
                            aria-label={t("select_weeks")}
                            className="bg-transparent text-secondary border border-gray-700 rounded p-1 text-sm outline-none"
                            value={weeksToShow}
                            onChange={(e) => {
                                setWeeksToShow(Number(e.target.value));
                                setStartIndex(0);
                            }}
                        >
                            <option value={0}>{t("all_weeks")}</option>
                            <option value={4}>{t("weeks_4")}</option>
                            <option value={8}>{t("weeks_8")}</option>
                            <option value={12}>{t("weeks_12")}</option>
                        </select>
                        
                        {weeksToShow > 0 && (
                            <div className="flex items-center gap-1">
                                <button title={t("prev")} className="btn btn-secondary p-1" onClick={handlePrev} disabled={startIndex === 0}><ChevronLeft size={16}/></button>
                                <span className="text-secondary text-sm mx-2">{t("display")}</span>
                                <button title={t("next")} className="btn btn-secondary p-1" onClick={handleNext} disabled={startIndex + weeksToShow >= lineData.length}><ChevronRight size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-1">
                    {dailyReports.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(() => {
                                const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                                return dailyReports.map((r: any) => {
                                    const d = new Date(r.date);
                                    const dayLabel = `${dayNames[d.getUTCDay()]} ${d.getUTCDate()}/${(d.getUTCMonth()+1).toString().padStart(2,'0')}`;
                                    const standardHours = (r.taskProgress || []).reduce((sum: number, p: any) => sum + (p.hours || 0), 0);
                                    const workers = r.workersCount || 1;
                                    const expected = workers * 8;
                                    const effPct = expected > 0 ? (standardHours / expected) * 100 : 0;
                                    return {
                                        name: dayLabel,
                                        value: chartMode === 'percent' ? Number(effPct.toFixed(1)) : Number(standardHours.toFixed(1)),
                                        workers,
                                        standardHours: Number(standardHours.toFixed(1)),
                                        effPct: Number(effPct.toFixed(1)),
                                    };
                                });
                            })()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 11}} />
                                <YAxis stroke="var(--text-secondary)" unit={chartMode === 'percent' ? '%' : 'H'} />
                                {chartMode === 'percent' && (
                                    <Line type="monotone" dataKey={() => 100} stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Objectif" />
                                )}
                                <BarTooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    formatter={(value: any, name: any) => {
                                        if (name === 'value') return [`${value}${chartMode === 'percent' ? '%' : 'H'}`, chartMode === 'percent' ? 'Efficience' : 'Heures Standard'];
                                        return [value, name || ""];
                                    }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {dailyReports.map((_: any, index: number) => {
                                        const r = dailyReports[index];
                                        const stdHrs = (r.taskProgress || []).reduce((sum: number, p: any) => sum + (p.hours || 0), 0);
                                        const exp = (r.workersCount || 1) * 8;
                                        const eff = exp > 0 ? (stdHrs / exp) * 100 : 0;
                                        return <Cell key={`cell-${index}`} fill={getEfficiencyColor(eff)} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={displayLineData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                                <YAxis stroke="var(--text-secondary)" />
                                <BarTooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-md)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line type="stepAfter" dataKey={t("planned")} stroke="var(--text-secondary)" strokeWidth={2} strokeDasharray="5 5" />
                                <Line type="monotone" dataKey={t("executed")} stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Heatmap Row */}
            <div className="col-span-2 glass-card neon-card-purple h-[400px] flex flex-col">
                <h3 className="mb-4">{t("efficiency_delta")}</h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmapData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                            <YAxis stroke="var(--text-secondary)" unit="%" />
                            <BarTooltip
                                contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-md)' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                formatter={(value: any, name: any) => {
                                    if (name === 'efficiency') return [`${value}%`, t("efficiency")];
                                    return [value, name || ""];
                                }}
                            />
                            <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                                {heatmapData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Burn Down Chart Row */}
            <div className="col-span-2 glass-card neon-card-orange h-[400px] flex flex-col">
                <h3 className="mb-4 flex items-center gap-2">Burn Down Chart <span className="text-xs text-gray-500 font-normal">(Heures restantes)</span></h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={burnDownData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                            <YAxis stroke="var(--text-secondary)" />
                            <BarTooltip
                                contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-md)' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Line type="monotone" dataKey="Idéal" stroke="#64748B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            <Line type="monotone" dataKey="Reste Prévu" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Reste Réel" stroke="#F59E0B" strokeWidth={3} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
