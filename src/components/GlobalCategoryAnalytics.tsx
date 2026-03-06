"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
    const { t } = useTranslation();
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
                        >
                            {heatmapData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`${parseFloat(value).toFixed(1)} h`, t("executed")]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                {heatmapData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] color-indicator-${idx % 6}`}></div>
                            <span className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">{t(item.name)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-lg font-black">{item.executed.toFixed(0)} <span className="text-xs font-normal opacity-40">h</span></div>
                            <div className={`text-xs font-bold ${item.efficiency >= 90 ? 'text-emerald-400' : item.efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                {item.efficiency}% <span className="text-[10px] opacity-40 uppercase tracking-tighter">efficiency</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
