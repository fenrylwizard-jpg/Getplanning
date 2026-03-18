"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface OverviewTabProps {
    project: {
        id: string;
        name: string;
    };
}

const modules = [
    {
        key: "production",
        label: "Production",
        subtitle: "Suivi chantier",
        image: "/hub-icons/production.png",
        accent: "#06b6d4",      // cyan
        accentLight: "rgba(6,182,212,0.15)",
        accentBorder: "rgba(6,182,212,0.3)",
        gridArea: "production",  // wide card
        stat: null as string | null,
        statLabel: null as string | null,
    },
    {
        key: "planning",
        label: "Planning",
        subtitle: "Délais & Jalons",
        image: "/hub-icons/planning.png",
        accent: "#8b5cf6",      // violet
        accentLight: "rgba(139,92,246,0.15)",
        accentBorder: "rgba(139,92,246,0.3)",
        gridArea: "planning",    // tall card
        stat: null as string | null,
        statLabel: null as string | null,
    },
    {
        key: "finances",
        label: "Finances",
        subtitle: "Coûts & Marges",
        image: "/hub-icons/finances.png",
        accent: "#10b981",      // emerald
        accentLight: "rgba(16,185,129,0.15)",
        accentBorder: "rgba(16,185,129,0.3)",
        gridArea: "finances",
        stat: null as string | null,
        statLabel: null as string | null,
    },
    {
        key: "technique",
        label: "Études",
        subtitle: "Plans & Dossiers",
        image: "/hub-icons/technical.png",
        accent: "#ec4899",      // pink
        accentLight: "rgba(236,72,153,0.15)",
        accentBorder: "rgba(236,72,153,0.3)",
        gridArea: "etudes",
        stat: null as string | null,
        statLabel: null as string | null,
    },
    {
        key: "achats",
        label: "Achats",
        subtitle: "Commandes & Flux",
        image: "/hub-icons/purchases.png",
        accent: "#f59e0b",      // amber
        accentLight: "rgba(245,158,11,0.15)",
        accentBorder: "rgba(245,158,11,0.3)",
        gridArea: "achats",
        stat: null as string | null,
        statLabel: null as string | null,
    },
];

export default function OverviewTab({ project }: OverviewTabProps) {
    const router = useRouter();

    const navigateTo = (moduleKey: string) => {
        router.push(`/pm/project/${project.id}?tab=${moduleKey}`, { scroll: false });
    };

    return (
        <div className="overview-bento-root">
            <style dangerouslySetInnerHTML={{__html: `
                .overview-bento-root {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1.5rem 1rem 3rem;
                    animation: bentofadein 0.7s ease-out;
                }
                @keyframes bentofadein {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* KPI Banner */
                .kpi-banner {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.75rem;
                }
                .kpi-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 1.25rem 1.5rem;
                    backdrop-filter: blur(12px);
                    transition: all 0.3s ease;
                }
                .kpi-card:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.12);
                }
                .kpi-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: rgba(255,255,255,0.45);
                    margin-bottom: 0.5rem;
                }
                .kpi-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: white;
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                }
                .kpi-value .unit {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.5);
                }
                .kpi-accent {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 0.25rem;
                }

                /* Bento Grid */
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: auto auto;
                    grid-template-areas:
                        "production production planning"
                        "finances etudes achats";
                    gap: 0.75rem;
                }
                .bento-card {
                    position: relative;
                    background: rgba(255,255,255,0.025);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                    padding: 1.75rem;
                    backdrop-filter: blur(16px);
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                }
                .bento-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 20px;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    pointer-events: none;
                }
                .bento-card:hover {
                    transform: translateY(-4px);
                    background: rgba(255,255,255,0.04);
                }
                .bento-card:hover::before {
                    opacity: 1;
                }
                .bento-card:active {
                    transform: translateY(-2px) scale(0.99);
                }

                /* Grid areas */
                .bento-card[data-area="production"] { grid-area: production; }
                .bento-card[data-area="planning"]   { grid-area: planning; }
                .bento-card[data-area="finances"]   { grid-area: finances; }
                .bento-card[data-area="etudes"]     { grid-area: etudes; }
                .bento-card[data-area="achats"]     { grid-area: achats; }

                /* Production: wide card — horizontal layout */
                .bento-card[data-area="production"] {
                    flex-direction: row;
                    align-items: center;
                    gap: 2rem;
                }
                .bento-card[data-area="production"] .card-content {
                    flex: 1;
                }

                /* Card inner elements */
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }
                .card-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                }
                .card-subtitle {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 1rem;
                }
                .card-icon-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    flex-shrink: 0;
                    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    filter: drop-shadow(0 0 20px rgba(255,255,255,0.05));
                }
                .bento-card:hover .card-icon-wrapper {
                    transform: scale(1.1);
                }
                .bento-card[data-area="production"] .card-icon-wrapper,
                .bento-card[data-area="planning"] .card-icon-wrapper {
                    width: 140px;
                    height: 140px;
                }

                /* Accéder link */
                .card-action {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    margin-top: auto;
                    padding-top: 1rem;
                    opacity: 0.5;
                    transition: all 0.3s ease;
                }
                .card-action-arrow {
                    display: inline-block;
                    transition: transform 0.3s ease;
                }
                .bento-card:hover .card-action {
                    opacity: 1;
                }
                .bento-card:hover .card-action-arrow {
                    transform: translateX(4px);
                }

                /* Responsive: Tablet */
                @media (max-width: 1024px) {
                    .kpi-banner {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .bento-grid {
                        grid-template-columns: repeat(2, 1fr);
                        grid-template-areas:
                            "production production"
                            "planning finances"
                            "etudes achats";
                    }
                    .bento-card[data-area="production"] .card-icon-wrapper {
                        width: 120px;
                        height: 120px;
                    }
                }

                /* Responsive: Mobile */
                @media (max-width: 640px) {
                    .overview-bento-root {
                        padding: 1rem 0.75rem 2rem;
                        gap: 1rem;
                    }
                    .kpi-banner {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.5rem;
                    }
                    .kpi-card {
                        padding: 1rem;
                    }
                    .kpi-value {
                        font-size: 1.35rem;
                    }
                    .bento-grid {
                        grid-template-columns: 1fr;
                        grid-template-areas:
                            "production"
                            "planning"
                            "finances"
                            "etudes"
                            "achats";
                        gap: 0.5rem;
                    }
                    .bento-card {
                        padding: 1.25rem;
                        border-radius: 16px;
                    }
                    .bento-card[data-area="production"] {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .card-icon-wrapper,
                    .bento-card[data-area="production"] .card-icon-wrapper,
                    .bento-card[data-area="planning"] .card-icon-wrapper {
                        width: 100px;
                        height: 100px;
                    }
                    .card-title {
                        font-size: 1rem;
                    }
                }
            `}} />

            {/* KPI Banner */}
            <div className="kpi-banner">
                <div className="kpi-card">
                    <div className="kpi-label">Avancement Global</div>
                    <div className="kpi-value">
                        —<span className="unit">%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Budget Consommé</div>
                    <div className="kpi-value">
                        —<span className="unit">%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Tâches Actives</div>
                    <div className="kpi-value">—</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Projet</div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
                        {project.name}
                    </div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">
                {modules.map((mod) => (
                    <div
                        key={mod.key}
                        className="bento-card"
                        data-area={mod.gridArea}
                        onClick={() => navigateTo(mod.key)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigateTo(mod.key); }}
                        style={{
                            borderColor: mod.accentBorder,
                        }}
                    >
                        {/* Hover glow background */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 20,
                            background: `radial-gradient(ellipse at center, ${mod.accentLight}, transparent 70%)`,
                            opacity: 0,
                            transition: 'opacity 0.4s ease',
                            pointerEvents: 'none',
                        }} className="hover-glow" />

                        {/* Icon */}
                        <div className="card-icon-wrapper">
                            <Image
                                src={mod.image}
                                alt={mod.label}
                                width={140}
                                height={140}
                                className="w-full h-full object-contain"
                                style={{ mixBlendMode: 'screen' }}
                            />
                        </div>

                        {/* Content */}
                        <div className="card-content">
                            <div className="card-header">
                                <h3 className="card-title" style={{ color: mod.accent }}>
                                    {mod.label}
                                </h3>
                            </div>
                            <p className="card-subtitle">{mod.subtitle}</p>

                            {mod.stat && (
                                <div style={{ 
                                    fontSize: '1.5rem', 
                                    fontWeight: 800, 
                                    color: 'white',
                                    marginBottom: '0.25rem'
                                }}>
                                    {mod.stat}
                                    {mod.statLabel && (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600, 
                                            color: 'rgba(255,255,255,0.4)',
                                            marginLeft: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em'
                                        }}>
                                            {mod.statLabel}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="card-action" style={{ color: mod.accent }}>
                                Accéder <span className="card-action-arrow">→</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hover glow CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                .bento-card:hover .hover-glow {
                    opacity: 1 !important;
                }
            `}} />
        </div>
    );
}
