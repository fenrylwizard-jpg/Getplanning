
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, FolderKey } from "lucide-react";
import ProjectAnalyticsCharts from "@/components/ProjectAnalyticsCharts";
import T from "@/components/T";

export default async function PMProjectDetails({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            siteManager: true,
            tasks: true,
            weeklyPlans: {
                orderBy: { createdAt: 'desc' },
                include: {
                    tasks: { include: { task: true } }
                }
            }
        }
    });

    if (!project) return <div><T k="project_not_found" /></div>;

    // Global Progress metrics
    const totalTasksLoaded = project.tasks.length;
    let totalLaborMinsTotal = 0;
    let totalLaborMinsAchieved = 0;

    project.tasks.forEach((t) => {
        totalLaborMinsTotal += (t.quantity * t.minutesPerUnit);
        totalLaborMinsAchieved += (t.completedQuantity * t.minutesPerUnit);
    });

    const completionPercentage = totalLaborMinsTotal ? (totalLaborMinsAchieved / totalLaborMinsTotal) * 100 : 0;

    return (
        <>
            <nav className="navbar">
                <div className="container nav-content">
                    <Link href="/pm/dashboard" className="nav-brand"><ArrowLeft size={20} /> <T k="back" /></Link>
                    <div className="nav-links">
                        <span className="badge badge-success"><T k="pm_analytics" /></span>
                    </div>
                </div>
            </nav>

            <main className="main-content container mt-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3"><FolderKey size={28} className="text-secondary" /> {project.name}</h1>
                            <p className="mt-2 text-secondary">
                                <T k="site_manager" /> : <strong>{project.siteManager?.name || <T k="unassigned" />}</strong> • <T k="location" /> : {project.location || <T k="not_applicable" />}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Global Progress */}
                <div className="glass-panel mb-8">
                    <h3 className="mb-4"><T k="global_budget_progress" /></h3>
                    <div className="grid grid-cols-3 gap-8 text-center mb-6">
                        <div>
                            <div className="text-secondary text-sm"><T k="total_scheduled_labor" /></div>
                            <div className="text-[1.5rem] font-semibold">{(totalLaborMinsTotal / 60).toFixed(0)} <T k="hours" /></div>
                        </div>
                        <div>
                            <div className="text-secondary text-sm"><T k="achieved_labor_value" /></div>
                            <div className="text-[1.5rem] font-semibold text-accent-primary">{(totalLaborMinsAchieved / 60).toFixed(0)} <T k="hours" /></div>
                        </div>
                        <div>
                            <div className="text-secondary text-sm"><T k="tasks_tracked" /></div>
                            <div className="text-[1.5rem] font-semibold">{totalTasksLoaded}</div>
                        </div>
                    </div>

                    <style>{`
                        .progress-bar-pm { width: ${completionPercentage}%; }
                    `}</style>
                    <div className="w-full h-6 bg-[var(--bg-primary)] rounded-xl overflow-hidden relative">
                        <div className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-[var(--accent-hover)] to-[var(--accent-primary)] progress-bar-pm"></div>
                        <div className="absolute w-full h-full flex items-center justify-center text-[0.8rem] font-bold text-white drop-shadow-md">
                            {completionPercentage.toFixed(1)}% <T k="completed" />
                        </div>
                    </div>

                    {/* Profitability summary card */}
                    {totalLaborMinsTotal > 0 && (() => {
                        const RATE = 43.35;
                        const budgetEur = Math.round((totalLaborMinsTotal / 60) * RATE);
                        const spentEur = Math.round((totalLaborMinsAchieved / 60) * RATE);
                        const remaining = budgetEur - spentEur;
                        return (
                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                                    <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">Budget MO</div>
                                    <div className="text-xl font-black text-white">{budgetEur.toLocaleString()} €</div>
                                    <div className="text-xs text-gray-500">{(totalLaborMinsTotal/60).toFixed(0)}h × 43.35€</div>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black mb-1">Valorisé</div>
                                    <div className="text-xl font-black text-emerald-400">{spentEur.toLocaleString()} €</div>
                                    <div className="text-xs text-gray-500">{(totalLaborMinsAchieved/60).toFixed(0)}h réalisées</div>
                                </div>
                                <div className={`${remaining >= 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4 text-center`}>
                                    <div className={`text-[10px] uppercase tracking-widest font-black mb-1 ${remaining >= 0 ? 'text-amber-400' : 'text-red-400'}`}>Restant</div>
                                    <div className={`text-xl font-black ${remaining >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{remaining.toLocaleString()} €</div>
                                    <div className="text-xs text-gray-500">Taux: 43.35 €/h</div>
                                </div>
                            </div>
                        );
                    })()}

                </div>

                <ProjectAnalyticsCharts tasks={project.tasks} weeklyPlans={project.weeklyPlans} />

                <div className="flex items-center justify-between mb-6">
                    <h3><T k="weekly_reports" /> ({project.weeklyPlans.length})</h3>
                    <div className="flex gap-2">
                        {/* Tab-like buttons could go here if needed */}
                    </div>
                </div>

                {project.weeklyPlans.length === 0 ? (
                    <div className="glass-card text-center py-8 text-secondary">
                        <T k="no_weekly_reports" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {/* Active & Planned Section */}
                        <section>
                            <h4 className="mb-4 text-accent-primary uppercase tracking-widest text-xs font-black flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <T k="active_planned" />
                            </h4>
                            <div className="flex flex-col gap-6">
                                {project.weeklyPlans.filter(p => !p.isSubmitted).map((plan) => (
                                    <WeeklyPlanCard key={plan.id} plan={plan} projectId={id} />
                                ))}
                                {project.weeklyPlans.filter(p => !p.isSubmitted).length === 0 && (
                                    <div className="text-sm text-secondary italic opacity-60 ml-4"><T k="no_active_plans" /></div>
                                )}
                            </div>
                        </section>

                        {/* History Section */}
                        <section>
                            <h4 className="mb-4 text-gray-500 uppercase tracking-widest text-xs font-black flex items-center gap-2">
                                <T k="history" />
                            </h4>
                            <div className="flex flex-col gap-6">
                                {project.weeklyPlans.filter(p => p.isSubmitted).map((plan) => (
                                    <WeeklyPlanCard key={plan.id} plan={plan} projectId={id} />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </>
    );
}

interface WeeklyPlanCardProps {
    plan: {
        id: string;
        weekNumber: number;
        year: number;
        isSubmitted: boolean;
        numberOfWorkers: number;
        targetHoursCapacity: number;
        targetReached: boolean | null;
        issuesReported: string | null;
    };
    projectId: string;
}

function WeeklyPlanCard({ plan, projectId }: WeeklyPlanCardProps) {
    return (
        <div className="glass-card flex flex-col gap-4 group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="flex items-center gap-2">
                        <T k="week" /> {plan.weekNumber}, {plan.year} 
                        <span className="text-gray-600 text-xs font-normal"> • </span>
                        <span className="text-sm opacity-80">{plan.isSubmitted ? <T k="completed" /> : <T k="planned" />}</span>
                    </h4>
                    <div className="text-secondary text-sm mt-1"><T k="workers_setup" />: {plan.numberOfWorkers} ({plan.targetHoursCapacity} <T k="total_hrs" />)</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div>
                        {!plan.isSubmitted && <span className="badge badge-warning"><T k="in_progress" /></span>}
                        {plan.isSubmitted && plan.targetReached && <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={12} /> <T k="target_hit" /></span>}
                        {plan.isSubmitted && !plan.targetReached && <span className="badge badge-danger flex items-center gap-1 bg-[var(--danger-glow)] text-[var(--danger)]"><ShieldAlert size={12} /> <T k="target_missed" /></span>}
                    </div>
                    <Link href={`/pm/project/${projectId}/plan/${plan.id}`} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                        <T k="plan_details" /> <ArrowLeft size={10} className="rotate-180" />
                    </Link>
                </div>
            </div>

            {/* Analytics details (Condensed in list view) */}
            {plan.isSubmitted && plan.issuesReported && (
                <div className="bg-orange-500/5 p-3 rounded-xl border border-orange-500/10 text-xs italic text-orange-200/70">
                    &quot;{plan.issuesReported.substring(0, 100)}{plan.issuesReported.length > 100 ? '...' : ''}&quot;
                </div>
            )}
        </div>
    );
}
