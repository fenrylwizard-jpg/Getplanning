'use client';

import React from 'react';
import { usePwaInstall } from '@/lib/usePwaInstall';

export default function PwaInstallPrompt() {
    const { showBanner, isStandalone, isIOS, handleInstall, handleDismiss } = usePwaInstall({
        swPath: '/cooking-sw.js',
        storageKey: 'pwa-cooking-dismissed',
    });

    // Inject the cooking manifest link
    React.useEffect(() => {
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
                            <li>Faites défiler et appuyez sur <strong>&laquo; Sur l&apos;écran d&apos;accueil &raquo;</strong></li>
                            <li>Appuyez sur <strong>&laquo; Ajouter &raquo;</strong></li>
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
