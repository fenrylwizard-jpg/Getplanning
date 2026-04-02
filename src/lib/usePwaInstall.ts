'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    prompt(): Promise<void>;
}

interface UsePwaInstallOptions {
    /** service worker path to register */
    swPath?: string;
    /** storage key for dismissal tracking */
    storageKey?: string;
    /** cooldown in ms before reshowing the auto-banner after dismiss (default 24h) */
    dismissCooldownMs?: number;
}

interface UsePwaInstallReturn {
    /** Whether the browser supports installation (prompt available or iOS) */
    canInstall: boolean;
    /** Whether the app is already running in standalone mode */
    isStandalone: boolean;
    /** Whether the automatic one-time banner should show */
    showBanner: boolean;
    /** Whether we're on iOS (needs manual instructions) */
    isIOS: boolean;
    /** Trigger the native install prompt (Chrome/Android only) */
    handleInstall: () => Promise<void>;
    /** Dismiss the auto-banner */
    handleDismiss: () => void;
}

export function usePwaInstall(options: UsePwaInstallOptions = {}): UsePwaInstallReturn {
    const {
        swPath,
        storageKey = 'pwa-install-dismissed',
        dismissCooldownMs = 24 * 60 * 60 * 1000,
    } = options;

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);
        if (standalone) return;

        // Detect iOS
        const ua = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        // Check cooldown
        const dismissed = localStorage.getItem(storageKey);
        const withinCooldown = dismissed && (Date.now() - parseInt(dismissed, 10) < dismissCooldownMs);

        // iOS: can always "install" via share sheet
        if (isIOSDevice) {
            setCanInstall(true);
            if (!withinCooldown) {
                const timer = setTimeout(() => setShowBanner(true), 2000);
                return () => clearTimeout(timer);
            }
            return;
        }

        // Chrome / Android: listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setCanInstall(true);
            if (!withinCooldown) {
                setTimeout(() => setShowBanner(true), 1500);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [storageKey, dismissCooldownMs]);

    // Register service worker
    useEffect(() => {
        if (swPath && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register(swPath, swPath.includes('cooking') ? { scope: '/cooking' } : undefined)
                .catch(() => {/* non-critical */});
        }
    }, [swPath]);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
            setCanInstall(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        localStorage.setItem(storageKey, Date.now().toString());
    }, [storageKey]);

    return {
        canInstall,
        isStandalone,
        showBanner,
        isIOS,
        handleInstall,
        handleDismiss,
    };
}
