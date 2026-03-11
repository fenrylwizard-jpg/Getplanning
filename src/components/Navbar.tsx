"use client";

import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import T from "./T";
import AvatarDisplay from "./AvatarDisplay";
import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface NavbarProps {
    userName?: string;
    userRole?: string;
    characterId?: number;
    level?: number;
    xp?: number;
    company?: string;
}

export default function Navbar({ userName, userRole, characterId, level, company }: NavbarProps) {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const brandName = company || 'GetPlanning';

    return (
        <nav className="sticky top-0 z-[100] w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    title="Go Back"
                >
                    <span className="material-symbols-outlined text-white/70 group-hover:text-white transition-colors">arrow_back</span>
                </button>
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">
                        {brandName.charAt(0)}
                    </div>
                    <span className="hidden sm:inline-block text-2xl font-black tracking-tighter text-white drop-shadow-md">
                        {brandName} <span className="text-purple-400 font-light">Management</span>
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-8">
                <LanguageSwitcher />
                
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                >
                    {theme === 'dark' ? (
                        <Sun size={18} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                    ) : (
                        <Moon size={18} className="text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
                    )}
                </button>
                
                {userName && (
                    <div className="flex items-center gap-4 pl-4 sm:pl-8 border-l border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-bold text-white tracking-tight">{userName}</span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                                    <T k={userRole || "dashboard"} />
                                </span>
                            </div>
                            <div className="p-0.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
                                <AvatarDisplay 
                                    characterId={characterId || 1} 
                                    level={level || 1} 
                                    size={40} 
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group ml-2"
                            title="Logout"
                        >
                            <span className="material-symbols-outlined text-red-400 group-hover:text-red-300 transition-colors text-[20px]">logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
