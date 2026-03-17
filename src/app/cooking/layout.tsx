'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
        </>
    );
}

import FloatingFairy from './components/FloatingFairy';

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
                        {children}
                    </main>
                </div>
            </div>
        </CookingAuthProvider>
    );
}
