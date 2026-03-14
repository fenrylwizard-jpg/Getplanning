import T from "@/components/T";
import { HeartPulse, Calendar, FileText, TrendingUp, Users, CheckCircle2, Activity, ClipboardList } from "lucide-react";
import { HOURLY_RATE_EUR } from "@/lib/xp-engine";

interface OverviewTabProps {
    project: {
        name: string;
        location: string | null;
        siteManager: { name: string } | null;
        tasks: { id: string; quantity: number; completedQuantity: number; minutesPerUnit: number }[];
        weeklyPlans: {
            id: string;
            weekNumber: number;
            year: number;
            isClosed: boolean;
            isSubmitted: boolean;
            targetReached: boolean | null;
        }[];
        revisions: { id: string; fileName: string; uploadedAt: Date; changesMade: string | null }[];
    };
}

function HealthBadge({ status, type }: { status: 'good' | 'average' | 'poor', type: 'planning' | 'feedback' | 'efficiency' }) {
    const configs = {
        planning: { icon: Calendar, label: 'health_planning' },
        feedback: { icon: FileText, label: 'health_feedback' },
        efficiency: { icon: HeartPulse, label: 'health_efficiency' },
    };
    const { icon: Icon, label } = configs[type];

    const colors = {
        good: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
        average: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
        poor: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
    };
    const c = colors[status];
    return (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${c.bg} border ${c.border}`}>
            <Icon size={20} className={c.icon} />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold"><T k={label} /></span>
                <span className={`text-sm font-bold ${c.text}`}><T k={`health_${status}`} /></span>
            </div>
        </div>
    );
}

export default function OverviewTab({ project }: OverviewTabProps) {
    const totalTasks = project.tasks.length;
    const budgetHours = project.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
    const earnedHours = project.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
    const progressPct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
    const budgetEur = Math.round(budgetHours * HOURLY_RATE_EUR);
    const valoriseEur = Math.round(earnedHours * HOURLY_RATE_EUR);
    const restantEur = budgetEur - valoriseEur;

    const planCount = project.weeklyPlans.length;
    const closedPlans = project.weeklyPlans.filter(p => p.isClosed).length;
    const hitPlans = project.weeklyPlans.filter(p => p.targetReached === true).length;
    const hasFeedback = planCount > 0;

    const planningStatus: 'good' | 'average' | 'poor' = planCount >= 3 ? 'good' : planCount >= 1 ? 'average' : 'poor';
    const feedbackStatus: 'good' | 'average' | 'poor' = hasFeedback ? 'good' : 'poor';
    const efficiencyStatus: 'good' | 'average' | 'poor' = progressPct >= 40 ? 'good' : progressPct >= 15 ? 'average' : 'poor';

    return (
        <div className="flex flex-col gap-8">
            {/* Health Indicators */}
            <div className="flex flex-wrap gap-4">
                <HealthBadge status={planningStatus} type="planning" />
                <HealthBadge status={feedbackStatus} type="feedback" />
                <HealthBadge status={efficiencyStatus} type="efficiency" />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: ClipboardList, label: "tasks_tracked", value: totalTasks.toString(), color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                    { icon: Activity, label: "submitted_plans", value: planCount.toString(), color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                    { icon: CheckCircle2, label: "hub_objectives_hit", value: `${hitPlans}/${closedPlans}`, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { icon: Users, label: "site_manager", value: project.siteManager?.name || "N/A", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                ].map(({ icon: Icon, label, value, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-5 flex items-center gap-4`}>
                        <Icon size={24} className={color} />
                        <div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"><T k={label} /></div>
                            <div className={`text-lg font-black ${color}`}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget Progress */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-400" /> <T k="global_budget_progress" />
                </h3>

                <div className="grid grid-cols-3 gap-6 text-center mb-6">
                    <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider font-bold"><T k="total_scheduled_labor" /></div>
                        <div className="text-2xl font-black text-white">{Math.round(budgetHours)} <span className="text-sm text-gray-500">h</span></div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider font-bold"><T k="achieved_labor_value" /></div>
                        <div className="text-2xl font-black text-cyan-400">{Math.round(earnedHours)} <span className="text-sm text-gray-500">h</span></div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider font-bold"><T k="progress" /></div>
                        <div className="text-2xl font-black text-white">{progressPct}%</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-6">
                    <style>{`.overview-progress-bar{width:${progressPct}%}`}</style>
                    <div className={`overview-progress-bar h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                        progressPct >= 80 ? 'from-emerald-500 to-green-400' : progressPct >= 40 ? 'from-blue-500 to-purple-500' : 'from-amber-500 to-orange-400'
                    }`} />
                </div>

                {/* Budget Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">Budget MO</div>
                        <div className="text-xl font-black text-white">{budgetEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500">{Math.round(budgetHours)}h × {HOURLY_RATE_EUR}€</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-black mb-1"><T k="achieved_value" /></div>
                        <div className="text-xl font-black text-emerald-400">{valoriseEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500">{Math.round(earnedHours)}h <T k="completed" /></div>
                    </div>
                    <div className={`${restantEur >= 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4 text-center`}>
                        <div className={`text-[10px] uppercase tracking-widest font-black mb-1 ${restantEur >= 0 ? 'text-amber-400' : 'text-red-400'}`}><T k="remaining" /></div>
                        <div className={`text-xl font-black ${restantEur >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{restantEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500">Taux: {HOURLY_RATE_EUR} €/h</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {project.revisions && project.revisions.length > 0 && (
                <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-purple-400" /> <T k="hub_recent_activity" />
                    </h3>
                    <div className="flex flex-col gap-3">
                        {project.revisions.slice(0, 5).map((rev) => (
                            <div key={rev.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-sm text-gray-200 font-medium">{rev.fileName}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(rev.uploadedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
