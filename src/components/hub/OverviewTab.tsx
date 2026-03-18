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
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-md ${c.bg} border ${c.border}`}>
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
            {/* Header intro */}
            <div className="bg-[#080d1b]/80 border border-white/5 rounded-md p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-sm blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black mb-4"><T k="hub_overview" /></h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Bienvenue sur le tableau de bord du projet <strong>{project.name}</strong>. Cet espace centralise toutes les données clés. Cliquez sur les modules ci-dessous pour plonger dans les détails.
                    </p>
                </div>
            </div>

            {/* BENTO GRID RECAP */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Production (Takes 2 columns on wide screens) */}
                <div className="lg:col-span-2 group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-cyan-500/40 transition-all duration-500 overflow-hidden text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-cyan-500/10 rounded-md border border-cyan-500/20 text-cyan-400">
                                    <Activity size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white"><T k="hub_production" /></h3>
                            </div>
                            <p className="text-gray-400 mb-6">Suivez l&apos;avancement heure par heure. {totalTasks} tâches modélisées.</p>
                        </div>
                        
                        <div className="bg-[#060a14]/50 rounded-md p-5 border border-white/5">
                            <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">
                                <span><T k="progress" /> Main d&apos;Œuvre</span>
                                <span className="text-cyan-400">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-2">
                                <div className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-cyan-400`} style={{ width: `${progressPct}%` }} />
                            </div>
                            <div className="text-xs text-gray-500">{Math.round(earnedHours)}h réalisées sur {Math.round(budgetHours)}h prévues</div>
                        </div>
                    </div>
                </div>

                {/* 2. Planning */}
                <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-violet-500/40 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-violet-500/10 rounded-md border border-violet-500/20 text-violet-400">
                                <Calendar size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white"><T k="hub_planning" /></h3>
                        </div>
                        <p className="text-gray-400 mb-6">Planification hebdomadaire S+1 à S+3 par le Chef de Chantier.</p>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-md p-4 text-center">
                                <span className="block text-2xl font-black text-violet-400">{planCount}</span>
                                <span className="text-[10px] uppercase text-gray-500 font-bold">Soumissions</span>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-4 text-center">
                                <span className="block text-2xl font-black text-emerald-400">{hitPlans}</span>
                                <span className="text-[10px] uppercase text-gray-500 font-bold">Obj. Atteints</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Finances */}
                <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-emerald-500/40 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white"><T k="hub_finances" /></h3>
                        </div>
                        <p className="text-gray-400 mb-6">Monétisation de la main d&apos;œuvre et suivi du budget alloué au projet.</p>
                        <div className="bg-[#060a14]/50 rounded-md p-5 border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Valeur Réalisée</span>
                            <span className="text-3xl font-black text-emerald-400 drop-shadow-md">{valoriseEur.toLocaleString()} €</span>
                            <span className="text-xs text-gray-500 mt-1">sur {budgetEur.toLocaleString()} €</span>
                        </div>
                    </div>
                </div>

                {/* 4. Achats / Purchases */}
                <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-amber-500/40 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-amber-400">
                                    <ClipboardList size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white"><T k="hub_achats" /></h3>
                            </div>
                            <p className="text-gray-400">Bordereaux, Factures et suivis de commandes fournisseurs.</p>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-amber-400/80 font-bold text-sm">
                            Explorer le module <span>→</span>
                        </div>
                    </div>
                </div>

                {/* 5. Dossier Technique */}
                <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-rose-500/40 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-rose-500/10 rounded-md border border-rose-500/20 text-rose-400">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white"><T k="hub_technique" /></h3>
                            </div>
                            <p className="text-gray-400">Plans techniques à jour, schémas, et documentations du site.</p>
                        </div>
                        
                        <div className="mt-6 bg-[#060a14]/50 rounded-md p-4 border border-white/5 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-bold uppercase">Documents récents</span>
                            <span className="text-rose-400 font-black px-2 py-1 bg-rose-500/10 text-sm rounded-lg">{project.revisions?.length ?? 0}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
