'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCookingAuth } from '../CookingAuthContext';

export default function CookingLoginPage() {
    const router = useRouter();
    const { login, user } = useCookingAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="ck-auth-container">
            <div className="ck-glass-card ck-fade-up ck-auth-card">
                {/* Logo */}
                <div className="ck-auth-header">
                    <div className="ck-auth-logo">🍳</div>
                    <h1 className="ck-auth-title">
                        Bienvenue sur{' '}
                        <span className="ck-auth-brand">Saveur</span>
                    </h1>
                    <p className="ck-auth-subtitle">
                        Connectez-vous pour accéder à vos recettes et protocoles
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="ck-auth-form">
                    <div>
                        <label className="ck-auth-label">
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
                        <label className="ck-auth-label">
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
                        <div className="ck-auth-error">
                            ❌ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="ck-btn ck-btn-primary ck-auth-submit"
                        disabled={loading}
                    >
                        {loading ? '⏳ Connexion...' : '🍴 Se connecter'}
                    </button>
                </form>

                {/* Link to register */}
                <div className="ck-auth-footer">
                    <p>
                        Pas encore de compte ?{' '}
                        <Link href="/cooking/register" className="ck-auth-link">
                            Créer un compte ✨
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
