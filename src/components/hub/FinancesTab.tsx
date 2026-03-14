import T from "@/components/T";
import { Euro, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { HOURLY_RATE_EUR } from "@/lib/xp-engine";

interface FinancesTabProps {
    project: {
        tasks: { id: string; quantity: number; completedQuantity: number; minutesPerUnit: number }[];
        weeklyPlans: { id: string; targetHoursCapacity: number; isClosed: boolean }[];
    };
}

export default function FinancesTab({ project }: FinancesTabProps) {
    const budgetHours = project.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
    const earnedHours = project.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
    const burnedHours = project.weeklyPlans.filter(p => p.isClosed).reduce((s, p) => s + p.targetHoursCapacity, 0);

    const budgetEur = Math.round(budgetHours * HOURLY_RATE_EUR);
    const valoriseEur = Math.round(earnedHours * HOURLY_RATE_EUR);
    const burnedEur = Math.round(burnedHours * HOURLY_RATE_EUR);
    const restantEur = budgetEur - valoriseEur;
    const progressPct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
    const cpiRatio = burnedHours > 0 ? (earnedHours / burnedHours) : 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#080d1a]/80 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[60px] -z-0 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-400 mb-3">
                            <Wallet size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Budget MO</span>
                        </div>
                        <div className="text-3xl font-black text-white">{budgetEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500 mt-1">{Math.round(budgetHours).toLocaleString()}h × {HOURLY_RATE_EUR}€/h</div>
                    </div>
                </div>

                <div className="bg-[#080d1a]/80 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[60px] -z-0 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400 mb-3">
                            <ArrowUpRight size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest"><T k="achieved_value" /></span>
                        </div>
                        <div className="text-3xl font-black text-emerald-400">{valoriseEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500 mt-1">{Math.round(earnedHours).toLocaleString()}h <T k="completed" /></div>
                    </div>
                </div>

                <div className="bg-[#080d1a]/80 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[60px] -z-0 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-orange-400 mb-3">
                            <ArrowDownRight size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest"><T k="hub_burned" /></span>
                        </div>
                        <div className="text-3xl font-black text-orange-400">{burnedEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500 mt-1">{Math.round(burnedHours).toLocaleString()}h <T k="hub_consumed" /></div>
                    </div>
                </div>

                <div className={`bg-[#080d1a]/80 border ${restantEur >= 0 ? 'border-amber-500/20' : 'border-red-500/20'} rounded-2xl p-6 relative overflow-hidden group`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 ${restantEur >= 0 ? 'bg-amber-500/5' : 'bg-red-500/5'} rounded-bl-[60px] -z-0 group-hover:scale-110 transition-transform`} />
                    <div className="relative z-10">
                        <div className={`flex items-center gap-2 ${restantEur >= 0 ? 'text-amber-400' : 'text-red-400'} mb-3`}>
                            <Euro size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest"><T k="remaining" /></span>
                        </div>
                        <div className={`text-3xl font-black ${restantEur >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{restantEur.toLocaleString()} €</div>
                        <div className="text-xs text-gray-500 mt-1">{progressPct}% <T k="hub_budget_used" /></div>
                    </div>
                </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-cyan-400" /> <T k="hub_cost_performance" />
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">CPI (Cost Performance Index)</div>
                            <div className={`text-4xl font-black ${cpiRatio >= 1 ? 'text-emerald-400' : cpiRatio >= 0.85 ? 'text-amber-400' : 'text-red-400'}`}>
                                {cpiRatio.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {cpiRatio >= 1 ? '✓ Performant' : cpiRatio >= 0.85 ? '⚠ Attention' : '✗ Sous-performant'}
                            </div>
                        </div>
                        <div className="w-px h-16 bg-white/10" />
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold"><T k="progress" /></div>
                            <div className="text-4xl font-black text-white">{progressPct}%</div>
                            <div className="text-xs text-gray-500 mt-1">{Math.round(earnedHours)}h / {Math.round(budgetHours)}h</div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon — Detailed Breakdown */}
                <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-purple-400" /> <T k="hub_detailed_breakdown" />
                    </h3>
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                        <BarChart3 size={48} className="mb-3 text-gray-600" />
                        <p className="text-gray-500 text-sm font-bold"><T k="hub_coming_soon" /></p>
                        <p className="text-gray-600 text-xs mt-1"><T k="hub_coming_soon_desc" /></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
