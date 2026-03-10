import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, FileText, Users, Clock, MapPin, ClipboardCheck, Info } from "lucide-react";
import T from "@/components/T";

export default async function PlanDetailsPage({ params }: { params: Promise<{ id: string, planId: string }> }) {
    const { id, planId } = await params;

    const plan = await prisma.weeklyPlan.findUnique({
        where: { id: planId },
        include: {
            project: {
                include: { siteManager: true }
            },
            tasks: {
                include: {
                    task: true
                }
            }
        }
    });

    if (!plan) return <div className="p-8 text-center"><T k="plan_not_found" /></div>;

    const totalPlannedHours = plan.tasks.reduce((sum, pt) => sum + (pt.plannedQuantity * (pt.task?.minutesPerUnit || 0)) / 60, 0);
    const totalActualHours = plan.tasks.reduce((sum, pt) => sum + (pt.actualQuantity * (pt.task?.minutesPerUnit || 0)) / 60, 0);
    const productivity = totalPlannedHours > 0 ? (totalActualHours / totalPlannedHours) * 100 : 0;

    const tryParseLocations = (loc: string | null) => {
        if (!loc) return null;
        try {
            const parsed = JSON.parse(loc);
            if (Array.isArray(parsed)) return parsed.join(' • ');
            return String(parsed);
        } catch {
            return loc;
        }
    };

    return (
        <div className="aurora-page text-white">
            <nav className="navbar border-b border-white/5 bg-[#0a1020]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex items-center justify-between py-4">
                    <Link href={`/pm/project/${id}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft size={24} /> <span className="text-sm font-black uppercase tracking-widest leading-none"><T k="back_to_project" /></span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">{plan.project.name}</span>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-base font-bold"><T k="week" /> {plan.weekNumber}, {plan.year}</span>
                    </div>
                </div>
            </nav>

            <main className="container max-w-5xl py-12">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass-panel p-6 border-l-4 border-l-cyan-500">
                        <div className="flex items-center gap-3 text-cyan-400 mb-4">
                            <Users size={18} />
                            <span className="text-xs font-black uppercase tracking-widest"><T k="workforce" /></span>
                        </div>
                        <div className="text-4xl font-black">{plan.numberOfWorkers} <span className="text-lg font-normal opacity-40"><T k="persons" /></span></div>
                        <div className="text-xs text-gray-400 mt-2 uppercase tracking-tight">{plan.targetHoursCapacity} <T k="total_hrs_avail" /></div>
                    </div>

                    <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-3 text-blue-400 mb-4">
                            <Clock size={18} />
                            <span className="text-xs font-black uppercase tracking-widest"><T k="productivity" /></span>
                        </div>
                        <div className="text-4xl font-black text-cyan-400">{productivity.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400 mt-2 uppercase tracking-tight">{totalActualHours.toFixed(1)}H / {totalPlannedHours.toFixed(1)}H PLANNED</div>
                    </div>

                    <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 text-emerald-400 mb-4">
                            <ClipboardCheck size={18} />
                            <span className="text-xs font-black uppercase tracking-widest"><T k="status" /></span>
                        </div>
                        <div className="flex items-center gap-2">
                            {plan.isSubmitted ? (
                                plan.targetReached ? 
                                    <span className="text-emerald-400 font-black flex items-center gap-2 text-xl"><CheckCircle2 size={24} /> <T k="target_hit" /></span> :
                                    <span className="text-red-400 font-black flex items-center gap-2 text-xl"><ShieldAlert size={24} /> <T k="target_missed" /></span>
                            ) : (
                                <span className="text-orange-400 font-black flex items-center gap-2 animate-pulse text-xl"><Clock size={24} /> <T k="in_progress" /></span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Checklist & Issues */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <div className="lg:col-span-4 glass-panel p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <T k="readiness_checklist" />
                        </h4>
                        <div className="flex flex-col gap-3">
                            {[
                                { k: 'hasDrawings', l: 'drawings_ready' },
                                { k: 'hasMaterials', l: 'materials_onsite' },
                                { k: 'hasTools', l: 'tools_ready' },
                                { k: 'hasSubcontractors', l: 'sub_ready' }
                            ].map(check => (
                                <div key={check.k} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-sm font-bold text-gray-200"><T k={check.l} /></span>
                                    {plan[check.k as keyof typeof plan] ? 
                                        <CheckCircle2 size={20} className="text-emerald-400" /> : 
                                        <div className="w-5 h-5 rounded-full border border-white/20" />
                                    }
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 glass-panel p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Info size={16} /> <T k="reported_issues" />
                        </h4>
                        {plan.issuesReported ? (
                            <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl text-orange-200/80 leading-relaxed italic text-base">
                                &quot;{plan.issuesReported}&quot;
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                <ClipboardCheck size={40} className="mb-2" />
                                <p className="text-base font-bold text-gray-500"><T k="no_issues_reported" /></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks List */}
                <div className="glass-panel overflow-hidden rounded-[40px]">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                            <FileText size={28} className="text-cyan-400" />
                            <T k="detailed_task_breakdown" />
                        </h3>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500">
                            {plan.tasks.length} <T k="tasks" />
                        </div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                        {plan.tasks.map(pt => (
                            <div key={pt.id} className="p-8 hover:bg-white/[0.02] transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-black text-gray-500 border border-white/10">{pt.task?.taskCode || 'N/A'}</span>
                                            <h5 className="font-bold text-xl">{pt.task?.description || 'Tâche inconnue'}</h5>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <MapPin size={16} className="text-cyan-500/60" />
                                                <span className="font-medium leading-relaxed">{tryParseLocations(pt.locations) || <T k="no_location" />}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Clock size={16} className="text-blue-500/60" />
                                                <span className="font-medium leading-relaxed">{pt.task?.minutesPerUnit || 0} MIN / {pt.task?.unit || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 bg-white/5 p-6 rounded-3xl border border-white/10 min-w-[320px]">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2"><T k="planned" /></span>
                                            <div className="text-2xl font-black">{pt.plannedQuantity} <span className="text-xs font-normal opacity-40">{pt.task?.unit || '-'}</span></div>
                                            <div className="text-xs text-cyan-400 font-bold tracking-tight mt-1">{((pt.plannedQuantity * (pt.task?.minutesPerUnit || 0)) / 60).toFixed(1)}H</div>
                                        </div>
                                        
                                        <div className="w-px h-12 bg-white/10" />

                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-emerald-500/60 uppercase tracking-widest mb-2"><T k="completed" /></span>
                                            <div className="text-2xl font-black text-emerald-400">{pt.actualQuantity || 0} <span className="text-xs font-normal opacity-40">{pt.task?.unit || '-'}</span></div>
                                            <div className="text-xs text-emerald-400 font-bold tracking-tight mt-1">{(((pt.actualQuantity || 0) * (pt.task?.minutesPerUnit || 0)) / 60).toFixed(1)}H</div>
                                        </div>

                                        <div className="flex-1 flex justify-end">
                                            <div className={`w-14 h-14 rounded-full border-[6px] flex items-center justify-center text-xs font-black transition-all ${pt.plannedQuantity > 0 && pt.actualQuantity >= pt.plannedQuantity ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-gray-500 bg-white/5'}`}>
                                                {pt.plannedQuantity > 0 ? Math.round((pt.actualQuantity / pt.plannedQuantity) * 100) : 0}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Photos */}
                                {/* Photos rendering removed as it is not part of WeeklyPlanTask schema yet */}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
