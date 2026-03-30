"use client";

import { useRouter } from "next/navigation";
import T from "./T";
import { useTranslation } from "@/lib/LanguageContext";

const tabs = [
    {
        key: "overview",
        label: "hub_overview",
        image: "/hub-icons/overview.png",
        gradient: "from-purple-600/40 to-indigo-600/40",
        border: "border-purple-500/40",
        glow: "purple",
        accent: "text-purple-400",
        bgHover: "hover:border-purple-500/40",
    },
    {
        key: "finances",
        label: "hub_finances",
        image: "/hub-icons/finances.png",
        gradient: "from-emerald-600/40 to-green-600/40",
        border: "border-emerald-500/40",
        glow: "emerald",
        accent: "text-emerald-400",
        bgHover: "hover:border-emerald-500/40",
    },
    {
        key: "achats",
        label: "hub_achats",
        image: "/hub-icons/purchases.png",
        gradient: "from-amber-600/40 to-orange-600/40",
        border: "border-amber-500/40",
        glow: "amber",
        accent: "text-amber-400",
        bgHover: "hover:border-amber-500/40",
    },
    {
        key: "production",
        label: "hub_production",
        image: "/hub-icons/production.png",
        gradient: "from-cyan-600/40 to-blue-600/40",
        border: "border-cyan-500/40",
        glow: "cyan",
        accent: "text-cyan-400",
        bgHover: "hover:border-cyan-500/40",
    },
    {
        key: "technique",
        label: "hub_technique",
        image: "/hub-icons/technical.png",
        gradient: "from-rose-600/40 to-pink-600/40",
        border: "border-rose-500/40",
        glow: "rose",
        accent: "text-rose-400",
        bgHover: "hover:border-rose-500/40",
    },
    {
        key: "planning",
        label: "hub_planning",
        image: "/hub-icons/planning.png",
        gradient: "from-violet-600/40 to-fuchsia-600/40",
        border: "border-violet-500/40",
        glow: "violet",
        accent: "text-violet-400",
        bgHover: "hover:border-violet-500/40",
    },
];

interface ProjectHubTabsProps {
    projectId: string;
    activeTab: string;
}

export default function ProjectHubTabs({ projectId, activeTab }: ProjectHubTabsProps) {
    const router = useRouter();
    const { t } = useTranslation();

    const handleTabClick = (tabKey: string) => {
        router.push(`/pm/project/${projectId}?tab=${tabKey}`, { scroll: false });
    };

    return (
        <div className="w-full flex justify-center py-0 border-b border-white/5 bg-[#070c1a]/80 backdrop-blur-md sticky top-[73px] z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 py-1.5 w-full">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabClick(tab.key)}
                                className={`
                                    group relative flex items-center overflow-hidden
                                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                    cursor-pointer border backdrop-blur-sm
                                    flex-row gap-2 rounded-md px-2 py-2 sm:px-3 sm:py-2 justify-center
                                    ${isActive
                                        ? `bg-white/10 ${tab.border}`
                                        : `bg-transparent border-transparent ${tab.bgHover} hover:bg-white/5 hover:scale-105`
                                    }
                                `}
                            >
                                {/* Compact Icon */}
                                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-sm flex-shrink-0 opacity-100 transition-opacity">
                                    <img
                                        src={tab.image}
                                        alt={t(tab.label)}
                                        className="w-full h-full object-cover rounded-sm"
                                    />
                                </div>

                                {/* Label */}
                                <span
                                    className={`
                                        font-black uppercase tracking-wider transition-all duration-300
                                        text-[9px] sm:text-[11px] truncate max-w-[80px] sm:max-w-none
                                        ${isActive ? tab.accent : "text-gray-400 group-hover:text-white"}
                                    `}
                                >
                                    <T k={tab.label} />
                                </span>

                                {/* Active indicator */}
                                {isActive && (
                                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-gradient-to-r ${tab.gradient}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
