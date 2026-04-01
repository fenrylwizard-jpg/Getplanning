'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already running in standalone mode
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        if (standalone) return; // Already installed, do nothing

        // Detect iOS for manual instructions
        const ua = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Check if user dismissed the banner recently (24h cooldown)
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissTime = parseInt(dismissed, 10);
            if (Date.now() - dismissTime < 24 * 60 * 60 * 1000) return;
        }

        // For iOS, show the manual install banner after a short delay
        if (isIOSDevice) {
            const timer = setTimeout(() => setShowBanner(true), 2000);
            return () => clearTimeout(timer);
        }

        // For Android / Chrome: listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner after a short delay for better UX
            setTimeout(() => setShowBanner(true), 1500);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

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
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }, []);

    // Register the service worker on mount
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/cooking-sw.js', { scope: '/cooking' })
                .catch(() => {/* SW registration failed, non-critical */});
        }
    }, []);

    // Inject the cooking manifest link
    useEffect(() => {
        // Remove existing manifest link if it points to the worksite one
        const existingManifest = document.querySelector('link[rel="manifest"]');
        if (existingManifest) {
            existingManifest.remove();
        }
        // Add cooking-specific manifest
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/cooking-manifest.json';
        document.head.appendChild(link);

        // Also set the theme-color meta
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', '#7c3aed');

        // Apple-specific meta tags
        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        if (!appleMeta) {
            appleMeta = document.createElement('meta');
            appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
            appleMeta.setAttribute('content', 'yes');
            document.head.appendChild(appleMeta);
        }

        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.setAttribute('rel', 'apple-touch-icon');
            appleIcon.setAttribute('href', '/cooking-icon.png');
            document.head.appendChild(appleIcon);
        }

        return () => {
            link.remove();
        };
    }, []);

    if (isStandalone || !showBanner) return null;

    return (
        <div className="pwa-install-overlay" onClick={handleDismiss}>
            <div className="pwa-install-banner" onClick={(e) => e.stopPropagation()}>
                <div className="pwa-install-header">
                    <div className="pwa-install-icon">🍳</div>
                    <div className="pwa-install-info">
                        <h3 className="pwa-install-title">Installer Saveur</h3>
                        <p className="pwa-install-subtitle">
                            Accédez à vos recettes rapidement depuis votre écran d&apos;accueil
                        </p>
                    </div>
                    <button className="pwa-install-close" onClick={handleDismiss} aria-label="Fermer">
                        ✕
                    </button>
                </div>

                {isIOS ? (
                    <div className="pwa-install-ios-steps">
                        <p>Pour installer sur iOS :</p>
                        <ol>
                            <li>Appuyez sur <strong>Partager</strong> <span className="pwa-ios-icon">⬆️</span></li>
                            <li>Faites défiler et appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong></li>
                            <li>Appuyez sur <strong>« Ajouter »</strong></li>
                        </ol>
                    </div>
                ) : (
                    <div className="pwa-install-actions">
                        <button className="pwa-install-btn" onClick={handleInstall}>
                            📲 Installer l&apos;application
                        </button>
                        <button className="pwa-install-later" onClick={handleDismiss}>
                            Plus tard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
