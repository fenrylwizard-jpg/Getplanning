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
    { key: "overview", icon: LayoutDashboard, label: "hub_overview" },
    { key: "finances", icon: Euro, label: "hub_finances" },
    { key: "achats", icon: ShoppingCart, label: "hub_achats" },
    { key: "production", icon: Factory, label: "hub_production" },
    { key: "technique", icon: FolderCog, label: "hub_technique" },
    { key: "planning", icon: CalendarRange, label: "hub_planning" },
];

interface ProjectHubTabsProps {
    projectId: string;
}

export default function ProjectHubTabs({ projectId }: ProjectHubTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";

    const handleTabClick = (tabKey: string) => {
        router.push(`/pm/project/${projectId}?tab=${tabKey}`);
    };

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
                                        ? "bg-white/10 text-white shadow-[0_0_15px_rgba(147,51,234,0.15)] border border-purple-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }
                                `}
                            >
                                <Icon
                                    size={16}
                                    className={`transition-colors ${isActive ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"}`}
                                />
                                <T k={tab.label} />
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
