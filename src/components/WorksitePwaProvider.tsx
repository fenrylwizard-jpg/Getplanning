'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────
const DISMISS_KEY = 'pwa-worksite-dismissed';
const DISMISS_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

/**
 * WorksitePwaProvider
 * 
 * Always-on component mounted in the ROOT layout.
 * Handles everything needed for a proper PWA experience:
 *  1. Service worker registration
 *  2. Manifest link injection (overrides Next.js metadata)
 *  3. Apple meta tag injection
 *  4. "Add to Home Screen" install popup
 * 
 * Skips all logic when on /cooking routes (cooking has its own PWA).
 */
export default function WorksitePwaProvider() {
    const pathname = usePathname();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Skip on cooking routes — cooking has its own PWA provider
    const isCookingRoute = pathname?.startsWith('/cooking');

    // ─── 1. Inject manifest + meta tags ────────────────────────────
    useEffect(() => {
        if (isCookingRoute) return;

        // Remove any existing manifest link (from Next.js metadata or previous injection)
        const existingManifest = document.querySelector('link[rel="manifest"]');
        if (existingManifest) existingManifest.remove();

        // Inject fresh manifest link
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);

        // Theme color
        let themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeMeta);
        }
        themeMeta.setAttribute('content', '#1a0533');

        // Apple: web app capable
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const m = document.createElement('meta');
            m.setAttribute('name', 'apple-mobile-web-app-capable');
            m.setAttribute('content', 'yes');
            document.head.appendChild(m);
        }

        // Apple: status bar style
        if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
            const m = document.createElement('meta');
            m.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
            m.setAttribute('content', 'black-translucent');
            document.head.appendChild(m);
        }

        // Apple: app title
        if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            const m = document.createElement('meta');
            m.setAttribute('name', 'apple-mobile-web-app-title');
            m.setAttribute('content', 'GetPlanning');
            document.head.appendChild(m);
        }

        // Apple: touch icon
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const link = document.createElement('link');
            link.setAttribute('rel', 'apple-touch-icon');
            link.setAttribute('href', '/apple-touch-icon.png');
            document.head.appendChild(link);
        }

        return () => {
            manifestLink.remove();
        };
    }, [isCookingRoute]);

    // ─── 2. Register service worker ────────────────────────────────
    useEffect(() => {
        if (isCookingRoute) return;
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/worksite-sw.js', { scope: '/' })
            .catch(() => { /* non-critical */ });
    }, [isCookingRoute]);

    // ─── 3. Detect standalone + iOS + install prompt ───────────────
    useEffect(() => {
        if (isCookingRoute) return;

        // Already in standalone mode?
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);
        if (standalone) return;

        // iOS detection
        const ua = navigator.userAgent;
        const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
        setIsIOS(iosDevice);

        // Check dismiss cooldown
        const dismissed = localStorage.getItem(DISMISS_KEY);
        const inCooldown = dismissed && (Date.now() - parseInt(dismissed, 10) < DISMISS_COOLDOWN);

        if (iosDevice) {
            if (!inCooldown) {
                const t = setTimeout(() => setShowBanner(true), 2500);
                return () => clearTimeout(t);
            }
            return;
        }

        // Chrome/Android: listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            if (!inCooldown) {
                setTimeout(() => setShowBanner(true), 2000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isCookingRoute]);

    // ─── Handlers ──────────────────────────────────────────────────
    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    // ─── Don't render anything if cooking, standalone, or no banner ─
    if (isCookingRoute || isStandalone || !showBanner) return null;

    // ─── Render the install popup ──────────────────────────────────
    return (
        <div className="pwa-ws-install-overlay" onClick={handleDismiss}>
            <div className="pwa-ws-install-banner" onClick={(e) => e.stopPropagation()}>
                <div className="pwa-ws-install-header">
                    <div className="pwa-ws-install-icon-box">
                        <img 
                            src="/icon-192.png" 
                            alt="GetPlanning" 
                            width={48} 
                            height={48} 
                            style={{ borderRadius: 12 }} 
                        />
                    </div>
                    <div className="pwa-ws-install-info">
                        <h3 className="pwa-ws-install-title">Installer GetPlanning</h3>
                        <p className="pwa-ws-install-subtitle">
                            Accédez à vos chantiers rapidement depuis votre écran d&apos;accueil
                        </p>
                    </div>
                    <button 
                        className="pwa-ws-install-close" 
                        onClick={handleDismiss} 
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                {isIOS ? (
                    <div className="pwa-ws-install-ios">
                        <p>Pour installer sur iOS :</p>
                        <ol>
                            <li>
                                Appuyez sur <strong>Partager</strong>{' '}
                                <span>⬆️</span>
                            </li>
                            <li>
                                Faites défiler et appuyez sur{' '}
                                <strong>&laquo; Sur l&apos;écran d&apos;accueil &raquo;</strong>
                            </li>
                            <li>
                                Appuyez sur <strong>&laquo; Ajouter &raquo;</strong>
                            </li>
                        </ol>
                    </div>
                ) : (
                    <div className="pwa-ws-install-actions">
                        <button className="pwa-ws-install-btn" onClick={handleInstall}>
                            📲 Installer l&apos;application
                        </button>
                        <button className="pwa-ws-install-later" onClick={handleDismiss}>
                            Plus tard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
