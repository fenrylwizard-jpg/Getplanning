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
    const isExpanded = activeTab === "overview";

    const handleTabClick = (tabKey: string) => {
        router.push(`/pm/project/${projectId}?tab=${tabKey}`, { scroll: false });
    };

    const glowColors: Record<string, string> = {
        purple: "rgba(147,51,234,0.25)",
        emerald: "rgba(16,185,129,0.25)",
        amber: "rgba(245,158,11,0.25)",
        cyan: "rgba(6,182,212,0.25)",
        rose: "rgba(244,63,94,0.25)",
        violet: "rgba(139,92,246,0.25)",
    };

    return (
        <div
            className={`
                w-full flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isExpanded
                    ? "py-6 sm:py-10"
                    : "py-0 border-b border-white/5 bg-[#070c1a]/80 backdrop-blur-md sticky top-[73px] z-50"
                }
            `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div
                    className={`
                        grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${isExpanded
                            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6"
                            : "grid-cols-6 gap-1 py-1.5"
                        }
                    `}
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabClick(tab.key)}
                                className={`
                                    group relative flex items-center overflow-hidden
                                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                                    cursor-pointer border backdrop-blur-sm
                                    ${isExpanded
                                        ? `flex-col gap-0 rounded-2xl sm:rounded-3xl
                                           ${isActive
                                                ? `bg-gradient-to-br ${tab.gradient} ${tab.border} scale-[1.02]`
                                                : `bg-[#0a1020]/80 border-white/[0.06] ${tab.bgHover} hover:scale-[1.02]`
                                           }`
                                        : `flex-row gap-2 rounded-xl px-3 py-2 justify-center
                                           ${isActive
                                                ? `bg-white/10 ${tab.border}`
                                                : `bg-transparent border-transparent ${tab.bgHover} hover:bg-white/5`
                                           }`
                                    }
                                `}
                                style={isActive && isExpanded ? {
                                    boxShadow: `0 0 40px ${glowColors[tab.glow]}, 0 20px 60px ${glowColors[tab.glow]}`
                                } : undefined}
                            >
                                {/* Custom illustration */}
                                <div
                                    className={`
                                        relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                                        ${isExpanded
                                            ? "w-full aspect-[4/3] rounded-t-2xl sm:rounded-t-3xl"
                                            : "w-7 h-7 rounded-lg flex-shrink-0"
                                        }
                                    `}
                                >
                                    <img
                                        src={tab.image}
                                        alt={t(tab.label)}
                                        className={`
                                            w-full h-full object-cover transition-all duration-500
                                            ${isExpanded
                                                ? "group-hover:scale-105"
                                                : "rounded-lg"
                                            }
                                            ${!isActive && isExpanded ? "opacity-70 group-hover:opacity-100" : ""}
                                        `}
                                    />
                                    {/* Gradient overlay on expanded cards */}
                                    {isExpanded && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1020] via-[#0a1020]/30 to-transparent" />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`
                                        font-black uppercase tracking-wider transition-all duration-500
                                        ${isExpanded
                                            ? `text-base sm:text-lg pb-5 pt-2 px-4 relative z-10 ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"}`
                                            : `text-[11px] ${isActive ? tab.accent : "text-gray-400 group-hover:text-white"}`
                                        }
                                    `}
                                >
                                    <T k={tab.label} />
                                </span>

                                {/* Active indicator — compact mode */}
                                {isActive && !isExpanded && (
                                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r ${tab.gradient}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
