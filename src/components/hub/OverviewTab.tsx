"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

interface OverviewTabProps {
    project: {
        id: string;
        name: string;
    };
}

interface OverviewData {
    kpis: {
        avancementGlobal: number;
        budgetConsomme: number | null;
        tachesActives: number;
        prochaineEcheance: { name: string; date: string } | null;
    };
    productionTop5: Array<{ category: string; progress: number; totalHours: number }>;
    finances: {
        result: number | null;
        marginPercent: number | null;
        totalRevenue: number | null;
        totalCost: number | null;
    } | null;
    etudes: {
        totalDocs: number;
        approved: number;
        approvedWithRemarks: number;
        approvedPct: number;
    };
    achats: {
        totalBudget: number;
        totalNegotiated: number;
        totalReturn: number;
    };
}

function formatEuros(val: number | null | undefined): string {
    if (val == null) return "—";
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M€`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k€`;
    return `${val.toFixed(0)}€`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function OverviewTab({ project }: OverviewTabProps) {
    const router = useRouter();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/project/${project.id}/overview`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [project.id]);

    const navigateTo = (moduleKey: string) => {
        router.push(`/pm/project/${project.id}?tab=${moduleKey}`, { scroll: false });
    };

    const kpis = data?.kpis;
    const prod = data?.productionTop5 || [];
    const fin = data?.finances;
    const etu = data?.etudes;
    const ach = data?.achats;

    return (
        <div className="bento-root">
            <style dangerouslySetInnerHTML={{ __html: BENTO_CSS }} />

            {/* ── KPI Banner ── */}
            <div className="kpi-strip">
                <div className="kpi-item">
                    <span className="kpi-label">Avancement Global</span>
                    <span className="kpi-val">{loading ? "—" : `${kpis?.avancementGlobal ?? 0}`}<span className="kpi-unit">%</span></span>
                    {!loading && <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${kpis?.avancementGlobal ?? 0}%`, background: 'linear-gradient(90deg, #06b6d4, #22d3ee)' }} /></div>}
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Budget Consommé</span>
                    <span className="kpi-val">{loading ? "—" : kpis?.budgetConsomme != null ? `${kpis.budgetConsomme}` : "—"}<span className="kpi-unit">{kpis?.budgetConsomme != null ? "%" : ""}</span></span>
                    {!loading && kpis?.budgetConsomme != null && <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${Math.min(kpis.budgetConsomme, 100)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} /></div>}
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Tâches Actives</span>
                    <span className="kpi-val">{loading ? "—" : kpis?.tachesActives ?? 0}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Prochaine Échéance</span>
                    {kpis?.prochaineEcheance ? (
                        <>
                            <span className="kpi-val kpi-date">{formatDate(kpis.prochaineEcheance.date)}</span>
                            <span className="kpi-sub">{kpis.prochaineEcheance.name}</span>
                        </>
                    ) : (
                        <span className="kpi-val kpi-date">{loading ? "—" : "—"}</span>
                    )}
                </div>
            </div>

            {/* ── Bento Grid ── */}
            <div className="bento-grid">

                {/* PRODUCTION — wide card */}
                <div className="bento-card card-production" onClick={() => navigateTo("production")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") navigateTo("production"); }}>
                    <div className="card-glow" style={{ background: "radial-gradient(ellipse at 80% 40%, rgba(6,182,212,0.12), transparent 70%)" }} />
                    <div className="card-body-wide">
                        <div className="card-info">
                            <h3 className="card-title" style={{ color: "#22d3ee" }}>Production</h3>
                            <p className="card-sub">Avancement par catégorie</p>
                            <div className="stat-bars">
                                {prod.length > 0 ? prod.map((cat, i) => (
                                    <div key={i}>
                                        <div className="stat-row">
                                            <span className="stat-name">{cat.category}</span>
                                            <span className="stat-pct" style={{ color: "#22d3ee" }}>{cat.progress}%</span>
                                        </div>
                                        <div className="progress-track"><div className="progress-fill" style={{ width: `${cat.progress}%`, background: "linear-gradient(90deg, #06b6d4, #22d3ee)" }} /></div>
                                    </div>
                                )) : (
                                    <p className="no-data">Aucune tâche importée</p>
                                )}
                            </div>
                            <div className="card-action" style={{ color: "#22d3ee" }}>Accéder <span className="arrow">→</span></div>
                        </div>
                        <div className="icon-glass icon-glass-lg">
                            <Image src="/hub-icons/production.png?v=2" alt="Production" width={200} height={200} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                        </div>
                    </div>
                </div>

                {/* PLANNING — tall card */}
                <div className="bento-card card-planning" onClick={() => navigateTo("planning")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") navigateTo("planning"); }}>
                    <div className="card-glow" style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.15), transparent 70%)" }} />
                    <div className="icon-glass icon-glass-center">
                        <Image src="/hub-icons/planning.png?v=2" alt="Planning" width={180} height={180} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                    </div>
                    <h3 className="card-title" style={{ color: "#a78bfa", textAlign: "center" }}>Planning</h3>
                    <p className="card-sub" style={{ textAlign: "center" }}>Prochaines échéances</p>
                    {kpis?.prochaineEcheance ? (
                        <div className="timeline">
                            <div className="tl-item">
                                <div className="tl-dot" style={{ background: "#a78bfa" }} />
                                <div>
                                    <span className="tl-date">{formatDate(kpis.prochaineEcheance.date)}</span><br />
                                    <span className="tl-label">{kpis.prochaineEcheance.name}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="no-data" style={{ textAlign: "center" }}>Module en cours de développement</p>
                    )}
                    <div className="card-action" style={{ color: "#a78bfa", justifyContent: "center" }}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* FINANCES */}
                <div className="bento-card card-finances" onClick={() => navigateTo("finances")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") navigateTo("finances"); }}>
                    <div className="card-glow" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.12), transparent 70%)" }} />
                    <div className="icon-glass icon-glass-center">
                        <Image src="/hub-icons/finances.png?v=2" alt="Finances" width={160} height={160} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                    </div>
                    <h3 className="card-title" style={{ color: "#34d399", textAlign: "center" }}>Finances</h3>
                    {fin ? (
                        <div className="big-stat">
                            <span className="big-num" style={{ color: (fin.marginPercent ?? 0) >= 0 ? "#34d399" : "#f87171" }}>
                                {fin.marginPercent != null ? `${fin.marginPercent.toFixed(1)}%` : "—"}
                            </span>
                            <span className="big-label">Marge du projet</span>
                            <span className="stat-detail">Résultat : {formatEuros(fin.result)}</span>
                            <span className="stat-detail">Revenu : {formatEuros(fin.totalRevenue)} | Coûts : {formatEuros(fin.totalCost)}</span>
                        </div>
                    ) : (
                        <p className="no-data" style={{ textAlign: "center" }}>Aucune donnée financière</p>
                    )}
                    <div className="card-action" style={{ color: "#34d399", justifyContent: "center" }}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* ÉTUDES */}
                <div className="bento-card card-etudes" onClick={() => navigateTo("technique")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") navigateTo("technique"); }}>
                    <div className="card-glow" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(236,72,153,0.12), transparent 70%)" }} />
                    <div className="icon-glass icon-glass-center">
                        <Image src="/hub-icons/technical.png?v=2" alt="Études" width={160} height={160} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                    </div>
                    <h3 className="card-title" style={{ color: "#f472b6", textAlign: "center" }}>Études</h3>
                    {etu && etu.totalDocs > 0 ? (
                        <div className="big-stat">
                            <span className="big-num" style={{ color: "#f472b6" }}>{etu.approvedPct}%</span>
                            <span className="big-label">Documents approuvés</span>
                            <span className="stat-detail">{etu.approved} APP + {etu.approvedWithRemarks} BPE / {etu.totalDocs} total</span>
                        </div>
                    ) : (
                        <p className="no-data" style={{ textAlign: "center" }}>Aucun document importé</p>
                    )}
                    <div className="card-action" style={{ color: "#f472b6", justifyContent: "center" }}>Accéder <span className="arrow">→</span></div>
                </div>

                {/* ACHATS */}
                <div className="bento-card card-achats" onClick={() => navigateTo("achats")} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") navigateTo("achats"); }}>
                    <div className="card-glow" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.12), transparent 70%)" }} />
                    <div className="icon-glass icon-glass-center">
                        <Image src="/hub-icons/purchases.png?v=2" alt="Achats" width={160} height={160} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                    </div>
                    <h3 className="card-title" style={{ color: "#fbbf24", textAlign: "center" }}>Achats</h3>
                    {ach && ach.totalBudget > 0 ? (
                        <div className="big-stat">
                            <span className="big-num" style={{ color: "#fbbf24" }}>{formatEuros(ach.totalReturn)}</span>
                            <span className="big-label">Marge achats dégagée</span>
                            <span className="stat-detail">Budget : {formatEuros(ach.totalBudget)} | Négocié : {formatEuros(ach.totalNegotiated)}</span>
                        </div>
                    ) : (
                        <p className="no-data" style={{ textAlign: "center" }}>Aucune donnée d&apos;achats</p>
                    )}
                    <div className="card-action" style={{ color: "#fbbf24", justifyContent: "center" }}>Accéder <span className="arrow">→</span></div>
                </div>
            </div>
        </div>
    );
}

/* ─── All Styles ─── */
const BENTO_CSS = `
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
.kpi-val { font-size: 1.6rem; font-weight: 800; color: white; }
.kpi-unit { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.4); }
.kpi-date { font-size: 1.3rem; }
.kpi-sub { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 0.15rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kpi-bar { margin-top: 0.5rem; height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.kpi-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }

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
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 4px 24px -4px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
}
.bento-card:hover {
    transform: translateY(-6px);
    border-color: rgba(255,255,255,0.12);
    background: rgba(15, 23, 42, 0.8);
}
.bento-card:active { transform: translateY(-3px) scale(0.995); }

/* Per-card colored hover shadows */
.card-production { border-color: rgba(6,182,212,0.2); }
.card-production:hover { border-color: rgba(6,182,212,0.4); box-shadow: 0 12px 48px -8px rgba(6,182,212,0.15), 0 4px 12px rgba(0,0,0,0.4); }
.card-planning { border-color: rgba(139,92,246,0.2); }
.card-planning:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 12px 48px -8px rgba(139,92,246,0.15), 0 4px 12px rgba(0,0,0,0.4); }
.card-finances { border-color: rgba(16,185,129,0.2); }
.card-finances:hover { border-color: rgba(16,185,129,0.4); box-shadow: 0 12px 48px -8px rgba(16,185,129,0.15), 0 4px 12px rgba(0,0,0,0.4); }
.card-etudes { border-color: rgba(236,72,153,0.2); }
.card-etudes:hover { border-color: rgba(236,72,153,0.4); box-shadow: 0 12px 48px -8px rgba(236,72,153,0.15), 0 4px 12px rgba(0,0,0,0.4); }
.card-achats { border-color: rgba(245,158,11,0.2); }
.card-achats:hover { border-color: rgba(245,158,11,0.4); box-shadow: 0 12px 48px -8px rgba(245,158,11,0.15), 0 4px 12px rgba(0,0,0,0.4); }

/* Glow overlay */
.card-glow { position: absolute; inset: 0; pointer-events: none; border-radius: 20px; opacity: 0.5; transition: opacity 0.4s ease; }
.bento-card:hover .card-glow { opacity: 1; }

/* Grid areas */
.card-production { grid-area: production; }
.card-planning   { grid-area: planning; }
.card-finances   { grid-area: finances; }
.card-etudes     { grid-area: etudes; }
.card-achats     { grid-area: achats; }

/* ── Icon Glass Container ── */
.icon-glass {
    border-radius: 18px;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
/* Glassy reflection effect */
.icon-glass::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 40%;
    background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent);
    border-radius: 18px 18px 0 0;
    pointer-events: none;
}
/* Colored glow per card */
.card-production .icon-glass { box-shadow: 0 0 40px rgba(6,182,212,0.2), 0 8px 32px rgba(0,0,0,0.5); }
.card-planning .icon-glass { box-shadow: 0 0 40px rgba(139,92,246,0.2), 0 8px 32px rgba(0,0,0,0.5); }
.card-finances .icon-glass { box-shadow: 0 0 40px rgba(16,185,129,0.2), 0 8px 32px rgba(0,0,0,0.5); }
.card-etudes .icon-glass { box-shadow: 0 0 40px rgba(236,72,153,0.2), 0 8px 32px rgba(0,0,0,0.5); }
.card-achats .icon-glass { box-shadow: 0 0 40px rgba(245,158,11,0.2), 0 8px 32px rgba(0,0,0,0.5); }
/* Hover intensify glow */
.bento-card:hover .icon-glass { box-shadow: 0 0 60px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.6); }
.card-production:hover .icon-glass { box-shadow: 0 0 60px rgba(6,182,212,0.35), 0 12px 40px rgba(0,0,0,0.6); }
.card-planning:hover .icon-glass { box-shadow: 0 0 60px rgba(139,92,246,0.35), 0 12px 40px rgba(0,0,0,0.6); }
.card-finances:hover .icon-glass { box-shadow: 0 0 60px rgba(16,185,129,0.35), 0 12px 40px rgba(0,0,0,0.6); }
.card-etudes:hover .icon-glass { box-shadow: 0 0 60px rgba(236,72,153,0.35), 0 12px 40px rgba(0,0,0,0.6); }
.card-achats:hover .icon-glass { box-shadow: 0 0 60px rgba(245,158,11,0.35), 0 12px 40px rgba(0,0,0,0.6); }
.icon-glass-lg {
    width: 200px;
    height: 200px;
    padding: 10px;
}
.icon-glass-center {
    width: 160px;
    height: 160px;
    padding: 8px;
    margin: 0 auto 0.75rem;
}
.bento-card:hover .icon-glass { transform: scale(1.06); }

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
.card-body-wide {
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
}
.card-info { flex: 1; min-width: 0; }

/* Stats */
.stat-bars { display: flex; flex-direction: column; gap: 0.3rem; }
.stat-row { display: flex; justify-content: space-between; align-items: baseline; }
.stat-name { font-size: 0.76rem; color: rgba(255,255,255,0.55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem; }
.stat-pct { font-size: 0.82rem; font-weight: 700; flex-shrink: 0; }
.progress-track { height: 5px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; margin-bottom: 0.4rem; }
.progress-fill { height: 100%; border-radius: 5px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }

/* Big stat */
.big-stat { display: flex; flex-direction: column; align-items: center; margin: 0.5rem 0; flex: 1; }
.big-num { font-size: 2.2rem; font-weight: 900; line-height: 1; }
.big-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-top: 0.25rem; }
.stat-detail { font-size: 0.72rem; color: rgba(255,255,255,0.3); text-align: center; margin-top: 0.2rem; }
.no-data { font-size: 0.8rem; color: rgba(255,255,255,0.2); font-style: italic; margin: 0.5rem 0; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0.75rem; margin: 0.5rem 0; padding-left: 0.25rem; }
.tl-item { display: flex; align-items: flex-start; gap: 0.75rem; }
.tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 0.35rem; }
.tl-date { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }
.tl-label { font-size: 0.82rem; color: rgba(255,255,255,0.7); font-weight: 500; }

/* Action link */
.card-action {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em;
    margin-top: auto; padding-top: 1rem;
    opacity: 0.4; transition: all 0.3s ease;
}
.bento-card:hover .card-action { opacity: 1; }
.arrow { display: inline-block; transition: transform 0.3s ease; }
.bento-card:hover .arrow { transform: translateX(5px); }

/* ── Responsive: Tablet ── */
@media (max-width: 1024px) {
    .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas: "production production" "planning finances" "etudes achats";
    }
    .icon-glass-lg { width: 160px; height: 160px; }
}

/* ── Responsive: Mobile ── */
@media (max-width: 640px) {
    .bento-root { padding: 1rem 0.75rem 2rem; gap: 0.75rem; }
    .kpi-strip { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .kpi-item { padding: 0.75rem 1rem; }
    .kpi-val { font-size: 1.3rem; }
    .bento-grid {
        grid-template-columns: 1fr;
        grid-template-areas: "production" "planning" "finances" "etudes" "achats";
        gap: 0.5rem;
    }
    .bento-card { padding: 1.25rem; border-radius: 16px; }
    .card-body-wide { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .icon-glass-lg, .icon-glass-center { width: 130px; height: 130px; margin: 0 auto; }
    .card-title { font-size: 1rem; }
    .big-num { font-size: 1.8rem; }
}
`;
