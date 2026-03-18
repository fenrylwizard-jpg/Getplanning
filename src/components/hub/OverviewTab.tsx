"use client";

import T from "@/components/T";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/LanguageContext";

interface OverviewTabProps {
    project: {
        id: string;
        name: string;
    };
}

const modules = [
    {
        key: "production",
        label: "hub_production",
        image: "/hub-icons/production.png",
        gradient: "from-cyan-500/10 to-blue-600/10",
        glow: "cyan",
        accent: "text-cyan-300",
        shadow: "hover:shadow-[0_0_60px_-10px_rgba(6,182,212,0.6)]",
        ring: "group-hover:ring-cyan-500/50",
        bg: "bg-cyan-950/20"
    },
    {
        key: "finances",
        label: "hub_finances",
        image: "/hub-icons/finances.png",
        gradient: "from-emerald-500/10 to-green-600/10",
        glow: "emerald",
        accent: "text-emerald-300",
        shadow: "hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.6)]",
        ring: "group-hover:ring-emerald-500/50",
        bg: "bg-emerald-950/20"
    },
    {
        key: "planning",
        label: "hub_planning",
        image: "/hub-icons/planning.png",
        gradient: "from-violet-500/10 to-fuchsia-600/10",
        glow: "violet",
        accent: "text-violet-300",
        shadow: "hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.6)]",
        ring: "group-hover:ring-violet-500/50",
        bg: "bg-violet-950/20"
    },
    {
        key: "technique",
        label: "hub_technique",
        image: "/hub-icons/technical.png",
        gradient: "from-rose-500/10 to-pink-600/10",
        glow: "rose",
        accent: "text-rose-300",
        shadow: "hover:shadow-[0_0_60px_-10px_rgba(244,63,94,0.6)]",
        ring: "group-hover:ring-rose-500/50",
        bg: "bg-rose-950/20"
    },
    {
        key: "achats",
        label: "hub_achats",
        image: "/hub-icons/purchases.png",
        gradient: "from-amber-500/10 to-orange-600/10",
        glow: "amber",
        accent: "text-amber-300",
        shadow: "hover:shadow-[0_0_60px_-10px_rgba(245,158,11,0.6)]",
        ring: "group-hover:ring-amber-500/50",
        bg: "bg-amber-950/20"
    },
];

export default function OverviewTab({ project }: OverviewTabProps) {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-12 w-full animate-in fade-in duration-700">
            {/* Header intro */}
            <div className="bg-[#080d1b]/80 border border-white/5 rounded-md p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto w-full mt-6">
                <div className="absolute top-0 right-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10 w-full flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wider">
                        Vue d&apos;Ensemble
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Accédez aux différents modules de gestion pour le projet <strong>{project.name}</strong>.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-10 lg:gap-14 items-stretch pb-20 mt-10 max-w-[1400px] mx-auto">
                {modules.map((mod, index) => (
                    <button 
                        key={mod.key}
                        onClick={() => router.push(`/pm/project/${project.id}?tab=${mod.key}`, { scroll: false })} 
                        className={`
                            relative group flex flex-col items-center justify-center
                            w-[260px] h-[320px] sm:w-[300px] sm:h-[360px]
                            rounded-[3rem] ${mod.bg} backdrop-blur-2xl
                            ring-1 ring-white/5 ${mod.ring}
                            transition-all duration-700 hover:-translate-y-4 hover:scale-[1.03] 
                            ${mod.shadow} overflow-hidden
                        `}
                        style={{
                            animation: `fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s forwards`,
                            opacity: 0,
                            transform: 'translateY(30px)'
                        }}
                    >
                        {/* CSS local animation style */}
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes fade-in-up {
                                0% { opacity: 0; transform: translateY(30px); }
                                100% { opacity: 1; transform: translateY(0); }
                            }
                        `}} />

                        {/* Background Fluid Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay`} />
                        <div className={`absolute -inset-4 bg-gradient-to-tr ${mod.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-3xl rounded-full pointer-events-none`} />
                        
                        {/* Core Light Core */}
                        <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-${mod.glow}-400/10 blur-[60px] rounded-full group-hover:scale-150 group-hover:bg-${mod.glow}-400/20 transition-all duration-1000 pointer-events-none mix-blend-plus-lighter`} />

                        {/* Module Holographic Icon Image */}
                        <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 transform group-hover:scale-[1.15] group-hover:-translate-y-3 transition-transform duration-700 drop-shadow-[0_0_25px_rgba(255,255,255,0.1)] mb-4">
                            {/* Inner rotational aura */}
                            <div className={`absolute inset-[-15px] border-2 border-dashed border-${mod.glow}-400/20 rounded-full animate-[spin_15s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            
                            <img 
                                src={mod.image} 
                                alt={t(mod.label)} 
                                className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] mix-blend-screen"
                                style={{ mixBlendMode: 'screen' }}
                            />
                        </div>

                        {/* Label */}
                        <h3 className={`relative z-10 text-xl sm:text-2xl font-black uppercase tracking-[0.2em] ${mod.accent} group-hover:text-white transition-colors duration-500 text-center px-4 leading-tight`}>
                            <T k={mod.label} />
                        </h3>
                        
                        {/* Interactive Arrow Indicator */}
                        <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-6 group-hover:translate-y-0 text-white/50 text-xs tracking-[0.3em] font-bold flex items-center justify-center gap-3 uppercase w-full">
                            Entrer 
                            <span className="w-8 h-[1px] bg-white/30 relative">
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[1px] border-r-[1px] border-white/50 w-2 h-2 rotate-45 transform origin-right group-hover:translate-x-1 transition-transform duration-300"></span>
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
