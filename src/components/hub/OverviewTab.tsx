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
        gradient: "from-cyan-600/20 to-blue-600/20",
        border: "border-cyan-500/30",
        glow: "cyan",
        accent: "text-cyan-400",
        hoverBorder: "hover:border-cyan-400/60",
        shadow: "hover:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.3)]"
    },
    {
        key: "finances",
        label: "hub_finances",
        image: "/hub-icons/finances.png",
        gradient: "from-emerald-600/20 to-green-600/20",
        border: "border-emerald-500/30",
        glow: "emerald",
        accent: "text-emerald-400",
        hoverBorder: "hover:border-emerald-400/60",
        shadow: "hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]"
    },
    {
        key: "planning",
        label: "hub_planning",
        image: "/hub-icons/planning.png",
        gradient: "from-violet-600/20 to-fuchsia-600/20",
        border: "border-violet-500/30",
        glow: "violet",
        accent: "text-violet-400",
        hoverBorder: "hover:border-violet-400/60",
        shadow: "hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)]"
    },
    {
        key: "technique",
        label: "hub_technique",
        image: "/hub-icons/technical.png",
        gradient: "from-rose-600/20 to-pink-600/20",
        border: "border-rose-500/30",
        glow: "rose",
        accent: "text-rose-400",
        hoverBorder: "hover:border-rose-400/60",
        shadow: "hover:shadow-[0_10px_40px_-10px_rgba(244,63,94,0.3)]"
    },
    {
        key: "achats",
        label: "hub_achats",
        image: "/hub-icons/purchases.png",
        gradient: "from-amber-600/20 to-orange-600/20",
        border: "border-amber-500/30",
        glow: "amber",
        accent: "text-amber-400",
        hoverBorder: "hover:border-amber-400/60",
        shadow: "hover:shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)]"
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

            {/* NAVIGATION GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pb-12">
                {modules.map((mod, index) => (
                    <button 
                        key={mod.key}
                        onClick={() => router.push(`/pm/project/${project.id}?tab=${mod.key}`, { scroll: false })} 
                        className={`
                            text-left w-full group relative bg-[#0a1020]/90 backdrop-blur-xl 
                            border ${mod.border} rounded-md p-8 shadow-xl 
                            transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] 
                            ${mod.shadow} ${mod.hoverBorder}
                            flex flex-col items-center justify-center gap-6 min-h-[250px]
                        `}
                        style={{
                            animation: `fade-in-up 0.8s ease-out ${index * 0.15}s forwards`,
                            opacity: 0,
                            transform: 'translateY(20px)'
                        }}
                    >
                        {/* CSS local animation style */}
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes fade-in-up {
                                0% { opacity: 0; transform: translateY(20px); }
                                100% { opacity: 1; transform: translateY(0); }
                            }
                        `}} />

                        {/* Background Gradient Hover Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md pointer-events-none`} />
                        
                        {/* Glow effect behind image */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-${mod.glow}-500/20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />

                        {/* Module Icon Image */}
                        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 drop-shadow-2xl">
                            {/* Inner rotational aura */}
                            <div className={`absolute inset-[-10px] border border-dashed border-${mod.glow}-400/30 rounded-full animate-[spin_20s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            
                            <img 
                                src={mod.image} 
                                alt={t(mod.label)} 
                                className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        {/* Label */}
                        <h3 className={`relative z-10 text-2xl font-black uppercase tracking-widest ${mod.accent} group-hover:text-white transition-colors duration-300 drop-shadow-md text-center`}>
                            <T k={mod.label} />
                        </h3>
                        
                        {/* Interactive Arrow Indicator */}
                        <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 text-white/50 text-sm tracking-widest font-bold flex items-center gap-2">
                            ENTRER <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
