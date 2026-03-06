"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Mail, Lock, Briefcase } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('SM'); // Default
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg(false);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Erreur lors de la création du compte');
                setLoading(false);
                return;
            }

            if (data.success) {
                setSuccessMsg(true);
                // Clear form
                setName('');
                setEmail('');
                setPassword('');
            }

        } catch {
            setErrorMsg('Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    if (successMsg) {
        return (
            <div className="container min-h-screen flex items-center justify-center">
                <div className="glass-panel text-center w-full max-w-[420px] px-8 py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={32} color="var(--success)" />
                    </div>
                    <h2 className="mb-2">Demande Envoyée</h2>
                    <p className="text-secondary mb-6">Votre compte a été créé avec succès, mais il est <strong>en attente d&apos;approbation</strong> par un administrateur.</p>
                    <p className="text-secondary text-sm mb-6">Vous recevrez l&apos;accès une fois que votre rôle sera validé.</p>
                    <button className="btn btn-primary w-full" onClick={() => router.push('/login')}>Retour à la Connexion</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container min-h-screen flex items-center justify-center">
            <div className="glass-panel w-full max-w-[460px]">
                <div className="text-center mb-8">
                    <h2>Créer un Compte</h2>
                    <p className="text-secondary mt-2">Rejoignez Worksite Tracker</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-center border border-red-500/20">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="form-group relative">
                        <label htmlFor="registerName" className="form-label flex items-center gap-2"><User size={16}/> Nom Complet</label>
                        <input
                            id="registerName"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="ex: Jean Dupont"
                        />
                    </div>
                    
                    <div className="form-group relative">
                        <label htmlFor="registerEmail" className="form-label flex items-center gap-2"><Mail size={16}/> Adresse e-mail</label>
                        <input
                            id="registerEmail"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="jean.dupont@chantier.com"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label htmlFor="registerPassword" className="form-label flex items-center gap-2"><Lock size={16}/> Mot de passe</label>
                            <input
                                id="registerPassword"
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="******"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registerRole" className="form-label flex items-center gap-2"><Briefcase size={16}/> Rôle Souhaité</label>
                            <select 
                                id="registerRole"
                                className="form-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                aria-label="Rôle Souhaité"
                            >
                                <option value="SM">Site Manager (SM)</option>
                                <option value="PM">Project Manager (PM)</option>
                                <option value="ADMIN">Administrateur (ADMIN)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group mt-8">
                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Création en cours...' : 'Soumettre la Demande'}
                        </button>
                    </div>

                    <div className="text-center mt-4 text-sm">
                        <span className="text-secondary">Déjà un compte ?</span>{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); router.push('/login'); }} className="text-accent-primary hover:underline">Se Connecter</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
