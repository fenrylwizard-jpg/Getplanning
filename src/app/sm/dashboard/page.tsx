import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Activity } from "lucide-react";
import T from "@/components/T";
import AvatarDisplay from "@/components/AvatarDisplay";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SMDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: String(payload.id) },
        include: {
            projectsAsSM: {
                include: {
                    tasks: true,
                    weeklyPlans: true,
                },
            },
        },
    });

    if (!user) return <div><T k="user_not_found" /></div>;
    
    interface UIUser {
        name: string;
        characterId: number;
        level: number;
        xp: number;
    }
    const u = user as unknown as UIUser;

    const totalTasks = user.projectsAsSM.reduce((acc, proj) => acc + proj.tasks.length, 0);

    const getProgressWidth = (xp: number) => {
        const pct = Math.floor(((xp % 1000) / 10) / 5) * 5; // Rounds to nearest 5%
        const widths: Record<number, string> = {
            0: "w-0", 5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]", 25: "w-[25%]",
            30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]", 50: "w-[50%]",
            55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]", 75: "w-[75%]",
            80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]", 100: "w-full"
        };
        return widths[pct] || "w-0";
    };

    return (
        <div className="aurora-page text-white font-sans selection:bg-cyan-500/30 flex flex-col items-center w-full">

            <main className="max-w-5xl w-full px-6 sm:px-8 py-10 sm:py-16 relative z-10 flex flex-col items-center gap-12">
                
                {/* Global Status Section */}
                <section>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-8 flex items-center justify-center gap-3">
                        <Activity className="text-cyan-400" size={28} /> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400"><T k="global_status" /></span>
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <div className="glass-card p-6 sm:p-8 bg-[#080d1a]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl flex items-center gap-6 min-w-[300px]">
                            <AvatarDisplay characterId={u.characterId} level={u.level} size={100} />
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white">{u.name}</span>
                                <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">LVL {u.level} <T k="site_manager" /></span>
                                <div className="mt-2 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className={`bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-1000 ${getProgressWidth(u.xp)}`} />
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase font-black">{u.xp} XP</span>
                            </div>
                        </div>

                        <div className="glass-card p-8 bg-[#080d1a]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center gap-3">
                            <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{user.projectsAsSM.length}</span>
                            <span className="text-sm text-gray-400 uppercase tracking-widest font-bold"><T k="active_sites" /></span>
                        </div>

                        <div className="glass-card p-8 bg-[#080d1a]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-5xl sm:text-6xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">{totalTasks}</span>
                            <span className="text-sm text-gray-400 uppercase tracking-widest font-bold"><T k="total_tasks" /></span>
                        </div>
                    </div>
                </section>

                {/* Projects & Quick Actions */}
                <section className="flex flex-col gap-8">
                    {user.projectsAsSM.map((proj) => (
                        <div key={proj.id} className="relative glass-card bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-cyan-500/30 transition-all duration-500 flex flex-col gap-8">
                            
                            {/* Project Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                                <div>
                                    <h3 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md mb-3">{proj.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-300 text-sm font-bold tracking-wider uppercase">
                                            {proj.location || <T k="on_site" />}
                                        </span>
                                        <span className="text-base text-gray-400">
                                            {proj.tasks.length} <T k="assigned_tasks" />
                                        </span>
                                    </div>
                                </div>
                                <Link href={`/sm/project/${proj.id}/analytics`} className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-base font-bold text-white transition-colors">
                                    <T k="view_analytics" />
                                </Link>
                            </div>

                            {/* Quick Action Grid (SVG Icons) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Action 1: Rapport Quotidien (Orange) */}
                                <Link href={`/sm/project/${proj.id}/report`} className="group relative bg-[#050810]/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-6 hover:border-orange-500/50 hover:bg-orange-900/10 transition-all duration-500 overflow-hidden text-center hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(249,115,22,0.5)]">
                                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <defs>
                                                <linearGradient id={`rg-${proj.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#fb923c" />
                                                    <stop offset="100%" stopColor="#ea580c" />
                                                </linearGradient>
                                                <filter id={`rs-${proj.id}`}>
                                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#f97316" floodOpacity="0.5"/>
                                                </filter>
                                            </defs>
                                            {/* Clipboard body */}
                                            <rect x="18" y="20" width="64" height="72" rx="8" fill={`url(#rg-${proj.id})`} filter={`url(#rs-${proj.id})`} opacity="0.95" />
                                            <rect x="22" y="24" width="56" height="64" rx="6" fill="#1a0a00" opacity="0.5" />
                                            {/* Clip at top */}
                                            <rect x="36" y="14" width="28" height="14" rx="4" fill="#fdba74" />
                                            <rect x="40" y="16" width="20" height="10" rx="3" fill="#1a0a00" opacity="0.4" />
                                            {/* Check lines */}
                                            <line x1="32" y1="44" x2="68" y2="44" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="32" y1="55" x2="68" y2="55" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="32" y1="66" x2="55" y2="66" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" />
                                            {/* Checkmark */}
                                            <polyline points="27,44 30,47 36,41" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                            <polyline points="27,55 30,58 36,52" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                            {/* Glow dot */}
                                            <circle cx="82" cy="22" r="8" fill="#22d3ee" opacity="0.8" />
                                            <circle cx="82" cy="22" r="4" fill="white" />
                                        </svg>
                                    </div>
                                     <div className="z-10">
                                        <span className="text-white font-bold text-lg sm:text-xl group-hover:text-orange-300 transition-colors block">
                                            <T k="daily_report_title" />
                                        </span>
                                        <span className="text-[11px] text-orange-400/60 group-hover:text-orange-400/80 transition-colors mt-1 block">
                                            <T k="daily_report_subtitle" />
                                        </span>
                                    </div>
                                </Link>

                                {/* Action 2: Planification S+1/S+2/S+3 (Cyan) */}
                                <Link href={`/sm/project/${proj.id}/plan`} className="group relative bg-[#050810]/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-6 hover:border-cyan-500/50 hover:bg-cyan-900/10 transition-all duration-500 overflow-hidden text-center hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(6,182,212,0.5)]">
                                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <defs>
                                                <linearGradient id={`pg-${proj.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#22d3ee" />
                                                    <stop offset="100%" stopColor="#0891b2" />
                                                </linearGradient>
                                                <filter id={`ps-${proj.id}`}>
                                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.5"/>
                                                </filter>
                                            </defs>
                                            {/* Calendar body */}
                                            <rect x="12" y="22" width="76" height="68" rx="10" fill={`url(#pg-${proj.id})`} filter={`url(#ps-${proj.id})`} opacity="0.95" />
                                            <rect x="16" y="36" width="68" height="50" rx="6" fill="#001a22" opacity="0.65" />
                                            {/* Header bar */}
                                            <rect x="12" y="22" width="76" height="18" rx="10" fill="#06b6d4" />
                                            <rect x="12" y="30" width="76" height="10" fill="#06b6d4" />
                                            {/* Rings */}
                                            <rect x="30" y="15" width="8" height="16" rx="4" fill="#a5f3fc" />
                                            <rect x="62" y="15" width="8" height="16" rx="4" fill="#a5f3fc" />
                                            {/* Grid lines */}
                                            <line x1="16" y1="50" x2="84" y2="50" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                                            <line x1="16" y1="62" x2="84" y2="62" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                                            <line x1="16" y1="74" x2="84" y2="74" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                                            {/* S+1 S+2 S+3 badges */}
                                            <rect x="20" y="39" width="16" height="8" rx="3" fill="#22d3ee" opacity="0.9" />
                                            <text x="28" y="46" textAnchor="middle" fontSize="5" fill="#001a22" fontWeight="bold">S+1</text>
                                            <rect x="42" y="39" width="16" height="8" rx="3" fill="#67e8f9" opacity="0.7" />
                                            <text x="50" y="46" textAnchor="middle" fontSize="5" fill="#001a22" fontWeight="bold">S+2</text>
                                            <rect x="64" y="39" width="16" height="8" rx="3" fill="#a5f3fc" opacity="0.5" />
                                            <text x="72" y="46" textAnchor="middle" fontSize="5" fill="#001a22" fontWeight="bold">S+3</text>
                                            {/* Dots */}
                                            <circle cx="28" cy="58" r="3" fill="#22d3ee" />
                                            <circle cx="50" cy="58" r="3" fill="#67e8f9" opacity="0.7" />
                                            <circle cx="72" cy="58" r="3" fill="#a5f3fc" opacity="0.5" />
                                        </svg>
                                    </div>
                                     <div className="z-10">
                                        <span className="text-white font-bold text-lg sm:text-xl group-hover:text-cyan-300 transition-colors block">
                                            <T k="planning_title" />
                                        </span>
                                        <span className="text-[11px] text-cyan-400/60 group-hover:text-cyan-400/80 transition-colors mt-1 block">
                                            <T k="planning_subtitle" />
                                        </span>
                                    </div>
                                </Link>

                                {/* Action 3: Historique (Purple/Violet) */}
                                <Link href={`/sm/project/${proj.id}/plan/history`} className="group relative bg-[#050810]/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-6 hover:border-violet-500/50 hover:bg-violet-900/10 transition-all duration-500 overflow-hidden text-center hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_25px_rgba(139,92,246,0.5)]">
                                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <defs>
                                                <linearGradient id={`hg-${proj.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#a78bfa" />
                                                    <stop offset="100%" stopColor="#7c3aed" />
                                                </linearGradient>
                                                <filter id={`hs-${proj.id}`}>
                                                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#8b5cf6" floodOpacity="0.6"/>
                                                </filter>
                                            </defs>
                                            {/* Stack of reports — back */}
                                            <rect x="22" y="30" width="56" height="52" rx="7" fill="#4c1d95" opacity="0.7" transform="rotate(-6 50 55)" />
                                            <rect x="22" y="30" width="56" height="52" rx="7" fill="#5b21b6" opacity="0.85" transform="rotate(-2 50 55)" />
                                            {/* Front report */}
                                            <rect x="20" y="28" width="60" height="54" rx="8" fill={`url(#hg-${proj.id})`} filter={`url(#hs-${proj.id})`} />
                                            <rect x="24" y="32" width="52" height="46" rx="5" fill="#120a2a" opacity="0.5" />
                                            {/* Clock/history symbol */}
                                            <circle cx="50" cy="52" r="14" fill="none" stroke="#c4b5fd" strokeWidth="2.5" />
                                            <line x1="50" y1="45" x2="50" y2="52" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="50" y1="52" x2="57" y2="56" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="50" cy="52" r="2" fill="#e9d5ff" />
                                            {/* Arrow (rewind) */}
                                            <path d="M 36 44 A 14 14 0 0 1 50 38" stroke="#c4b5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
                                            <polyline points="33,41 36,44 40,42" stroke="#c4b5fd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                            {/* Week label */}
                                            <rect x="30" y="34" width="40" height="7" rx="2" fill="#7c3aed" opacity="0.7" />
                                             <text x="50" y="40" textAnchor="middle" fontSize="5" fill="#e9d5ff" fontWeight="bold"><T k="closed_weeks_badge" /></text>
                                        </svg>
                                    </div>
                                    <div className="z-10">
                                        <span className="text-white font-bold text-lg sm:text-xl group-hover:text-violet-300 transition-colors block">
                                            <T k="history_title" />
                                        </span>
                                        <span className="text-[11px] text-violet-400/60 group-hover:text-violet-400/80 transition-colors mt-1 block">
                                            <T k="history_subtitle" />
                                        </span>
                                    </div>
                                </Link>

                            </div>
                        </div>
                    ))}

                    {user.projectsAsSM.length === 0 && (
                        <div className="glass-card bg-[#0a1020]/90 border border-white/5 text-center py-20 text-gray-400 rounded-[40px]">
                            <p className="text-xl"><T k="no_assigned_sites" /></p>
                            <p className="mt-2 text-sm text-gray-500"><T k="contact_pm" /></p>
                        </div>
                    )}
                </section>

                {/* Alerts - Only shown if real issues exist */}
                {user.projectsAsSM.length > 0 && (
                    <section className="mt-8">
                        <h2 className="text-2xl font-bold text-white mb-6"><T k="recent_alerts" /></h2>
                        {/* Real alerts would go here */}
                    </section>
                )}

            </main>
        </div>
    );
}
