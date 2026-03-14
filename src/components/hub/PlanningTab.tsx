import T from "@/components/T";
import Link from "next/link";
import { CalendarRange, CalendarDays, Clock, CheckCircle2, ShieldAlert, ArrowRight, ListOrdered } from "lucide-react";

interface PlanningTabProps {
    project: {
        id: string;
        startDate: Date | null;
        endDate: Date | null;
        weeklyPlans: {
            id: string;
            weekNumber: number;
            year: number;
            isSubmitted: boolean;
            isClosed: boolean;
            numberOfWorkers: number;
            targetHoursCapacity: number;
            targetReached: boolean | null;
        }[];
    };
}

export default function PlanningTab({ project }: PlanningTabProps) {
    const activePlans = project.weeklyPlans.filter(p => !p.isClosed);
    const closedPlans = project.weeklyPlans.filter(p => p.isClosed);
    const hitPlans = closedPlans.filter(p => p.targetReached === true);
    const hitRate = closedPlans.length > 0 ? Math.round((hitPlans.length / closedPlans.length) * 100) : 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Planning Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <CalendarDays size={24} className="text-cyan-400" />
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"><T k="hub_total_weeks" /></div>
                        <div className="text-lg font-black text-cyan-400">{project.weeklyPlans.length}</div>
                    </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <Clock size={24} className="text-blue-400" />
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"><T k="hub_active_plans" /></div>
                        <div className="text-lg font-black text-blue-400">{activePlans.length}</div>
                    </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"><T k="hub_closed_weeks" /></div>
                        <div className="text-lg font-black text-emerald-400">{closedPlans.length}</div>
                    </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <ShieldAlert size={24} className="text-purple-400" />
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"><T k="target_rate" /></div>
                        <div className="text-lg font-black text-purple-400">{hitRate}%</div>
                    </div>
                </div>
            </div>

            {/* Project Timeline */}
            {(project.startDate || project.endDate) && (
                <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <CalendarRange size={16} className="text-cyan-400" /> <T k="hub_project_timeline" />
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1"><T k="start_date_label" /></div>
                            <div className="text-lg font-bold text-white">
                                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1"><T k="end_date_label" /></div>
                            <div className="text-lg font-bold text-white">
                                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Plans Timeline */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <ListOrdered size={16} className="text-purple-400" /> <T k="hub_planning_timeline" />
                </h3>

                {project.weeklyPlans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-40">
                        <CalendarRange size={48} className="mb-3 text-gray-600" />
                        <p className="text-gray-500 text-sm font-bold"><T k="no_weekly_reports" /></p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {project.weeklyPlans.map((plan) => (
                            <Link
                                key={plan.id}
                                href={`/pm/project/${project.id}/plan/${plan.id}`}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                                        !plan.isClosed
                                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                            : plan.targetReached
                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                    }`}>
                                        S{plan.weekNumber}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm"><T k="week" /> {plan.weekNumber}, {plan.year}</div>
                                        <div className="text-xs text-gray-500">
                                            {plan.numberOfWorkers} <T k="persons" /> • {plan.targetHoursCapacity} <T k="total_hrs" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!plan.isClosed && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold animate-pulse">
                                            <T k="in_progress" />
                                        </span>
                                    )}
                                    {plan.isClosed && plan.targetReached && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                                            <CheckCircle2 size={12} /> <T k="target_hit" />
                                        </span>
                                    )}
                                    {plan.isClosed && !plan.targetReached && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold flex items-center gap-1">
                                            <ShieldAlert size={12} /> <T k="target_missed" />
                                        </span>
                                    )}
                                    <ArrowRight size={16} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
