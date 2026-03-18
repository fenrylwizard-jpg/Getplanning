/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Sector } from 'recharts';
import { Project, WeeklyPlan, Task, WeeklyPlanTask } from '@prisma/client';
import { useTranslation } from "@/lib/LanguageContext";
import { COLORS } from "./AnalyticsCharts";

interface ExtendedWeeklyPlanTask extends WeeklyPlanTask {
    task: Task;
}

interface ExtendedWeeklyPlan extends WeeklyPlan {
    tasks: ExtendedWeeklyPlanTask[];
}

interface ExtendedProject extends Project {
    weeklyPlans: ExtendedWeeklyPlan[];
}

interface CategoryData {
    name: string;
    efficiency: number;
    planned: number;
    executed: number;
}

export default function GlobalCategoryAnalytics({ projects }: { projects: ExtendedProject[] }) {
    const { t, tData } = useTranslation();
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const heatmapData = useMemo(() => {
        const catMap: Record<string, { planned: number, executed: number }> = {};
        
        projects.forEach(proj => {
            proj.weeklyPlans.forEach(plan => {
                plan.tasks.forEach(pt => {
                    const cat = pt.task?.category || "Autre";
                    const minsPerUnit = pt.task?.minutesPerUnit || 0;
                    
                    if (!catMap[cat]) catMap[cat] = { planned: 0, executed: 0 };
                    catMap[cat].planned += (pt.plannedQuantity * minsPerUnit) / 60;
                    catMap[cat].executed += (pt.actualQuantity * minsPerUnit) / 60;
                });
            });
        });

        return Object.entries(catMap)
            .map(([name, data]) => {
                const efficiency = data.planned > 0 ? (data.executed / data.planned) * 100 : 0;
                return {
                    name,
                    efficiency: Number(efficiency.toFixed(1)),
                    planned: Number(data.planned.toFixed(1)),
                    executed: Number(data.executed.toFixed(1)),
                } as CategoryData;
            })
            .filter(item => item.planned > 0 || item.executed > 0)
            .sort((a, b) => b.planned - a.planned);
    }, [projects]);

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
                    innerRadius={outerRadius + 15}
                    outerRadius={outerRadius + 20}
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

    return (
        <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={heatmapData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="executed"
                            stroke="none"
                            {...{ activeIndex, activeShape: renderActiveShape, onMouseEnter: onPieEnter, onMouseLeave: onPieLeave } as any}
                        >
                            {heatmapData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    style={{
                                        opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.4,
                                        outline: 'none',
                                        transition: 'opacity 0.2s ease-in-out'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                border: '1px solid var(--accent-primary)', 
                                borderRadius: '12px', 
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                                color: '#fff',
                                backdropFilter: 'blur(4px)'
                            }}
                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: any, name: string | undefined) => {
                                const translatedName = tData ? tData(name || '') : t(name || '');
                                return [`${parseFloat(value).toFixed(1)} h`, translatedName];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                {heatmapData.map((item, idx) => {
                    const isActive = activeIndex === idx;
                    const itemName = tData ? tData(item.name) : t(item.name);
                    return (
                        <div 
                            key={item.name} 
                            className={`flex items-center justify-between p-4 rounded-md border transition-all cursor-default ${
                                isActive 
                                    ? `bg-white/10 border-white/30 scale-[1.02] shadow-lg shadow-white/5` 
                                    : `bg-white/[0.03] border-white/5 hover:bg-white/[0.05] opacity-${activeIndex === -1 ? '100' : '50'}`
                            }`}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseLeave={() => setActiveIndex(-1)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500'][idx % 6]} ${isActive ? 'animate-pulse' : ''}`}></div>
                                <span className={`text-base font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-200'}`}>{itemName}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-lg font-black">{item.executed.toFixed(0)} <span className="text-xs font-normal opacity-40">h</span></div>
                                <div className={`text-xs font-bold ${item.efficiency >= 90 ? 'text-emerald-400' : item.efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {item.efficiency}% <span className="text-[10px] opacity-40 uppercase tracking-tighter">efficiency</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
