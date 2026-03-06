import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, AlertTriangle, PieChart as PieIcon, Activity, BarChart3 } from "lucide-react";
import { ProjectProgressChart, RCAPieChart, EVMBurndownChart } from "@/components/AnalyticsCharts";
import GlobalCategoryAnalytics from "@/components/GlobalCategoryAnalytics";
import { Task, WeeklyPlan, Project, WeeklyPlanTask } from "@prisma/client";
import T from "@/components/T";

export const dynamic = 'force-dynamic';

interface PMWeeklyPlanTask extends WeeklyPlanTask {
    task: Task;
}

interface PMWeeklyPlan extends WeeklyPlan {
    tasks: PMWeeklyPlanTask[];
    projectName?: string;
    missedTargetReason: string | null;
}

interface PMProject extends Project {
    tasks: Task[];
    weeklyPlans: PMWeeklyPlan[];
}

export default async function PMAnalytics() {
    const pmEmail = "pm@worksite.com";
    const userResult = await prisma.user.findUnique({
        where: { email: pmEmail },
        include: {
            projectsAsPM: {
                include: {
                    tasks: true,
                    weeklyPlans: {
                        include: {
                            tasks: {
                                include: {
                                    task: true
                                }
                            }
                        }
                    },
                },
            },
        },
    });

    if (!userResult) return <div className="p-8 text-center text-red-500 font-bold"><T k="user_not_found" /></div>;

    const projects = userResult.projectsAsPM as unknown as PMProject[];

    // Aggregate data for Progress Chart
    const progressData = projects.map((proj: PMProject) => {
        let totalLaborMinsTotal = 0;
        let totalLaborMinsAchieved = 0;

        proj.tasks.forEach((t: Task) => {
            totalLaborMinsTotal += (t.quantity * t.minutesPerUnit);
            totalLaborMinsAchieved += (t.completedQuantity * t.minutesPerUnit);
        });

        return {
            name: proj.name,
            totalHours: parseFloat((totalLaborMinsTotal / 60).toFixed(1)),
            achievedHours: parseFloat((totalLaborMinsAchieved / 60).toFixed(1)),
        };
    });

    // RCA Aggregation
    const rcaRawData: Record<string, number> = {};
    projects.forEach((proj: PMProject) => {
        proj.weeklyPlans.forEach((wp: PMWeeklyPlan) => {
            if (wp.missedTargetReason) {
                rcaRawData[wp.missedTargetReason] = (rcaRawData[wp.missedTargetReason] || 0) + 1;
            }
        });
    });

    const rcaLabels: Record<string, string> = {
        "MATERIAL_DELAY": "MATERIAL_DELAY",
        "WEATHER": "WEATHER",
        "EQUIPMENT_FAILURE": "EQUIPMENT_FAILURE",
        "LABOR_SHORTAGE": "LABOR_SHORTAGE",
        "PLANNING_ERROR": "PLANNING_ERROR",
        "OTHER": "OTHER"
    };

    const rcaData = Object.entries(rcaRawData).map(([key, value]) => ({
        name: rcaLabels[key] || key,
        value
    }));

    // EVM Aggregation
    const evmWeeklyData: Record<string, { weekLabel: string, year: number, weekNumber: number, pv: number, ev: number, ac: number }> = {};

    projects.forEach((proj: PMProject) => {
        proj.weeklyPlans.forEach((wp: PMWeeklyPlan) => {
            const weekKey = `${wp.year}-${wp.weekNumber.toString().padStart(2, '0')}`;
            if (!evmWeeklyData[weekKey]) {
                evmWeeklyData[weekKey] = { weekLabel: `S${wp.weekNumber} '${wp.year.toString().slice(-2)}`, year: wp.year, weekNumber: wp.weekNumber, pv: 0, ev: 0, ac: 0 };
            }
            
            evmWeeklyData[weekKey].ac += wp.targetHoursCapacity; // Actual Cost (hours burned)
            
            wp.tasks.forEach((wpt: PMWeeklyPlanTask) => {
                const minsPerUnit = wpt.task.minutesPerUnit;
                evmWeeklyData[weekKey].pv += (wpt.plannedQuantity * minsPerUnit) / 60; // Planned Value
                evmWeeklyData[weekKey].ev += (wpt.actualQuantity * minsPerUnit) / 60; // Earned Value
            });
        });
    });

    const sortedEvmWeeks = Object.values(evmWeeklyData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
    });

    // Cumulative sums
    const evmBurndownData = sortedEvmWeeks.reduce((acc, week) => {
        const last = acc[acc.length - 1] || { plannedRaw: 0, earnedRaw: 0, burnedRaw: 0 };
        const plannedRaw = last.plannedRaw + week.pv;
        const earnedRaw = last.earnedRaw + week.ev;
        const burnedRaw = last.burnedRaw + week.ac;
        
        acc.push({
            index: week.weekLabel,
            planned: parseFloat(plannedRaw.toFixed(1)),
            earned: parseFloat(earnedRaw.toFixed(1)),
            burned: parseFloat(burnedRaw.toFixed(1)),
            plannedRaw,
            earnedRaw,
            burnedRaw
        });
        return acc;
    }, [] as Array<{ index: string, planned: number, earned: number, burned: number, plannedRaw: number, earnedRaw: number, burnedRaw: number }>);

    const totalHoursAgg = progressData.reduce((acc: number, curr: { totalHours: number }) => acc + curr.totalHours, 0);
    const achievedHoursAgg = progressData.reduce((acc: number, curr: { achievedHours: number }) => acc + curr.achievedHours, 0);

    return (
        <div className="min-h-screen aurora-page bg-[#060b18] text-white p-4 sm:p-8 font-sans">

            <main className="max-w-7xl w-full px-6 sm:px-8 py-10 sm:py-16 relative z-10 flex flex-col items-center gap-12">
                <div className="w-full mb-10 text-center flex flex-col items-center">
                    <Link href="/pm/dashboard" className="self-start flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-bold text-base tracking-tight"><T k="back_to_project" /></span>
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                            <BarChart3 size={28} className="text-cyan-400" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white"><T k="portfolio_performance" /></h1>
                    </div>
                    <p className="text-gray-400 text-lg ml-1"><T k="portfolio_analysis_desc" /></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-emerald-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={64} className="text-emerald-500" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4"><T k="overall_efficiency" /></h4>
                        <div className="flex items-baseline gap-1">
                            <div className="text-4xl font-black text-emerald-400">
                                {totalHoursAgg > 0 ? ((achievedHoursAgg / totalHoursAgg) * 100).toFixed(1) : "0"}
                            </div>
                            <span className="text-xl font-bold text-emerald-600">%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest"><T k="ratio_actual_planned" /></p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-cyan-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={64} className="text-cyan-500" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4"><T k="achieved_labor_value" /></h4>
                        <div className="text-4xl font-black text-cyan-400 tracking-tight">
                            {achievedHoursAgg.toLocaleString()}
                            <span className="text-base font-bold text-cyan-700 ml-1"><T k="hours" /></span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest"><T k="cumulative_value" /></p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-orange-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle size={64} className="text-orange-500" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4"><T k="reported_rca" /></h4>
                        <div className="text-4xl font-black text-orange-400 tracking-tight">
                            {Object.values(rcaRawData).reduce((a, b) => a + b, 0)}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest"><T k="categorized_deviations" /></p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-purple-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 size={64} className="text-purple-500" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4"><T k="active_projects" /></h4>
                        <div className="text-4xl font-black text-purple-400 tracking-tight">
                            {projects.length}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest"><T k="under_your_supervision" /></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="glass-card p-8 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <TrendingUp size={20} className="text-cyan-400" /> 
                                    <T k="projects_progress_pm" />
                                </h3>
                                <p className="text-sm text-gray-500 mt-1"><T k="progress_comparison_desc" /></p>
                            </div>
                        </div>
                        <ProjectProgressChart data={progressData} />
                    </div>

                    <div className="glass-card p-8 overflow-hidden relative group border-t-4 border-t-purple-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Activity size={20} className="text-purple-400" /> 
                                    <T k="category_heatmap" />
                                </h3>
                                <p className="text-sm text-gray-500 mt-1"><T k="cross_project_analysis_desc" /></p>
                            </div>
                        </div>
                        <GlobalCategoryAnalytics projects={projects} />
                    </div>
                </div>

                {/* EVM Chart Section */}
                <div className="mb-8">
                    <div className="glass-card p-8 overflow-hidden relative group border-t-4 border-t-blue-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Activity size={20} className="text-blue-400" /> 
                                    <T k="evm_title" />
                                </h3>
                                <p className="text-sm text-gray-500 mt-1"><T k="evm_desc" /></p>
                            </div>
                        </div>
                        {evmBurndownData.length > 0 ? (
                            <EVMBurndownChart data={evmBurndownData} />
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                                <Activity size={48} className="mb-4 text-gray-600" />
                                <p className="text-gray-500 text-sm"><T k="no_evm_data_available" /></p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="glass-card p-8 lg:col-span-1 border-t-4 border-t-orange-500 relative">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-2 text-white">
                                <PieIcon size={20} className="text-orange-400" /> 
                                <T k="rca_title" />
                            </h4>
                        </div>
                        
                        {rcaData.length > 0 ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-full">
                                    <RCAPieChart data={rcaData} />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    {rcaData.sort((a,b) => b.value - a.value).slice(0, 5).map((item, idx) => (
                                        <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 transition-all text-xs font-medium">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className={`w-2 h-2 rounded-full ${['bg-[#0088FE]', 'bg-[#00C49F]', 'bg-[#FFBB28]', 'bg-[#FF8042]', 'bg-[#8884D8]'][idx % 5]}`}
                                                ></div>
                                                <span className="text-gray-200 font-bold"><T k={item.name} /></span>
                                            </div>
                                            <span className="text-white font-black text-sm">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center opacity-40">
                                <PieIcon size={48} className="mb-4 text-gray-600" />
                                <p className="text-gray-500 text-sm"><T k="no_data" /></p>
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-8 lg:col-span-2 border-t-4 border-t-white/10">
                        <h4 className="text-lg font-bold flex items-center gap-2 text-white mb-6">
                            <AlertTriangle size={20} className="text-white/50" /> 
                            <T k="recent_reports_title" />
                        </h4>
                        <div className="space-y-3">
                            {projects.flatMap((p) => p.weeklyPlans.map((wp) => ({ ...wp, projectName: p.name }))).filter((wp) => wp.issuesReported).sort((a, b) => b.weekNumber - a.weekNumber).slice(0, 5).map((wp, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-400 shrink-0">
                                        S{wp.weekNumber}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[10px] font-black uppercase text-cyan-400 tracking-wider"><T k="project_field" /> {wp.projectName}</div>
                                            {wp.missedTargetReason && (
                                                <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-400/10 px-2 py-0.5 rounded-md border border-orange-400/20">
                                                    <T k={wp.missedTargetReason} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-300 italic line-clamp-2">&quot;{wp.issuesReported}&quot;</div>
                                    </div>
                                </div>
                            ))}
                            {projects.flatMap((p) => p.weeklyPlans).filter((wp) => wp.issuesReported).length === 0 && (
                                <div className="text-center py-20 opacity-40">
                                    <p className="text-gray-500 text-sm italic tracking-wide"><T k="no_recent_issues" /></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
