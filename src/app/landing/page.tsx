"use client";

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#050a18',
            color: '#e2e8f0',
            fontFamily: "'Inter', 'Space Grotesk', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '-150px', left: '-100px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: '#22d3ee', filter: 'blur(150px)', opacity: 0.1,
            }} />
            <div style={{
                position: 'absolute', bottom: '-100px', right: '-100px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: '#a855f7', filter: 'blur(150px)', opacity: 0.1,
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
                {/* Logo */}
                <div style={{
                    fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.04em',
                    marginBottom: '1.5rem', lineHeight: 1.1,
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Get</span>Planning
                </div>

                <p style={{
                    fontSize: '1.2rem', color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.7, marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem',
                }}>
                    Plateforme SaaS de gestion de projet de construction.<br />
                    Planification, suivi terrain et analytics avancées.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                        href="https://app.getplanning.org"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '1rem 2.5rem', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                            color: '#000', fontWeight: 800, fontSize: '1rem',
                            textDecoration: 'none', transition: 'all 0.3s',
                            boxShadow: '0 0 30px rgba(34,211,238,0.2)',
                        }}
                    >
                        Accéder à l&apos;application →
                    </Link>
                    <Link
                        href="https://presentation.getplanning.org"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '1rem 2.5rem', borderRadius: '16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0', fontWeight: 700, fontSize: '1rem',
                            textDecoration: 'none', transition: 'all 0.3s',
                        }}
                    >
                        Voir la présentation
                    </Link>
                </div>

                <p style={{
                    marginTop: '5rem', fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.15)',
                }}>
                    © 2026 GetPlanning.org — Tous droits réservés
                </p>
            </div>
        </div>
    );
}
