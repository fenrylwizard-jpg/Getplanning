'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CookingAuthProvider, useCookingAuth } from './CookingAuthContext';
import { usePwaInstall } from '@/lib/usePwaInstall';
import './cooking.css';

const navItems = [
    { href: '/cooking', label: 'Accueil', icon: '🏠' },
    { href: '/cooking/protocols', label: 'Régimes', icon: '🥦' },
    { href: '/cooking/pantry', label: 'Cellier', icon: '🥫' },
    { href: '/cooking/recipes', label: 'Recettes', icon: '🍲' },
    { href: '/cooking/journal', label: 'Journal', icon: '📋' },
    { href: '/cooking/shopping', label: 'Courses', icon: '🛒' },
    { href: '/cooking/mealprep', label: 'Meal Prep', icon: '🍱' },
    { href: '/cooking/profile', label: 'Profil', icon: '👤' },
];

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/cooking/login', '/cooking/register'];

function CookingNavbar() {
    const pathname = usePathname();
    const { user, logout } = useCookingAuth();
    const isProfileActive = pathname === '/cooking/profile';
    const { canInstall, isStandalone, isIOS, handleInstall } = usePwaInstall({
        storageKey: 'pwa-cooking-dismissed',
    });
    const [showPwaHelp, setShowPwaHelp] = React.useState(false);

    const onShortcutClick = () => {
        if (canInstall && !isIOS) {
            handleInstall();
        } else {
            setShowPwaHelp(true);
        }
    };

    return (
        <>
            {/* ── Top Navbar ── */}
            <nav className="ck-navbar">
                <div className="ck-navbar-inner">
                    <Link href="/cooking" className="ck-logo">
                        <div className="ck-logo-icon">🍳</div>
                        <span className="ck-logo-text">Saveur</span>
                    </Link>
                    <div className="ck-nav-links">
                        {user && navItems.slice(1, 6).map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`ck-nav-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}

                        {/* PWA Install Button — always visible unless already installed */}
                        {!isStandalone && (
                            <button
                                onClick={onShortcutClick}
                                className="ck-pwa-shortcut-btn"
                                title="Installer l'application sur votre appareil"
                            >
                                <span className="ck-pwa-shortcut-icon">📲</span>
                                <span className="ck-pwa-shortcut-label">App Shortcut</span>
                            </button>
                        )}

                        {user ? (
                            <div className="ck-navbar-user-row">
                                <Link
                                    href="/cooking/profile"
                                    className={`ck-navbar-profile-link ${isProfileActive ? 'active' : ''}`}
                                >
                                    <span className="ck-navbar-avatar">
                                        {user.displayName[0]}
                                    </span>
                                    <span className="ck-navbar-user-name">
                                        {user.displayName}
                                    </span>
                                </Link>
                                <button
                                    onClick={logout}
                                    title="Se déconnecter"
                                    className="ck-nav-link ck-navbar-logout"
                                >
                                    🚪
                                </button>
                            </div>
                        ) : (
                            <Link href="/cooking/login" className="ck-btn ck-btn-primary ck-navbar-login-btn">
                                🍴 Connexion
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Bottom Navigation (Mobile) ── */}
            {user && (
                <div className="ck-bottom-nav">
                    <div className="ck-bottom-nav-inner">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`ck-bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* PWA Install Instructions Modal */}
            {showPwaHelp && (
                <div className="ck-pwa-help-overlay" onClick={() => setShowPwaHelp(false)}>
                    <div className="ck-pwa-help-modal" onClick={e => e.stopPropagation()}>
                        <button className="ck-pwa-help-close" onClick={() => setShowPwaHelp(false)} aria-label="Fermer">✕</button>
                        <div className="ck-pwa-help-icon">📲</div>
                        <h3 className="ck-pwa-help-title">Installer Saveur</h3>
                        <p className="ck-pwa-help-desc">Ajoutez Saveur à votre écran d&apos;accueil pour y accéder comme une app !</p>
                        {isIOS ? (
                            <ol className="ck-pwa-help-steps">
                                <li>Appuyez sur le bouton <strong>Partager</strong> <span>⬆️</span></li>
                                <li>Faites défiler et appuyez sur <strong>&laquo; Sur l&apos;écran d&apos;accueil &raquo;</strong></li>
                                <li>Appuyez sur <strong>&laquo; Ajouter &raquo;</strong></li>
                            </ol>
                        ) : (
                            <ol className="ck-pwa-help-steps">
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

import FloatingFairy from './components/FloatingFairy';
import PwaInstallPrompt from './components/PwaInstallPrompt';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useCookingAuth();

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route);

    // If not logged in and not on a public route, redirect to login
    if (!user && !isPublicRoute) {
        // Use setTimeout to avoid React render-during-render
        if (typeof window !== 'undefined') {
            setTimeout(() => router.push('/cooking/login'), 0);
        }
        return (
            <div className="ck-auth-guard">
                <div className="ck-auth-guard-icon">🔒</div>
                <p className="ck-auth-guard-text">Redirection vers la page de connexion...</p>
            </div>
        );
    }

    return <>{children}</>;
}

export default function CookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CookingAuthProvider>
            <div className="ck-app">
                <div className="ck-content">
                    <CookingNavbar />
                    <FloatingFairy />
                    <PwaInstallPrompt />
                    <main className="ck-main-padded">
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                    </main>
                </div>
            </div>
        </CookingAuthProvider>
    );
}
