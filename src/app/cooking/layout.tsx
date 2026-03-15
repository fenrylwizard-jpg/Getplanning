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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                                <Link href="/cooking/profile" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.75rem',
                                    background: pathname === '/cooking/profile' ? 'var(--ck-rose)' : 'rgba(245, 138, 61, 0.08)',
                                    color: pathname === '/cooking/profile' ? 'white' : 'inherit',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: pathname === '/cooking/profile' ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, var(--ck-rose), var(--ck-coral))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        color: 'white',
                                        fontWeight: 800,
                                    }}>
                                        {user.displayName[0]}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: pathname === '/cooking/profile' ? 'white' : 'var(--ck-text)' }}>
                                        {user.displayName}
                                    </span>
                                </Link>
                                <button
                                    onClick={logout}
                                    title="Se déconnecter"
                                    className="ck-nav-link"
                                    style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                                >
                                    🚪
                                </button>
                            </div>
                        ) : (
                            <Link href="/cooking/login" className="ck-btn ck-btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
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
                    <main style={{ paddingBottom: '5rem' }}>
                        {children}
                    </main>
                </div>
            </div>
        </CookingAuthProvider>
    );
}
