"use client";

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="landing-hub">
            {/* Background effects */}
            <div className="landing-aurora" />
            <div className="landing-dots" />

            <div className="landing-content">
                {/* Logo */}
                <div className="landing-logo">
                    <span className="landing-logo-gradient">Get</span>Planning
                </div>

                <p className="landing-tagline">
                    Votre portail vers nos applications
                </p>

                {/* Two Glass Cards */}
                <div className="landing-cards">
                    {/* Worksite Card */}
                    <Link href="https://app.getplanning.org" className="landing-card landing-card-worksite">
                        <div className="landing-card-glow landing-card-glow-cyan" />
                        <div className="landing-card-inner">
                            <div className="landing-card-icon-wrap">
                                <img
                                    src="/worksite-icon.png"
                                    alt="Chantiers"
                                    className="landing-card-icon"
                                />
                            </div>
                            <h2 className="landing-card-title">Chantiers</h2>
                            <p className="landing-card-desc">
                                Gestion de projet de construction, planification et suivi terrain
                            </p>
                            <div className="landing-card-arrow">
                                <span>→</span>
                            </div>
                        </div>
                    </Link>

                    {/* Cooking Card */}
                    <Link href="https://cooking.getplanning.org" className="landing-card landing-card-cooking">
                        <div className="landing-card-glow landing-card-glow-orange" />
                        <div className="landing-card-inner">
                            <div className="landing-card-icon-wrap">
                                <img
                                    src="/cooking-icon.png"
                                    alt="Cuisine"
                                    className="landing-card-icon"
                                />
                            </div>
                            <h2 className="landing-card-title">Cuisine</h2>
                            <p className="landing-card-desc">
                                Recettes, planification de repas et inspiration culinaire
                            </p>
                            <div className="landing-card-arrow">
                                <span>→</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <p className="landing-footer">
                    © 2026 GetPlanning.org — Tous droits réservés
                </p>
            </div>
        </div>
    );
}
