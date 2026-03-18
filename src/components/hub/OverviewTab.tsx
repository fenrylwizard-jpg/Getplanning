"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface OverviewTabProps {
    project: {
        id: string;
        name: string;
    };
}

export default function OverviewTab({ project }: OverviewTabProps) {
    const router = useRouter();

    const navigateTo = (moduleKey: string) => {
        router.push(`/pm/project/${project.id}?tab=${moduleKey}`, { scroll: false });
    };

    return (
        <div className="bento-root">
            <style dangerouslySetInnerHTML={{__html: bentoCss}} />

            {/* KPI Banner */}
            <div className="kpi-strip">
                <div className="kpi-item">
                    <span className="kpi-label">Avancement Global</span>
                    <span className="kpi-val">75<span className="kpi-unit">%</span></span>
                    <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:'75%', background:'linear-gradient(90deg, #06b6d4, #22d3ee)'}} /></div>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Budget Consommé</span>
                    <span className="kpi-val">65<span className="kpi-unit">%</span></span>
                    <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:'65%', background:'linear-gradient(90deg, #10b981, #34d399)'}} /></div>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Tâches Actives</span>
                    <span className="kpi-val">127<span className="kpi-unit"> en cours</span></span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Prochaine Échéance</span>
                    <span className="kpi-val kpi-date">22 Nov <span className="kpi-unit">📅</span></span>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">

                {/* PRODUCTION — wide card */}
                <div className="bento-card card-production" onClick={() => navigateTo("production")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigateTo("production"); }}>
                    <div className="card-glow" style={{background: 'radial-gradient(ellipse at 70% 50%, rgba(6,182,212,0.12), transparent 70%)'}} />
                    <div className="card-body-wide">
                        <div className="card-info">
                            <h3 className="card-title" style={{color: '#22d3ee'}}>Production</h3>
                            <p className="card-sub">Suivi des phases actives du chantier</p>
                            <div className="stat-bars">
                                <div className="stat-row">
                                    <span className="stat-name">Gros Œuvre</span>
                                    <span className="stat-pct" style={{color:'#22d3ee'}}>92%</span>
                                </div>
                                <div className="progress-track"><div className="progress-fill" style={{width:'92%', background:'linear-gradient(90deg, #06b6d4, #22d3ee)'}} /></div>
                                <div className="stat-row">
                                    <span className="stat-name">Installations Électriques</span>
                                    <span className="stat-pct" style={{color:'#22d3ee'}}>12%</span>
                                </div>
                                <div className="progress-track"><div className="progress-fill" style={{width:'12%', background:'linear-gradient(90deg, #06b6d4, #22d3ee)'}} /></div>
                                <div className="stat-row">
                                    <span className="stat-name">Charpente & Toiture</span>
                                    <span className="stat-pct" style={{color:'#22d3ee'}}>45%</span>
                                </div>
                                <div className="progress-track"><div className="progress-fill" style={{width:'45%', background:'linear-gradient(90deg, #06b6d4, #22d3ee)'}} /></div>
                            </div>
                            <div className="card-action" style={{color: '#22d3ee'}}>Accéder <span className="arrow">→</span></div>
                        </div>
                        <div className="card-icon-lg">
                            <Image src="/hub-icons/production.png" alt="Production" width={200} height={200} style={{mixBlendMode:'screen', objectFit:'contain', width:'100%', height:'100%'}} />
                        </div>
                    </div>
                </div>

                {/* PLANNING — tall card */}
                <div className="bento-card card-planning" onClick={() => navigateTo("planning")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigateTo("planning"); }}>
                    <div className="card-glow" style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.15), transparent 70%)'}} />
                    <div className="card-icon-center">
                        <Image src="/hub-icons/planning.png" alt="Planning" width={180} height={180} style={{mixBlendMode:'screen', objectFit:'contain', width:'100%', height:'100%'}} />
                    </div>
                    <h3 className="card-title" style={{color: '#a78bfa'}}>Planning</h3>
                    <p className="card-sub">Prochaines échéances critiques</p>
                    <div className="timeline">
                        <div className="tl-item">
                            <div className="tl-dot" style={{background:'#f59e0b'}} />
                            <div><span className="tl-date" style={{color:'#f59e0b'}}>DEMAIN, 08:00</span><br/><span className="tl-label">Coulage de dalle B3</span></div>
                        </div>
                        <div className="tl-item">
                            <div className="tl-dot" style={{background:'#a78bfa'}} />
                            <div><span className="tl-date">15 NOV</span><br/><span className="tl-label">Inspection sécurité mensuelle</span></div>
                        </div>
                        <div className="tl-item">
                            <div className="tl-dot" style={{background:'#a78bfa'}} />
                            <div><span className="tl-date">22 NOV</span><br/><span className="tl-label">Livraison menuiseries</span></div>
                        </div>
                    </div>
                    <div className="card-action" style={{color: '#a78bfa'}}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* FINANCES */}
                <div className="bento-card card-finances" onClick={() => navigateTo("finances")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigateTo("finances"); }}>
                    <div className="card-glow" style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.12), transparent 70%)'}} />
                    <div className="card-icon-center">
                        <Image src="/hub-icons/finances.png" alt="Finances" width={160} height={160} style={{mixBlendMode:'screen', objectFit:'contain', width:'100%', height:'100%'}} />
                    </div>
                    <h3 className="card-title" style={{color: '#34d399'}}>Finances</h3>
                    <div className="big-stat">
                        <span className="big-num" style={{color:'#34d399'}}>65%</span>
                        <span className="big-label">Budget consommé</span>
                    </div>
                    <p className="stat-detail">Consommation : 1,2M€ / 1,8M€</p>
                    <div className="card-action" style={{color: '#34d399'}}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* ÉTUDES */}
                <div className="bento-card card-etudes" onClick={() => navigateTo("technique")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigateTo("technique"); }}>
                    <div className="card-glow" style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(236,72,153,0.12), transparent 70%)'}} />
                    <div className="card-icon-center">
                        <Image src="/hub-icons/technical.png" alt="Études" width={160} height={160} style={{mixBlendMode:'screen', objectFit:'contain', width:'100%', height:'100%'}} />
                    </div>
                    <h3 className="card-title" style={{color: '#f472b6'}}>Études</h3>
                    <div className="big-stat">
                        <span className="big-num" style={{color:'#f472b6'}}>42</span>
                        <span className="big-label">Plans approuvés</span>
                    </div>
                    <div className="card-action" style={{color: '#f472b6'}}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* ACHATS */}
                <div className="bento-card card-achats" onClick={() => navigateTo("achats")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigateTo("achats"); }}>
                    <div className="card-glow" style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(245,158,11,0.12), transparent 70%)'}} />
                    <div className="card-icon-center">
                        <Image src="/hub-icons/purchases.png" alt="Achats" width={160} height={160} style={{mixBlendMode:'screen', objectFit:'contain', width:'100%', height:'100%'}} />
                    </div>
                    <h3 className="card-title" style={{color: '#fbbf24'}}>Achats</h3>
                    <div className="big-stat">
                        <span className="big-num" style={{color:'#fbbf24'}}>08</span>
                        <span className="big-label">Commandes en attente</span>
                    </div>
                    <div className="card-action" style={{color: '#fbbf24'}}>Accéder <span className="arrow">→</span></div>
                </div>

            </div>
        </div>
    );
}

/* ─── All styles ─── */
const bentoCss = `
.bento-root {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
    animation: bfade 0.6s ease-out;
}
@keyframes bfade {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ── KPI Strip ── */
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
}
.kpi-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    backdrop-filter: blur(10px);
}
.kpi-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.4);
    margin-bottom: 0.4rem;
}
.kpi-val {
    font-size: 1.6rem;
    font-weight: 800;
    color: white;
}
.kpi-unit { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.4); }
.kpi-date { font-size: 1.3rem; }
.kpi-bar {
    margin-top: 0.5rem;
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    overflow: hidden;
}
.kpi-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease;
}

/* ── Bento Grid ── */
.bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto auto;
    grid-template-areas:
        "production production planning"
        "finances etudes achats";
    gap: 0.75rem;
}

/* ── Card Base ── */
.bento-card {
    position: relative;
    border-radius: 20px;
    padding: 1.75rem;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

    /* Depth & glassmorphism */
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow:
        0 4px 24px -4px rgba(0,0,0,0.5),
        0 1px 3px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.04);
}
.bento-card:hover {
    transform: translateY(-6px);
    box-shadow:
        0 12px 40px -8px rgba(0,0,0,0.6),
        0 4px 12px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    background: rgba(15, 23, 42, 0.75);
}
.bento-card:active { transform: translateY(-3px) scale(0.995); }

/* Colored border glow per card */
.card-production { border-color: rgba(6,182,212,0.2); }
.card-production:hover { border-color: rgba(6,182,212,0.4); box-shadow: 0 12px 40px -8px rgba(6,182,212,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }
.card-planning { border-color: rgba(139,92,246,0.2); }
.card-planning:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 12px 40px -8px rgba(139,92,246,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }
.card-finances { border-color: rgba(16,185,129,0.2); }
.card-finances:hover { border-color: rgba(16,185,129,0.4); box-shadow: 0 12px 40px -8px rgba(16,185,129,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }
.card-etudes { border-color: rgba(236,72,153,0.2); }
.card-etudes:hover { border-color: rgba(236,72,153,0.4); box-shadow: 0 12px 40px -8px rgba(236,72,153,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }
.card-achats { border-color: rgba(245,158,11,0.2); }
.card-achats:hover { border-color: rgba(245,158,11,0.4); box-shadow: 0 12px 40px -8px rgba(245,158,11,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }

/* Glow overlay */
.card-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 20px;
    opacity: 0.5;
    transition: opacity 0.4s ease;
}
.bento-card:hover .card-glow { opacity: 1; }

/* Grid areas */
.card-production { grid-area: production; }
.card-planning   { grid-area: planning; }
.card-finances   { grid-area: finances; }
.card-etudes     { grid-area: etudes; }
.card-achats     { grid-area: achats; }

/* ── Card Content ── */
.card-title {
    font-size: 1.15rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 0.15rem;
}
.card-sub {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.35);
    margin-bottom: 1rem;
}

/* Icons — LARGE, CENTERED, NO BORDER */
.card-icon-lg {
    width: 180px;
    height: 180px;
    flex-shrink: 0;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 0 30px rgba(255,255,255,0.06));
}
.bento-card:hover .card-icon-lg { transform: scale(1.08); }
.card-icon-center {
    width: 140px;
    height: 140px;
    margin: 0 auto 0.75rem;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 0 25px rgba(255,255,255,0.06));
}
.bento-card:hover .card-icon-center { transform: scale(1.1); }

/* Wide card layout */
.card-body-wide {
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
}
.card-info { flex: 1; min-width: 0; }

/* ── Stats ── */
.stat-bars { display: flex; flex-direction: column; gap: 0.35rem; }
.stat-row { display: flex; justify-content: space-between; align-items: baseline; }
.stat-name { font-size: 0.78rem; color: rgba(255,255,255,0.55); }
.stat-pct { font-size: 0.85rem; font-weight: 700; }
.progress-track {
    height: 5px;
    background: rgba(255,255,255,0.06);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 0.35rem;
}
.progress-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Big stat number */
.big-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem 0;
}
.big-num { font-size: 2.5rem; font-weight: 900; line-height: 1; }
.big-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
    margin-top: 0.25rem;
}
.stat-detail {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.35);
    text-align: center;
    margin-top: 0.25rem;
}

/* Timeline */
.timeline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0.5rem 0;
    padding-left: 0.25rem;
}
.tl-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}
.tl-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 0.35rem;
}
.tl-date {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.4);
}
.tl-label {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.7);
    font-weight: 500;
}

/* Action link */
.card-action {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-top: auto;
    padding-top: 1rem;
    opacity: 0.4;
    transition: all 0.3s ease;
}
.bento-card:hover .card-action { opacity: 1; }
.arrow { display: inline-block; transition: transform 0.3s ease; }
.bento-card:hover .arrow { transform: translateX(5px); }

/* ── Responsive: Tablet ── */
@media (max-width: 1024px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
            "production production"
            "planning finances"
            "etudes achats";
    }
    .card-icon-lg { width: 140px; height: 140px; }
}

/* ── Responsive: Mobile ── */
@media (max-width: 640px) {
    .bento-root { padding: 1rem 0.75rem 2rem; gap: 0.75rem; }
    .kpi-strip { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .kpi-item { padding: 0.75rem 1rem; }
    .kpi-val { font-size: 1.3rem; }
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
    .bento-card { padding: 1.25rem; border-radius: 16px; }
    .card-body-wide { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .card-icon-lg, .card-icon-center { width: 110px; height: 110px; margin: 0 auto; }
    .card-title { font-size: 1rem; }
    .big-num { font-size: 2rem; }
}
`;
