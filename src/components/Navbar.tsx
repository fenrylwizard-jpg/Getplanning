"use client";

import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import T from "./T";
import AvatarDisplay from "./AvatarDisplay";
import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon, Settings, Download } from "lucide-react";
import SettingsModal from "./SettingsModal";
import { useState, useEffect } from "react";
import { usePwaInstall } from "@/lib/usePwaInstall";

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { canInstall, isStandalone, showBanner, isIOS, handleInstall, handleDismiss } = usePwaInstall({
        swPath: '/worksite-sw.js',
        storageKey: 'pwa-worksite-dismissed',
    });
    const [showPwaHelp, setShowPwaHelp] = useState(false);

    // Inject the worksite manifest + apple meta tags (same pattern as cooking app)
    useEffect(() => {
        // Remove existing manifest link (Next.js may have set one from metadata)
        const existingManifest = document.querySelector('link[rel="manifest"]');
        if (existingManifest) {
            existingManifest.remove();
        }
        // Add worksite-specific manifest
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/manifest.json';
        document.head.appendChild(link);

        // Set theme-color meta
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', '#1a0533');

        // Apple-specific: make it installable as a web app
        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        if (!appleMeta) {
            appleMeta = document.createElement('meta');
            appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
            appleMeta.setAttribute('content', 'yes');
            document.head.appendChild(appleMeta);
        }

        let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleStatusBar) {
            appleStatusBar = document.createElement('meta');
            appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
            appleStatusBar.setAttribute('content', 'black-translucent');
            document.head.appendChild(appleStatusBar);
        }

        // Apple touch icon — the beautiful hardhat icon
        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.setAttribute('rel', 'apple-touch-icon');
            appleIcon.setAttribute('href', '/apple-touch-icon.png');
            document.head.appendChild(appleIcon);
        }

        return () => {
            link.remove();
        };
    }, []);

    const onShortcutClick = () => {
        if (canInstall && !isIOS) {
            handleInstall();
        } else {
            setShowPwaHelp(true);
        }
    };

    useEffect(() => {
        // Send heartbeat every 1.5 minutes if logged in
        if (userName) {
            const sendHeartbeat = () => {
                fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
            };
            sendHeartbeat();
            const interval = setInterval(sendHeartbeat, 90000);
            return () => clearInterval(interval);
        }
    }, [userName]);

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
        <>
            <nav className="sticky top-0 z-[100] w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                        title="Go Back"
                    >
                        <span className="material-symbols-outlined text-white/70 group-hover:text-white transition-colors">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">
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
                        className="flex items-center justify-center w-10 h-10 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                    >
                        {theme === 'dark' ? (
                            <Sun size={18} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon size={18} className="text-indigo-400 group-hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* PWA Install Button — always visible unless already installed */}
                    {!isStandalone && (
                        <button
                            onClick={onShortcutClick}
                            className="pwa-shortcut-btn flex items-center gap-2 h-10 px-4 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-400/50 hover:from-cyan-500/30 hover:to-purple-500/30 text-white text-xs font-bold tracking-wide transition-all group"
                            title="Installer l'application sur votre appareil"
                        >
                            <Download size={14} className="text-cyan-400 group-hover:translate-y-[2px] transition-transform duration-300" />
                            <span className="hidden sm:inline">App Shortcut</span>
                            <span className="sm:hidden">📲</span>
                        </button>
                    )}
                    
                    {userName && (
                        <div className="flex items-center gap-4 pl-4 sm:pl-8 border-l border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-sm font-bold text-white tracking-tight">{userName}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                                        <T k={userRole || "dashboard"} />
                                    </span>
                                </div>
                                <AvatarDisplay 
                                    characterId={characterId || 1} 
                                    level={level || 1} 
                                    size={40} 
                                    showLevel={false}
                                />
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <button 
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                                    title="Paramètres du compte"
                                >
                                    <Settings size={18} className="text-white/70 group-hover:text-white transition-colors group-hover:rotate-90 duration-300" />
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
                                    title="Déconnexion"
                                >
                                    <span className="material-symbols-outlined text-red-400 group-hover:text-red-300 transition-colors text-[20px]">logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <SettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                />
            </nav>

            {/* One-time PWA Install Banner */}
            {showBanner && !isStandalone && (
                <div className="pwa-ws-banner" onClick={handleDismiss}>
                    <div className="pwa-ws-banner-inner" onClick={(e) => e.stopPropagation()}>
                        <div className="pwa-ws-banner-icon">📲</div>
                        <div className="pwa-ws-banner-text">
                            <strong>Installer GetPlanning</strong>
                            <span>Accédez rapidement depuis votre écran d&apos;accueil</span>
                        </div>
                        {isIOS ? (
                            <div className="pwa-ws-banner-ios">
                                Appuyez sur <strong>Partager ⬆️</strong> puis <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
                            </div>
                        ) : (
                            <button className="pwa-ws-banner-install" onClick={handleInstall}>
                                Installer
                            </button>
                        )}
                        <button className="pwa-ws-banner-close" onClick={handleDismiss} aria-label="Fermer">✕</button>
                    </div>
                </div>
            )}

            {/* PWA Install Instructions Modal */}
            {showPwaHelp && (
                <div className="pwa-ws-help-overlay" onClick={() => setShowPwaHelp(false)}>
                    <div className="pwa-ws-help-modal" onClick={e => e.stopPropagation()}>
                        <button className="pwa-ws-help-close" onClick={() => setShowPwaHelp(false)} aria-label="Fermer">✕</button>
                        <div className="pwa-ws-help-icon">📲</div>
                        <h3 className="pwa-ws-help-title">Installer GetPlanning</h3>
                        <p className="pwa-ws-help-desc">Ajoutez GetPlanning à votre écran d&apos;accueil pour y accéder comme une app !</p>
                        {isIOS ? (
                            <ol className="pwa-ws-help-steps">
                                <li>Appuyez sur le bouton <strong>Partager</strong> <span>⬆️</span></li>
                                <li>Faites défiler et appuyez sur <strong>&laquo; Sur l&apos;écran d&apos;accueil &raquo;</strong></li>
                                <li>Appuyez sur <strong>&laquo; Ajouter &raquo;</strong></li>
                            </ol>
                        ) : (
                            <ol className="pwa-ws-help-steps">
                                <li>Ouvrez le menu de votre navigateur <strong>⋮</strong></li>
                                <li>Appuyez sur <strong>&laquo; Installer l&apos;application &raquo;</strong> ou <strong>&laquo; Ajouter à l&apos;écran d&apos;accueil &raquo;</strong></li>
                                <li>Confirmez l&apos;installation</li>
                            </ol>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
