import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadCloud, Folder, Activity, ArrowRight, Building2, HeartPulse, FileText, Calendar } from "lucide-react";
import T from "@/components/T";
import AvatarDisplay from "@/components/AvatarDisplay";
import { HOURLY_RATE_EUR } from "@/lib/xp-engine";

export const dynamic = 'force-dynamic';

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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${c.bg} border ${c.border}`}>
            <Icon size={20} className={c.icon} />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold"><T k={label} /></span>
                <span className={`text-sm font-bold ${c.text}`}><T k={`health_${status}`} /></span>
            </div>
        </div>
    );
}

export default async function PMDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: String(payload.id) },
    });

    if (!user) return <div><T k="user_not_found" /></div>;

    // All PMs and Admins see ALL projects
    const allProjects = await prisma.project.findMany({
        include: {
            weeklyPlans: true,
            siteManager: true,
            tasks: { select: { id: true, quantity: true, completedQuantity: true, minutesPerUnit: true } },
            revisions: {
                orderBy: { uploadedAt: 'desc' as const }
            }
        },
        orderBy: { createdAt: 'desc' as const }
    });
    
    interface UIUser {
        name: string;
        characterId: number;
        level: number;
        xp: number;
    }
    const u = user as unknown as UIUser;

    const totalPlans = allProjects.reduce((acc, proj) => acc + proj.weeklyPlans.length, 0);

    const getProgressWidth = (xp: number) => {
        const pct = Math.floor(((xp % 1000) / 10) / 5) * 5;
        const widths: Record<number, string> = {
            0: "w-0", 5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]", 25: "w-[25%]",
            30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]", 50: "w-[50%]",
            55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]", 75: "w-[75%]",
            80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]", 100: "w-full"
        };
        return widths[pct] || "w-0";
    };

    return (
        <div className="aurora-page flex flex-col items-center w-full">

            <main className="max-w-7xl w-full px-6 sm:px-8 py-10 sm:py-16 relative z-10 flex flex-col items-center">
                <div className="max-w-7xl w-full px-6 sm:px-12 flex flex-col gap-12">
                
                {/* Hero Section - centered */}
                <div className="text-center flex flex-col items-center gap-6">
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-400">
                        <T k="dashboard" />
                    </h1>
                    
                    <div className="glass-card p-6 sm:p-8 bg-[#080d1a]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl flex items-center gap-6 mt-4">
                        <AvatarDisplay characterId={u.characterId} level={u.level} size={100} />
                        <div className="flex flex-col text-left">
                            <span className="text-2xl font-black text-white">{u.name}</span>
                            <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">LVL {u.level} <T k="project_manager" /></span>
                            <div className="mt-2 w-48 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className={`bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-1000 ${getProgressWidth(u.xp)}`} />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 uppercase font-black">{u.xp} XP</span>
                        </div>
                    </div>

                    <p className="text-gray-400 text-lg sm:text-xl max-w-2xl leading-relaxed mt-4"><T k="supervision_desc" /></p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/pm/analytics" className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-lg text-white transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <Activity size={20} /> <T k="view_analytics" />
                        </Link>
                        <Link href="/pm/upload" className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 font-bold text-lg text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all hover:scale-[1.02]">
                            <UploadCloud size={20} /> <T k="upload_xls" />
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                    <div className="w-full glass-card flex items-center gap-8 p-10 bg-[#080d1a]/80 backdrop-blur-md rounded-[32px] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-purple-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-bl-[120px] -z-10 group-hover:scale-110 transition-transform" />
                        <Folder size={48} className="text-purple-400 opacity-80 shrink-0" />
                        <div>
                            <h4 className="mb-1 text-gray-400 font-bold uppercase tracking-widest text-sm"><T k="active_projects" /></h4>
                            <div className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-none">{allProjects.length}</div>
                        </div>
                    </div>
                    <div className="w-full glass-card flex items-center gap-8 p-10 bg-[#080d1a]/80 backdrop-blur-md rounded-[32px] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-bl-[120px] -z-10 group-hover:scale-110 transition-transform" />
                        <Activity size={48} className="text-blue-400 opacity-80 shrink-0" />
                        <div>
                            <h4 className="mb-1 text-gray-400 font-bold uppercase tracking-widest text-sm"><T k="submitted_plans" /></h4>
                            <div className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-none">{totalPlans}</div>
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <section>
                    <h3 className="text-3xl font-bold mb-8 flex items-center justify-center gap-3">
                        <Building2 className="text-purple-400" size={28} /> <T k="your_sites" />
                    </h3>
                    
                    <div className="flex flex-col gap-8">
                        {allProjects.map((proj) => {
                            const hasFeedback = proj.weeklyPlans.length > 0;
                            const planCount = proj.weeklyPlans.length;
                            const planningStatus: 'good' | 'average' | 'poor' = planCount >= 3 ? 'good' : planCount >= 1 ? 'average' : 'poor';
                            const feedbackStatus: 'good' | 'average' | 'poor' = hasFeedback ? 'good' : 'poor';
                            const efficiencyStatus: 'good' | 'average' | 'poor' = planCount >= 3 ? 'good' : planCount >= 1 ? 'average' : 'poor';
                            
                            // Profitability calculation
                            const budgetHours = proj.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
                            const earnedHours = proj.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
                            const progressPct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
                            const budgetEur = Math.round(budgetHours * HOURLY_RATE_EUR);
                            const spentEur = Math.round(earnedHours * HOURLY_RATE_EUR);

                            return (
                            <Link href={`/pm/project/${proj.id}`} key={proj.id} className="block relative glass-card bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-purple-500/30 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500">
                                
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">{proj.name}</h3>
                                        
                                        <div className="flex flex-wrap gap-3 mb-5">
                                            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300">
                                                <T k="site_manager" />: <span className="text-purple-300">{proj.siteManager?.name || <T k="unassigned" />}</span>
                                            </span>
                                            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300">
                                                <T k="location" />: {proj.location || 'N/A'}
                                            </span>
                                            <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300">
                                                <T k="tasks_loaded" />: <span className="text-blue-300">{proj.tasks.length}</span>
                                            </span>
                                        </div>

                                        {/* Health Indicators */}
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <HealthBadge status={planningStatus} type="planning" />
                                            <HealthBadge status={feedbackStatus} type="feedback" />
                                            <HealthBadge status={efficiencyStatus} type="efficiency" />
                                        </div>

                                        {/* Profitability bar */}
                                        {budgetHours > 0 && (() => {
                                            const safeId = proj.id.replace(/[^a-z0-9]/gi, '');
                                            const barColor = progressPct >= 80
                                                ? 'from-emerald-500 to-green-400'
                                                : progressPct >= 40
                                                ? 'from-blue-500 to-purple-500'
                                                : 'from-amber-500 to-orange-400';
                                            return (
                                                <div className="mt-4">
                                                    <style>{`.pb-${safeId}{width:${progressPct}%}`}</style>
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1 font-bold">
                                                        <span><T k="labor_progress" />: {progressPct}% — {Math.round(earnedHours)}h / {Math.round(budgetHours)}h</span>
                                                        <span className="text-emerald-400">{spentEur.toLocaleString()}€ / {budgetEur.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                        <div className={`pb-${safeId} h-full rounded-full transition-all duration-700 bg-gradient-to-r ${barColor}`} />
                                                    </div>
                                                </div>
                                            );
                                        })()}


                                        {proj.revisions && proj.revisions.length > 0 && (
                                            <div className="mt-4 text-sm bg-purple-900/20 px-4 py-3 rounded-xl border border-purple-500/30 inline-block">
                                                <strong className="text-purple-300"><T k="last_revision" />:</strong> {new Date(proj.revisions[0].uploadedAt).toLocaleDateString()} 
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/10 group-hover:border-purple-500/30 text-white font-bold transition-all shadow-md text-base">
                                            <T k="view_details" /> <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                        })}
                        {allProjects.length === 0 && (
                            <div className="glass-card bg-[#0a1020]/90 border border-white/5 text-center py-20 text-gray-400 text-lg rounded-[32px]">
                                <T k="no_projects" />
                            </div>
                        )}
                    </div>
                </section>
                </div>
            </main>
        </div>
    );
}
