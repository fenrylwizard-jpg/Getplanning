import React from 'react';
import T from "@/components/T";
import ProjectAnalyticsCharts from "@/components/ProjectAnalyticsCharts";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, Clock, History, TrendingUp } from "lucide-react";
import { HOURLY_RATE_EUR } from "@/lib/xp-engine";
import WeeklyReportGenerator from "./WeeklyReportGenerator";
import { getISOWeek, getISOWeekYear } from "date-fns";

interface ProductionTabProps {
    project: {
        id: string;
        name: string;
        location: string | null;
        siteManager: { name: string } | null;
        tasks: {
            id: string;
            taskCode: string;
            description: string;
            unit: string;
            category: string;
            quantity: number;
            completedQuantity: number;
            minutesPerUnit: number;
        }[];
        weeklyPlans: {
            id: string;
            weekNumber: number;
            year: number;
            isSubmitted: boolean;
            isClosed: boolean;
            numberOfWorkers: number;
            targetHoursCapacity: number;
            targetReached: boolean | null;
            issuesReported: string | null;
            tasks: {
                id: string;
                plannedQuantity: number;
                actualQuantity: number;
                task: {
                    id: string;
                    taskCode: string;
                    description: string;
                    unit: string;
                    minutesPerUnit: number;
                };
            }[];
        }[];
        dailyReports?: {
            id: string;
            date: string | Date;
            status: string;
            workersCount: number | null;
            taskProgress: {
                id: string;
                hours: number;
                quantity: number;
                task: { minutesPerUnit: number };
            }[];
        }[];
    };
}

export default function ProductionTab({ project }: ProductionTabProps) {
    const totalTasksLoaded = project.tasks.length;
    let totalLaborMinsTotal = 0;
    let totalLaborMinsAchieved = 0;

    project.tasks.forEach((t) => {
        totalLaborMinsTotal += (t.quantity * t.minutesPerUnit);
        totalLaborMinsAchieved += (t.completedQuantity * t.minutesPerUnit);
    });

    let totalSpentHours = 0;
    
    // Group daily reports by ISO week for weekly efficiency
    const reportsByWeek = new Map<string, typeof project.dailyReports>();
    
    if (project.dailyReports) {
        for (const report of project.dailyReports) {
            // Count hours if it's submitted or approved (not draft)
            if (report.status !== 'DRAFT') {
                report.taskProgress.forEach(tp => {
                    totalSpentHours += tp.hours || 0;
                });
            }
            
            // Group by week
            const d = new Date(report.date);
            const wk = getISOWeek(d);
            const yr = getISOWeekYear(d);
            const key = `${yr}-${wk}`;
            if (!reportsByWeek.has(key)) reportsByWeek.set(key, []);
            reportsByWeek.get(key)!.push(report);
        }
    }

    const earnedHours = totalLaborMinsAchieved / 60;
    const globalEfficiencyPct = totalSpentHours > 0 ? (earnedHours / totalSpentHours) * 100 : 0;
    const globalEfficiencyHours = earnedHours - totalSpentHours;
    
    const completionPercentage = totalLaborMinsTotal ? (earnedHours / (totalLaborMinsTotal / 60)) * 100 : 0;
    const budgetEur = Math.round((totalLaborMinsTotal / 60) * HOURLY_RATE_EUR);
    const spentEur = Math.round(earnedHours * HOURLY_RATE_EUR);
    const remaining = budgetEur - spentEur;

    return (
        <div className="flex flex-col gap-8">
            {/* History Link */}
            <div className="flex justify-end">
                <Link
                    href={`/sm/project/${project.id}/plan/history`}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/30 transition-all text-sm font-bold"
                >
                    <History size={16} /> Historique du Projet
                </Link>
            </div>

            {/* Global Progress */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                    <T k="global_budget_progress" />
                </h3>
                <div className="grid grid-cols-3 gap-8 text-center mb-6">
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold"><T k="total_scheduled_labor" /></div>
                        <div className="text-2xl font-black text-white">{(totalLaborMinsTotal / 60).toFixed(0)} <T k="hours" /></div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold"><T k="achieved_labor_value" /></div>
                        <div className="text-2xl font-black text-cyan-400">{(totalLaborMinsAchieved / 60).toFixed(0)} <T k="hours" /></div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold"><T k="tasks_tracked" /></div>
                        <div className="text-2xl font-black text-white">{totalTasksLoaded}</div>
                    </div>
                </div>

                <style>{`.production-progress-bar{width:${completionPercentage}%}`}</style>
                <div className="w-full h-6 bg-white/5 rounded-md overflow-hidden relative mb-6">
                    <div className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-purple-500 production-progress-bar" />
                    <div className="absolute w-full h-full flex items-center justify-center text-[0.8rem] font-bold text-white drop-shadow-md">
                        {completionPercentage.toFixed(1)}% <T k="completed" />
                    </div>
                </div>

                {/* Global Efficiency */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0a1020]/80 border border-white/5 rounded-md p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${globalEfficiencyPct >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest"><T k="global_efficiency" /></div>
                            <div className={`text-2xl font-black ${globalEfficiencyPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {globalEfficiencyPct > 0 ? `${globalEfficiencyPct.toFixed(1)} %` : 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className={`border rounded-md p-4 flex items-center gap-4 ${globalEfficiencyHours >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${globalEfficiencyHours >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Bilan Heures (Gagnées - Dépensées)</div>
                            <div className={`text-2xl font-black ${globalEfficiencyHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {globalEfficiencyHours > 0 ? '+' : ''}{globalEfficiencyHours.toFixed(1)} h
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget Cards */}
                {totalLaborMinsTotal > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-center">
                            <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">Budget MO</div>
                            <div className="text-xl font-black text-white">{budgetEur.toLocaleString()} €</div>
                            <div className="text-xs text-gray-500">{(totalLaborMinsTotal/60).toFixed(0)}h × {HOURLY_RATE_EUR}€</div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4 text-center">
                            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black mb-1"><T k="achieved_value" /></div>
                            <div className="text-xl font-black text-emerald-400">{spentEur.toLocaleString()} €</div>
                            <div className="text-xs text-gray-500">{(totalLaborMinsAchieved/60).toFixed(0)}h réalisées</div>
                        </div>
                        <div className={`${remaining >= 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-md p-4 text-center`}>
                            <div className={`text-[10px] uppercase tracking-widest font-black mb-1 ${remaining >= 0 ? 'text-amber-400' : 'text-red-400'}`}><T k="remaining" /></div>
                            <div className={`text-xl font-black ${remaining >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{remaining.toLocaleString()} €</div>
                            <div className="text-xs text-gray-500">Taux: {HOURLY_RATE_EUR} €/h</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Project Analytics Charts */}
            <ProjectAnalyticsCharts tasks={project.tasks} weeklyPlans={project.weeklyPlans} dailyReports={project.dailyReports || []} />

            {/* Weekly Plans */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 m-0">
                        <T k="weekly_reports" /> ({project.weeklyPlans.length})
                    </h3>
                    {project.weeklyPlans.length > 0 && <WeeklyReportGenerator project={project} />}
                </div>

                {project.weeklyPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500"><T k="no_weekly_reports" /></div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Active & Planned */}
                        {project.weeklyPlans.filter(p => !p.isSubmitted).length > 0 && (
                            <div>
                                <h4 className="mb-3 text-cyan-400 uppercase tracking-widest text-xs font-black flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                    <T k="active_planned" />
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {project.weeklyPlans.filter(p => !p.isSubmitted).map((plan) => {
                                        const weekKey = `${plan.year}-${plan.weekNumber}`;
                                        const reports = reportsByWeek.get(weekKey) || [];
                                        return <PlanCard key={plan.id} plan={plan} projectId={project.id} weekReports={reports} />
                                    })}
                                </div>
                            </div>
                        )}

                        {/* History */}
                        {project.weeklyPlans.filter(p => p.isSubmitted).length > 0 && (
                            <div>
                                <h4 className="mb-3 mt-4 text-gray-500 uppercase tracking-widest text-xs font-black flex items-center gap-2">
                                    <T k="history" />
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {project.weeklyPlans.filter(p => p.isSubmitted).map((plan) => {
                                        const weekKey = `${plan.year}-${plan.weekNumber}`;
                                        const reports = reportsByWeek.get(weekKey) || [];
                                        return <PlanCard key={plan.id} plan={plan} projectId={project.id} weekReports={reports} />
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PlanCardProps {
    plan: any;
    projectId: string;
    weekReports: any[];
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, projectId, weekReports }) => {
    let weeklyEarnedMins = 0;
    plan.tasks?.forEach((pt: any) => {
        weeklyEarnedMins += pt.actualQuantity * pt.task.minutesPerUnit;
    });
    const weeklyEarnedHours = weeklyEarnedMins / 60;
    
    let weeklySpentHours = 0;
    weekReports?.forEach(r => {
        if (r.status !== 'DRAFT') {
            r.taskProgress?.forEach((tp: any) => {
                weeklySpentHours += tp.hours || 0;
            });
        }
    });

    const weeklyEfficiencyPct = weeklySpentHours > 0 ? (weeklyEarnedHours / weeklySpentHours) * 100 : 0;
    const weeklyEfficiencyHours = weeklyEarnedHours - weeklySpentHours;

    return (
        <div className="flex items-center justify-between p-4 rounded-md bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-white"><T k="week" /> {plan.weekNumber}, {plan.year}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-sm opacity-80 text-gray-400">{plan.isSubmitted ? <T k="completed" /> : <T k="planned" />}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1"><T k="workers_setup" />: {plan.numberOfWorkers} ({plan.targetHoursCapacity} <T k="total_hrs" />)</div>
            </div>
            
            {plan.isSubmitted && weeklySpentHours > 0 && (
                <div className="flex gap-4 px-4 border-l border-white/10">
                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Efficience</div>
                        <div className={`text-sm font-black ${weeklyEfficiencyPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {weeklyEfficiencyPct.toFixed(1)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Bilan</div>
                        <div className={`text-sm font-black ${weeklyEfficiencyHours >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {weeklyEfficiencyHours > 0 ? '+' : ''}{weeklyEfficiencyHours.toFixed(1)}h
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    {!plan.isSubmitted && <span className="text-xs px-2 py-1 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold"><T k="in_progress" /></span>}
                    {plan.isSubmitted && plan.targetReached && <span className="text-xs px-2 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> <T k="target_hit" /></span>}
                    {plan.isSubmitted && !plan.targetReached && <span className="text-xs px-2 py-1 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 font-bold flex items-center gap-1"><ShieldAlert size={12} /> <T k="target_missed" /></span>}
                </div>
                <Link href={`/pm/project/${projectId}/plan/${plan.id}`} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                    <T k="plan_details" /> <ArrowLeft size={10} className="rotate-180" />
                </Link>
            </div>
        </div>
    );
}
