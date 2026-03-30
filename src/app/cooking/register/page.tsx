'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCookingAuth } from '../CookingAuthContext';

export default function CookingRegisterPage() {
    const router = useRouter();
    const { register, user } = useCookingAuth();
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) {
        router.push('/cooking');
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const result = register(username, displayName, password);
            if (result.success) {
                router.push('/cooking');
            } else {
                setError(result.error || 'Erreur lors de l\'inscription.');
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
                        Rejoindre{' '}
                        <span className="ck-auth-brand">Saveur</span>
                    </h1>
                    <p className="ck-auth-subtitle">
                        Créez votre compte pour accéder aux recettes et protocoles
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="ck-auth-form">
                    <div>
                        <label className="ck-auth-label">
                            Nom d&apos;affichage
                        </label>
                        <input
                            className="ck-input"
                            type="text"
                            placeholder="Ex: Marie Dupont"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="ck-auth-label">
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            className="ck-input"
                            type="text"
                            placeholder="Ex: marie"
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
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div>
                        <label className="ck-auth-label">
                            Confirmer le mot de passe
                        </label>
                        <input
                            className="ck-input"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
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
                        {loading ? '⏳ Inscription...' : '✨ Créer mon compte'}
                    </button>
                </form>

                {/* Link to login */}
                <div className="ck-auth-footer">
                    <p>
                        Déjà un compte ?{' '}
                        <Link href="/cooking/login" className="ck-auth-link">
                            Se connecter 🔑
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
