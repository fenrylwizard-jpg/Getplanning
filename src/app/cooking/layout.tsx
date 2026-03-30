'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CookingAuthProvider, useCookingAuth } from './CookingAuthContext';
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
        </>
    );
}

import FloatingFairy from './components/FloatingFairy';

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
