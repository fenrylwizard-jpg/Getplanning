"use client";

import { useRouter, useSearchParams } from "next/navigation";
import T from "./T";
import {
    LayoutDashboard,
    Euro,
    ShoppingCart,
    Factory,
    FolderCog,
    CalendarRange,
} from "lucide-react";

const tabs = [
    {
        key: "overview",
        icon: LayoutDashboard,
        label: "hub_overview",
        gradient: "from-purple-600 to-indigo-600",
        glow: "shadow-purple-500/20",
        iconBg: "bg-purple-500/20",
        borderActive: "border-purple-500/50",
        hoverBorder: "hover:border-purple-500/30",
        accent: "text-purple-400",
    },
    {
        key: "finances",
        icon: Euro,
        label: "hub_finances",
        gradient: "from-emerald-600 to-green-600",
        glow: "shadow-emerald-500/20",
        iconBg: "bg-emerald-500/20",
        borderActive: "border-emerald-500/50",
        hoverBorder: "hover:border-emerald-500/30",
        accent: "text-emerald-400",
    },
    {
        key: "achats",
        icon: ShoppingCart,
        label: "hub_achats",
        gradient: "from-amber-600 to-orange-600",
        glow: "shadow-amber-500/20",
        iconBg: "bg-amber-500/20",
        borderActive: "border-amber-500/50",
        hoverBorder: "hover:border-amber-500/30",
        accent: "text-amber-400",
    },
    {
        key: "production",
        icon: Factory,
        label: "hub_production",
        gradient: "from-cyan-600 to-blue-600",
        glow: "shadow-cyan-500/20",
        iconBg: "bg-cyan-500/20",
        borderActive: "border-cyan-500/50",
        hoverBorder: "hover:border-cyan-500/30",
        accent: "text-cyan-400",
    },
    {
        key: "technique",
        icon: FolderCog,
        label: "hub_technique",
        gradient: "from-rose-600 to-pink-600",
        glow: "shadow-rose-500/20",
        iconBg: "bg-rose-500/20",
        borderActive: "border-rose-500/50",
        hoverBorder: "hover:border-rose-500/30",
        accent: "text-rose-400",
    },
    {
        key: "planning",
        icon: CalendarRange,
        label: "hub_planning",
        gradient: "from-violet-600 to-fuchsia-600",
        glow: "shadow-violet-500/20",
        iconBg: "bg-violet-500/20",
        borderActive: "border-violet-500/50",
        hoverBorder: "hover:border-violet-500/30",
        accent: "text-violet-400",
    },
];

interface ProjectHubTabsProps {
    projectId: string;
    compact?: boolean;
}

export default function ProjectHubTabs({ projectId, compact }: ProjectHubTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";

    const handleTabClick = (tabKey: string) => {
        router.push(`/pm/project/${projectId}?tab=${tabKey}`);
    };

    /* ── Compact mode: slim horizontal bar when viewing tab content ── */
    if (compact) {
        return (
            <div className="w-full border-b border-white/5 bg-[#070c1a]/60 backdrop-blur-md sticky top-[73px] z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-2" aria-label="Project tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                                        whitespace-nowrap transition-all duration-200 relative group
                                        ${isActive
                                            ? `bg-white/10 text-white shadow-lg ${tab.glow} border ${tab.borderActive}`
                                            : `text-gray-400 hover:text-white hover:bg-white/5 border border-transparent ${tab.hoverBorder}`
                                        }
                                    `}
                                >
                                    <Icon
                                        size={16}
                                        className={`transition-colors ${isActive ? tab.accent : "text-gray-500 group-hover:text-gray-300"}`}
                                    />
                                    <T k={tab.label} />
                                    {isActive && (
                                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r ${tab.gradient} rounded-full`} />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        );
    }

    /* ── Full mode: large icon card grid ── */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`
                                group relative flex flex-col items-center justify-center gap-3
                                rounded-2xl p-6 sm:p-8
                                transition-all duration-300 ease-out cursor-pointer
                                border backdrop-blur-sm
                                ${isActive
                                    ? `bg-gradient-to-br ${tab.gradient} bg-opacity-20 border-white/20 shadow-2xl ${tab.glow} scale-[1.02]`
                                    : `bg-[#0a1020]/80 border-white/[0.06] ${tab.hoverBorder} hover:bg-[#0d1428]/90 hover:shadow-xl hover:scale-[1.03]`
                                }
                            `}
                        >
                            {/* Glow ring behind icon */}
                            <div className={`
                                relative flex items-center justify-center
                                w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                                transition-all duration-300
                                ${isActive
                                    ? `bg-white/20 shadow-lg ${tab.glow}`
                                    : `${tab.iconBg} group-hover:scale-110`
                                }
                            `}>
                                {/* Pulse ring on active */}
                                {isActive && (
                                    <span className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tab.gradient} opacity-30 animate-pulse`} />
                                )}
                                <Icon
                                    size={32}
                                    strokeWidth={1.5}
                                    className={`
                                        relative z-10 transition-all duration-300
                                        ${isActive
                                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                            : `${tab.accent} group-hover:scale-110`
                                        }
                                    `}
                                />
                            </div>

                            {/* Label */}
                            <span className={`
                                text-sm sm:text-base font-black uppercase tracking-wider
                                transition-colors duration-300 text-center leading-tight
                                ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}
                            `}>
                                <T k={tab.label} />
                            </span>

                            {/* Active indicator dot */}
                            {isActive && (
                                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${tab.gradient} shadow-lg ${tab.glow}`} />
                            )}

                            {/* Corner accent line */}
                            <span className={`
                                absolute top-0 right-0 w-12 h-12 rounded-tr-2xl rounded-bl-3xl
                                transition-opacity duration-300 opacity-0 group-hover:opacity-100
                                ${isActive ? "opacity-100" : ""}
                                bg-gradient-to-bl ${tab.gradient}
                            `} style={{ opacity: isActive ? 0.15 : undefined }} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
