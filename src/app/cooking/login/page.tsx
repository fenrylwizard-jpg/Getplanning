'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCookingAuth } from '../CookingAuthContext';

export default function CookingLoginPage() {
    const router = useRouter();
    const { login, user } = useCookingAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect
    if (user) {
        router.push('/cooking');
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            const success = login(username, password);
            if (success) {
                router.push('/cooking');
            } else {
                setError('Identifiants incorrects. Veuillez réessayer.');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '2rem',
        }}>
            <div className="ck-glass-card ck-fade-up" style={{ maxWidth: '440px', width: '100%' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--ck-orange), var(--ck-coral))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 30px rgba(245, 138, 61, 0.3)',
                    }}>
                        🍳
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        marginBottom: '0.5rem',
                    }}>
                        Bienvenue sur{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, var(--ck-orange), var(--ck-coral))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Saveur</span>
                    </h1>
                    <p style={{ color: 'var(--ck-text-muted)', fontSize: '0.9rem' }}>
                        Connectez-vous pour accéder à vos recettes et protocoles
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--ck-text-muted)',
                            marginBottom: '0.5rem',
                        }}>
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            className="ck-input"
                            type="text"
                            placeholder="Ex: victoria"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--ck-text-muted)',
                            marginBottom: '0.5rem',
                        }}>
                            Mot de passe
                        </label>
                        <input
                            className="ck-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '1rem',
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            color: 'var(--ck-coral)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="ck-btn ck-btn-primary"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1rem',
                            marginTop: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? '⏳ Connexion...' : '🍴 Se connecter'}
                    </button>
                </form>

                {/* Decorative bottom */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)' }}>
                        🌿 Cuisinez avec confiance & plaisir
                    </p>
                </div>
            </div>
        </div>
    );
}
