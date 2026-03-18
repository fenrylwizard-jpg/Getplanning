import T from "@/components/T";
import { Calendar, FileText, TrendingUp, Activity, ClipboardList } from "lucide-react";
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

export default function OverviewTab({ project }: OverviewTabProps) {
    const budgetHours = project.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
    const earnedHours = project.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
    const progressPct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
    const valoriseEur = Math.round(earnedHours * HOURLY_RATE_EUR);

    const planCount = project.weeklyPlans.length;
    const hitPlans = project.weeklyPlans.filter(p => p.targetReached === true).length;

    return (
        <div className="flex flex-col gap-12 w-full animate-in fade-in duration-700">
            {/* Custom local animations for the Nexus */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-nexus {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.02); }
                }
                .animate-float-nexus {
                    animation: float-nexus 6s ease-in-out infinite;
                }
                @keyframes dash-orbit {
                    0% { stroke-dashoffset: 1000; }
                    100% { stroke-dashoffset: 0; }
                }
                .animate-orbit {
                    stroke-dasharray: 20 10;
                    animation: dash-orbit 30s linear infinite;
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up forwards;
                }
            `}} />

            {/* Header intro */}
            <div className="bg-[#080d1b]/80 border border-white/5 rounded-md p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto w-full">
                <div className="absolute top-0 right-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10 w-full flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider">
                        Nexus de Contrôle
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Surveillance en temps réel du projet <strong>{project.name}</strong>. Les systèmes sont connectés et synchronisés.
                    </p>
                </div>
            </div>

            {/* NEXUS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-center relative">
                
                {/* Background Connecting Lines (only visible on large screens) */}
                <div className="hidden lg:block absolute inset-0 pointer-events-none opacity-20 z-0">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                        <path d="M 33% 30% C 50% 30%, 50% 50%, 66% 20%" fill="none" stroke="#00f2fe" strokeWidth="2" className="animate-orbit" />
                        <path d="M 33% 80% C 50% 80%, 50% 50%, 66% 80%" fill="none" stroke="#8b5cf6" strokeWidth="2" className="animate-orbit" />
                        <path d="M 33% 50% L 66% 50%" fill="none" stroke="#10b981" strokeWidth="2" className="animate-orbit" />
                    </svg>
                </div>

                {/* LEFT COLUMN: Production & Finances */}
                <div className="flex flex-col gap-6 relative z-10">
                    {/* Production Card */}
                    <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.3)] opacity-0 animate-[fade-in-up_0.8s_ease-out_0.2s_forwards]">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-cyan-500/10 rounded-md border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                    <Activity size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-wide"><T k="hub_production" /></h3>
                            </div>
                            <div className="bg-[#060a14]/60 rounded-md p-5 border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px]" />
                                <div className="relative">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">
                                        <span>Avancement</span>
                                        <span className="text-cyan-400 animate-pulse">{progressPct}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2 rounded-md overflow-hidden mb-2">
                                        <div className={`h-full rounded-md transition-all duration-1000 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_#00f2fe]`} style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">{Math.round(earnedHours)}h réalis. / {Math.round(budgetHours)}h prév.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finances Card */}
                    <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] opacity-0 animate-[fade-in-up_0.8s_ease-out_0.4s_forwards]">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                    <TrendingUp size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-wide"><T k="hub_finances" /></h3>
                            </div>
                            <div className="bg-[#060a14]/60 rounded-md p-5 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-emerald-500/10 blur-[30px]" />
                                <span className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-black mb-1 relative z-10">Valeur Réalisée</span>
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] relative z-10">
                                    {valoriseEur.toLocaleString()} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: The Hovering Nexus Button / Image */}
                <div className="flex justify-center items-center py-10 lg:py-0 relative z-20 opacity-0 animate-[fade-in-up_1s_ease-out_forwards]">
                    {/* Glowing aura */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-transparent to-cyan-600/30 blur-[60px] rounded-full animate-pulse pointer-events-none" />
                    
                    {/* Core Image Container */}
                    <div className="relative w-full max-w-[450px] aspect-square rounded-full animate-float-nexus group cursor-crosshair">
                        {/* Data Rings (Decorative) */}
                        <div className="absolute inset-2 border-[1px] border-white/10 rounded-full border-dashed animate-[spin_40s_linear_infinite]" />
                        <div className="absolute inset-8 border-[2px] border-purple-500/20 rounded-full border-dotted animate-[spin_30s_linear_infinite_reverse]" />
                        
                        <img 
                            src="/hub-icons/overview.png" 
                            alt="Nexus Core" 
                            className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(147,51,234,0.6)] relative z-10 transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Interactive overlay text on hover */}
                        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-md border border-purple-500/50 text-purple-300 font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                                Systèmes Nominaux
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Planning, Technique, Achats */}
                <div className="flex flex-col gap-6 relative z-10">
                    {/* Planning Card */}
                    <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-violet-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] opacity-0 animate-[fade-in-up_0.8s_ease-out_0.3s_forwards]">
                        <div className="absolute inset-0 bg-gradient-to-l from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-violet-500/10 rounded-md border border-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                                    <Calendar size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-wide"><T k="hub_planning" /></h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#060a14]/60 border border-white/5 rounded-md p-4 text-center">
                                    <span className="block text-3xl font-black text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">{planCount}</span>
                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Soumissions</span>
                                </div>
                                <div className="bg-[#060a14]/60 border border-white/5 rounded-md p-4 text-center">
                                    <span className="block text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{hitPlans}</span>
                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Atteints</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dossier Technique Card */}
                    <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-rose-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)] opacity-0 animate-[fade-in-up_0.8s_ease-out_0.5s_forwards]">
                        <div className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-rose-500/10 rounded-md border border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-wide"><T k="hub_technique" /></h3>
                            </div>
                            <div className="bg-[#060a14]/60 rounded-md p-4 border border-white/5 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-bold uppercase">Documents Actifs</span>
                                <span className="text-rose-400 font-black px-3 py-1 bg-rose-500/10 text-lg rounded-md border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                                    {project.revisions?.length ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Achats Card */}
                    <div className="group relative bg-[#0a1020]/90 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-xl hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)] opacity-0 animate-[fade-in-up_0.8s_ease-out_0.7s_forwards]">
                        <div className="absolute inset-0 bg-gradient-to-l from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                    <ClipboardList size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-wide"><T k="hub_achats" /></h3>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-amber-400/80 font-bold text-sm uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                                Accéder au module <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
