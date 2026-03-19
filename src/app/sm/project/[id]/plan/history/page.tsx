import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, History, Calendar, Users, Clock } from "lucide-react";
import T from "@/components/T";

export default async function SMHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            weeklyPlans: {
                orderBy: [
                    { year: 'desc' },
                    { weekNumber: 'desc' }
                ],
                include: {
                    tasks: { include: { task: true } }
                }
            },
            dailyReports: {
                orderBy: { date: 'desc' },
                include: {
                    dailyTaskProgress: { include: { task: true } }
                }
            }
        }
    });

    if (!project) return <div className="p-8 text-center text-white"><T k="project_not_found" /></div>;

    const historyPlans = project.weeklyPlans.filter(p => p.isSubmitted);
    const activePlans = project.weeklyPlans.filter(p => !p.isSubmitted);
    const historyReports = project.dailyReports || [];

    return (
        <div className="aurora-page text-white font-sans">
            <nav className="navbar border-b border-white/5 bg-[#0a1020]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex items-center justify-between py-4">
                    <Link href="/sm/dashboard" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest"><T k="back_to_dashboard" /></span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400"><History size={18} /></div>
                        <h1 className="text-xl font-black tracking-tighter"><T k="project_history" /></h1>
                    </div>
                </div>
            </nav>

            <main className="container max-w-4xl py-12">
                <div className="mb-12">
                    <h2 className="text-3xl font-black mb-2">{project.name}</h2>
                    <p className="text-gray-500 text-sm"><T k="history_desc" /></p>
                </div>

                {/* Active/Planned Section */}
                {activePlans.length > 0 && (
                    <section className="mb-12">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                             <T k="active_planned" />
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {activePlans.map(plan => (
                                <PlanHistoryCard key={plan.id} plan={plan} projectId={id} />
                            ))}
                        </div>
                    </section>
                )}

                {/* History Section */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                         <T k="submitted_reports" />
                    </h3>
                    {historyPlans.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-gray-600 italic rounded-[40px]">
                            <T k="no_history_yet" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {historyPlans.map(plan => (
                                <PlanHistoryCard key={plan.id} plan={plan} projectId={id} />
                            ))}
                        </div>
                    )}
                </section>
                {/* Daily Reports History Section */}
                <section className="mt-12 pt-12 border-t border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2">
                         <Calendar size={14} />
                         <T k="submitted_daily_reports" />
                    </h3>
                    {historyReports.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-gray-600 italic rounded-[40px]">
                            <T k="no_daily_reports_yet" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {historyReports.map(report => {
                                const totalHours = report.dailyTaskProgress.reduce((acc, p) => acc + p.hours, 0);
                                return (
                                    <div key={report.id} className="glass-panel p-4 border border-white/5 hover:border-cyan-500/30 bg-[#0a1020]/60 backdrop-blur-xl transition-all rounded-md flex justify-between items-center group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                                                <span className="text-lg font-black text-white leading-none">
                                                    {new Date(report.date).getUTCDate().toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-[9px] font-bold text-cyan-400 uppercase">
                                                    {new Date(report.date).toLocaleString('default', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-1 capitalize">
                                                    {new Date(report.date).toLocaleDateString('default', { weekday: 'long' })}
                                                </div>
                                                <div className="flex gap-3 text-xs text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5"><Users size={12} className="text-gray-600" /> {report.workersCount || 0}</span>
                                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-600" /> {totalHours.toFixed(1)}H</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex flex-col items-end gap-2">
                                            <span className={`badge text-[9px] flex items-center gap-1 ${report.status === 'SUBMITTED' ? 'badge-success border-emerald-500/20' : 'badge-warning border-orange-500/20'}`}>
                                                {report.status === 'SUBMITTED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                {report.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

interface PlanWithTasks {
    id: string;
    weekNumber: number;
    year: number;
    numberOfWorkers: number;
    isSubmitted: boolean;
    targetReached: boolean | null;
    tasks: {
        plannedQuantity: number;
        actualQuantity: number;
        task: {
            minutesPerUnit: number;
        };
    }[];
}

function PlanHistoryCard({ plan, projectId }: { plan: PlanWithTasks, projectId: string }) {
    const totalHours = plan.tasks.reduce((acc, t) => acc + (t.plannedQuantity * t.task.minutesPerUnit) / 60, 0);
    const actualHours = plan.tasks.reduce((acc, t) => acc + (t.actualQuantity * t.task.minutesPerUnit) / 60, 0);
    const progress = totalHours > 0 ? (actualHours / totalHours) * 100 : 0;

    return (
        <Link href={`/sm/project/${projectId}/plan/${plan.id}`} className="block group">
            <div className="glass-panel p-6 border border-white/5 hover:border-cyan-500/30 bg-[#0a1020]/60 backdrop-blur-xl transition-all rounded-md flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-white/5 p-4 rounded-md flex flex-col items-center justify-center min-w-[70px] border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">WK</span>
                        <span className="text-2xl font-black text-white">{plan.weekNumber}</span>
                        <span className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase">{plan.year}</span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {plan.isSubmitted ? (
                                plan.targetReached ? 
                                    <span className="badge badge-success text-[10px] flex items-center gap-1 border-emerald-500/20"><CheckCircle2 size={10} /> <T k="target_hit" /></span> :
                                    <span className="badge badge-danger text-[10px] flex items-center gap-1 border-red-500/20"><ShieldAlert size={10} /> <T k="target_missed" /></span>
                            ) : (
                                <span className="badge badge-warning text-[10px] flex items-center gap-1 border-orange-500/20"><Calendar size={10} /> <T k="planned" /></span>
                            )}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1.5"><Users size={12} className="text-gray-600" /> {plan.numberOfWorkers} <T k="workers" /></span>
                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-600" /> {actualHours.toFixed(1)}H / {totalHours.toFixed(1)}H</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                        <T k="view_details" /> <ArrowLeft size={10} className="rotate-180" />
                    </div>
                    <div className="w-full md:w-40 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className={`h-full transition-all duration-1000 ${plan.isSubmitted && !plan.targetReached ? 'bg-red-500' : 'bg-cyan-500'} ${
                                progress >= 100 ? 'w-full' :
                                progress >= 90 ? 'w-[90%]' :
                                progress >= 80 ? 'w-[80%]' :
                                progress >= 70 ? 'w-[70%]' :
                                progress >= 60 ? 'w-[60%]' :
                                progress >= 50 ? 'w-[50%]' :
                                progress >= 40 ? 'w-[40%]' :
                                progress >= 30 ? 'w-[30%]' :
                                progress >= 20 ? 'w-[20%]' :
                                progress >= 10 ? 'w-[10%]' : 'w-0'
                            }`} 
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}
