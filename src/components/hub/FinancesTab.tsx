"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, TrendingUp, CheckCircle2, BarChart3, PieChart, Activity, ArrowRight } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface FinancesTabProps {
    project: {
        id: string;
        name: string;
        tasks: { totalBudgetedHours: number | null; completedHours: number | null; hourlyRate: number | null }[];
    };
}

interface FinanceSnapshot {
    id: string;
    month: string;
    sheetName: string | null;
    totalRevenue: number | null;
    finalRevenue: number | null;
    laborCost: number | null;
    externalLaborCost: number | null;
    subcontractorCost: number | null;
    materialCost: number | null;
    engineeringCost: number | null;
    siteCost: number | null;
    provisionsCost: number | null;
    totalCost: number | null;
    result: number | null;
    marginPercent: number | null;
    // RAF fields
    rafLabor: number | null;
    rafSubcontractor: number | null;
    rafMaterial: number | null;
    rafEngineering: number | null;
    rafSite: number | null;
    rafTotal: number | null;
}

/* ─── Helpers ─── */
const fmt = (val: number | null, decimals = 0) => {
    if (val === null || val === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: decimals }).format(val);
};

const fmtK = (val: number) => {
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M€`;
    if (Math.abs(val) >= 1000) return `${Math.round(val / 1000)}k€`;
    return `${Math.round(val)}€`;
};

const pctFromDecimal = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    // Handle both decimal (0.028) and percentage (2.8) formats
    const pctVal = Math.abs(val) < 1 ? val * 100 : val;
    return `${pctVal.toFixed(1)}%`;
};

const computeMargin = (snap: FinanceSnapshot) => {
    // Marge = Résultat / Revenu final projeté (including revisions)
    const denominator = snap.finalRevenue || snap.totalRevenue;
    if (snap.result != null && denominator && denominator > 0) {
        return Math.round((snap.result / denominator) * 100 * 10) / 10;
    }
    return null;
};

const monthLabel = (snap: FinanceSnapshot) => {
    if (snap.sheetName) return snap.sheetName;
    const d = new Date(snap.month);
    return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
};

/* ─── Line Chart (SVG) — Result Evolution ─── */
function LineChart({ snapshots }: { snapshots: FinanceSnapshot[] }) {
    if (snapshots.length < 2) return <p className="chart-empty">Pas assez de données pour le graphique</p>;

    const values = snapshots.map(s => s.result || 0);
    const maxVal = Math.max(...values.map(Math.abs), 1);
    const W = 500, H = 180, padX = 40, padY = 20;
    const chartW = W - padX * 2;
    const chartH = H - padY * 2;

    const points = values.map((v, i) => ({
        x: padX + (i / (values.length - 1)) * chartW,
        y: padY + chartH / 2 - (v / maxVal) * (chartH / 2),
    }));
    const polyline = points.map(p => `${p.x},${p.y}`).join(" ");

    // Gradient area
    const areaPath = `M${points[0].x},${padY + chartH / 2} ` +
        points.map(p => `L${p.x},${p.y}`).join(" ") +
        ` L${points[points.length - 1].x},${padY + chartH / 2} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="line-chart-svg">
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Zero line */}
            <line x1={padX} y1={padY + chartH / 2} x2={W - padX} y2={padY + chartH / 2}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,4" />
            {/* Area fill */}
            <path d={areaPath} fill="url(#areaGrad)" />
            {/* Line */}
            <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))" }} />
            {/* Dots + labels */}
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-dot-label">{fmtK(values[i])}</text>
                    <text x={p.x} y={H - 2} textAnchor="middle" className="chart-x-label">{monthLabel(snapshots[i])}</text>
                </g>
            ))}
        </svg>
    );
}

/* ─── Donut Chart (same pattern as Achats) ─── */
function DonutChart({ data, title, centerLabel }: {
    data: { label: string; value: number; color: string }[];
    title: string;
    centerLabel: string;
}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return (
        <div className="chart-card">
            <h4 className="chart-title">{title}</h4>
            <p className="chart-empty">Aucune donnée</p>
        </div>
    );

    const radius = 80, cx = 100, cy = 100, strokeWidth = 28;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="chart-card">
            <h4 className="chart-title">{title}</h4>
            <div className="chart-body">
                <svg viewBox="0 0 200 200" className="donut-svg">
                    {data.map((d, i) => {
                        const pct = d.value / total;
                        const dash = pct * circumference;
                        const gap = circumference - dash;
                        const prevPctSum = data.slice(0, i).reduce((sum, item) => sum + (item.value / total), 0);
                        const offset = -prevPctSum * circumference;
                        return (
                            <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
                                stroke={d.color} strokeWidth={strokeWidth}
                                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }} />
                        );
                    })}
                    <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-val">{centerLabel}</text>
                    <text x={cx} y={cy + 14} textAnchor="middle" className="donut-center-label">Total</text>
                </svg>
                <div className="chart-legend">
                    {data.map((d, i) => {
                        const pctVal = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
                        return (
                            <div key={i} className="legend-item">
                                <span className="legend-dot" style={{ background: d.color }} />
                                <span className="legend-label">{d.label}</span>
                                <span className="legend-pct">{pctVal}%</span>
                                <span className="legend-val">{fmtK(d.value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─── Budget vs Result Bar Chart ─── */
function BudgetResultChart({ snapshots }: { snapshots: FinanceSnapshot[] }) {
    if (snapshots.length === 0) return null;

    const latest = snapshots[snapshots.length - 1];
    const revenue = latest.totalRevenue || 0;
    const cost = latest.totalCost || 0;
    const result = latest.result || 0;
    const maxBar = Math.max(revenue, cost, 1);

    const bars = [
        { label: "Revenu", value: revenue, color: "#3b82f6", grad: "from-blue-500 to-blue-600" },
        { label: "Coûts", value: cost, color: "#f59e0b", grad: "from-amber-500 to-amber-600" },
        { label: "Résultat", value: result, color: result >= 0 ? "#10b981" : "#ef4444", grad: result >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600" },
    ];

    return (
        <div className="budget-chart">
            {bars.map(bar => (
                <div key={bar.label} className="budget-bar-row">
                    <span className="budget-bar-label">{bar.label}</span>
                    <div className="budget-bar-track">
                        <div
                            className="budget-bar-fill"
                            style={{
                                width: `${Math.max((Math.abs(bar.value) / maxBar) * 100, 3)}%`,
                                background: bar.color,
                                boxShadow: `0 0 12px ${bar.color}40`,
                            }}
                        />
                    </div>
                    <span className="budget-bar-val" style={{ color: bar.color }}>{fmtK(bar.value)}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Advancement Section ─── */
function AdvancementSection({ snapshots }: { snapshots: FinanceSnapshot[] }) {
    if (snapshots.length === 0) return null;

    const latest = snapshots[snapshots.length - 1];
    const currentRevenue = latest.totalRevenue || 0;
    // finalRevenue = total projected revenue at end of project (including revisions)
    const finalRevenue = latest.finalRevenue || currentRevenue;
    const pctProgress = finalRevenue > 0 ? Math.min((currentRevenue / finalRevenue) * 100, 100) : 0;

    // Revenue evolution dot chart
    const values = snapshots.map(s => s.totalRevenue || 0);
    const maxRev = Math.max(...values, 1);
    const W = 400, H = 120, padX = 30, padY = 15;
    const chartW = W - padX * 2;
    const chartH = H - padY * 2;
    const points = values.map((v, i) => ({
        x: padX + (values.length > 1 ? (i / (values.length - 1)) * chartW : chartW / 2),
        y: padY + chartH - (v / maxRev) * chartH,
        val: v,
    }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    return (
        <div className="advancement-section">
            <h4 className="section-title">
                <Activity size={16} className="section-icon" />
                États d&apos;Avancement — Revenus
            </h4>
            <div className="advancement-grid">
                {/* Progress bar */}
                <div className="adv-progress-card">
                    <div className="adv-progress-header">
                        <span className="adv-progress-label">Avancement Facturation</span>
                        <span className="adv-progress-pct">{pctProgress.toFixed(0)}%</span>
                    </div>
                    <div className="adv-progress-track">
                        <div className="adv-progress-fill" style={{ width: `${pctProgress}%` }} />
                    </div>
                    <div className="adv-progress-footer">
                        <span>Facturé : {fmtK(currentRevenue)}</span>
                        <span>Revenu final projeté : {fmtK(finalRevenue)}</span>
                    </div>
                </div>
                {/* Revenue evolution dot chart */}
                <svg viewBox={`0 0 ${W} ${H}`} className="adv-dot-chart">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const y = padY + chartH - pct * chartH;
                        return <line key={pct} x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.05)" />;
                    })}
                    {/* Line */}
                    {points.length > 1 && (
                        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
                    )}
                    {/* Dots */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
                            <circle cx={p.x} cy={p.y} r="6" fill="rgba(59,130,246,0.2)" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-dot-label">{fmtK(p.val)}</text>
                            <text x={p.x} y={H - 3} textAnchor="middle" className="chart-x-label">{monthLabel(snapshots[i])}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━ MAIN COMPONENT ━━━━━━━━━━━━━━━━━━━ */
export default function FinancesTab({ project }: FinancesTabProps) {
    const [snapshots, setSnapshots] = useState<FinanceSnapshot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(() => {
        if (!project?.id) return;
        setLoading(true);
        fetch(`/api/hub/finances?projectId=${project.id}`)
            .then(r => r.json())
            .then(d => { setSnapshots(d.snapshots || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [project?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isDemo = snapshots.length === 0;
    const latest = snapshots[snapshots.length - 1];

    // Compute margin from result/revenue (not from DB marginPercent which is unreliable)
    const latestMargin = latest ? computeMargin(latest) : null;

    // Cost breakdown for donut chart with ALL cost categories
    const costBreakdown = latest ? [
        { label: "Main d'œuvre", value: latest.laborCost || 0, color: "#3b82f6" },
        { label: "Encadrement", value: latest.engineeringCost || 0, color: "#8b5cf6" },
        { label: "Sous-traitance", value: latest.subcontractorCost || 0, color: "#f59e0b" },
        { label: "Matériel", value: latest.materialCost || 0, color: "#06b6d4" },
        { label: "Frais généraux", value: latest.siteCost || 0, color: "#ec4899" },
        { label: "Ext. Régie", value: latest.externalLaborCost || 0, color: "#10b981" },
        { label: "Provisions", value: latest.provisionsCost || 0, color: "#ef4444" },
    ].filter(c => c.value > 0) : [];

    return (
        <div className="finances-root">
            <style>{FINANCES_CSS}</style>

            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="finances"
                acceptTypes=".xlsx,.xls"
                title="Importer les Données Financières"
                subtitle="Glissez un fichier Excel contenant le suivi financier du projet"
                accentColor="emerald"
                icon={<DollarSign size={36} className="text-emerald-400" />}
                onUploadComplete={() => fetchData()}
            />

            {/* Data source */}
            {isDemo ? (
                <div className="data-banner data-banner-warn">
                    <p className="data-banner-text"><T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" /></p>
                </div>
            ) : (
                <div className="data-banner data-banner-ok">
                    <CheckCircle2 size={16} />
                    <p className="data-banner-text">
                        Données importées actives — {snapshots.length} snapshot{snapshots.length > 1 ? "s" : ""} financier{snapshots.length > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : !isDemo && latest ? (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-blue"><DollarSign size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Revenu Total</span>
                                <span className="kpi-value kpi-val-blue">{fmt(latest.totalRevenue)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-amber"><BarChart3 size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Coût Total</span>
                                <span className="kpi-value kpi-val-amber">{fmt(latest.totalCost)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-emerald"><TrendingUp size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Résultat</span>
                                <span className={`kpi-value ${(latest.result || 0) >= 0 ? "kpi-val-emerald" : "kpi-val-red"}`}>{fmt(latest.result)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-purple"><PieChart size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Marge</span>
                                <span className={`kpi-value ${(latestMargin || 0) >= 0 ? "kpi-val-emerald" : "kpi-val-red"}`}>
                                    {latestMargin != null ? `${latestMargin.toFixed(1)}%` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Charts Row 1: Result Evolution + Cost Breakdown ── */}
                    <div className="charts-row">
                        <div className="chart-card chart-card-wide">
                            <h4 className="chart-title">Évolution du Résultat</h4>
                            <LineChart snapshots={snapshots} />
                        </div>
                        <DonutChart
                            data={costBreakdown}
                            title="Répartition des Coûts"
                            centerLabel={fmtK(latest.totalCost || 0)}
                        />
                    </div>

                    {/* ── Budget vs Result ── */}
                    <div className="chart-card">
                        <h4 className="chart-title">Budget vs Résultat</h4>
                        <BudgetResultChart snapshots={snapshots} />
                    </div>

                    {/* ── Advancement ── */}
                    <AdvancementSection snapshots={snapshots} />

                    {/* ── Reste À Faire ── */}
                    {latest && (latest.rafLabor || latest.rafSubcontractor || latest.rafMaterial || latest.rafEngineering || latest.rafSite) && (
                        <div className="chart-card">
                            <h4 className="chart-title">Reste À Faire — Coûts Restants</h4>
                            <div className="raf-grid">
                                {[
                                    { label: "Main d'œuvre", actual: latest.laborCost, raf: latest.rafLabor, color: "#3b82f6" },
                                    { label: "Encadrement", actual: latest.engineeringCost, raf: latest.rafEngineering, color: "#8b5cf6" },
                                    { label: "Sous-traitance", actual: latest.subcontractorCost, raf: latest.rafSubcontractor, color: "#f59e0b" },
                                    { label: "Matériel", actual: latest.materialCost, raf: latest.rafMaterial, color: "#06b6d4" },
                                    { label: "Frais généraux", actual: latest.siteCost, raf: latest.rafSite, color: "#ec4899" },
                                ].filter(r => (r.actual || 0) > 0 || (r.raf || 0) > 0).map(row => {
                                    const total = (row.actual || 0) + (row.raf || 0);
                                    const pctDone = total > 0 ? ((row.actual || 0) / total) * 100 : 0;
                                    return (
                                        <div key={row.label} className="raf-row">
                                            <span className="raf-label">{row.label}</span>
                                            <div className="raf-bar-track">
                                                <div className="raf-bar-actual" style={{ width: `${pctDone}%`, background: row.color }} />
                                                <div className="raf-bar-remaining" style={{ width: `${100 - pctDone}%`, background: `${row.color}30` }} />
                                            </div>
                                            <div className="raf-values">
                                                <span style={{ color: row.color }}>{fmtK(row.actual || 0)}</span>
                                                <span className="raf-sep">/</span>
                                                <span className="raf-total">{fmtK(total)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Monthly Detail Table ── */}
                    <div className="table-container">
                        <h4 className="table-header-title">
                            <ArrowRight size={16} /> Évolution Mensuelle
                        </h4>
                        <div className="table-scroll">
                            <table className="finance-table">
                                <thead>
                                    <tr>
                                        <th className="th-cat">Mois</th>
                                        <th className="th-num">Revenu</th>
                                        <th className="th-num">Main d&apos;œuvre</th>
                                        <th className="th-num">Encadrement</th>
                                        <th className="th-num">Sous-trait.</th>
                                        <th className="th-num">Matériel</th>
                                        <th className="th-num">Frais Gén.</th>
                                        <th className="th-num">Résultat</th>
                                        <th className="th-num">Marge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {snapshots.map(snap => {
                                        const margin = computeMargin(snap);
                                        return (
                                            <tr key={snap.id} className="table-row">
                                                <td className="td-cat">{monthLabel(snap)}</td>
                                                <td className="td-num">{fmt(snap.totalRevenue)}</td>
                                                <td className="td-num td-blue">{fmt(snap.laborCost)}</td>
                                                <td className="td-num td-purple">{fmt(snap.engineeringCost)}</td>
                                                <td className="td-num td-amber">{fmt(snap.subcontractorCost)}</td>
                                                <td className="td-num td-cyan">{fmt(snap.materialCost)}</td>
                                                <td className="td-num td-pink">{fmt(snap.siteCost)}</td>
                                                <td className="td-num">
                                                    <span className={`return-val ${(snap.result || 0) >= 0 ? "return-positive" : "return-negative"}`}>
                                                        {fmt(snap.result)}
                                                    </span>
                                                </td>
                                                <td className="td-num">
                                                    <span className={`return-val ${(margin || 0) >= 3 ? "return-positive" : "return-warn"}`}>
                                                        {margin != null ? `${margin.toFixed(1)}%` : "—"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <DollarSign size={48} className="empty-icon" />
                    <p>Importez un fichier financier pour visualiser les données</p>
                </div>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━ STYLES ━━━━━━━━━━━━━━━━━━━━━ */
const FINANCES_CSS = `
.finances-root {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: fin-fade 0.5s ease-out;
}
@keyframes fin-fade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

.donut-svg circle { transition: stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease; }

/* ── Data Banners ── */
.data-banner {
    display: flex; align-items: center; justify-content: center;
    gap: 0.5rem; padding: 0.75rem; border-radius: 12px;
    font-size: 0.75rem; font-weight: 600;
}
.data-banner-warn { background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.15); color: #fcd34d; }
.data-banner-ok { background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.15); color: #6ee7b7; }
.data-banner-text { margin: 0; }

.loading-spinner { display: flex; align-items: center; justify-content: center; padding: 5rem 0; }
.spinner { width: 2rem; height: 2rem; border: 2px solid #10b981; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: rgba(255,255,255,0.2); }
.empty-icon { opacity: 0.3; }

/* ── KPI Grid (matches Achats) ── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.kpi-card {
    display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
    background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; backdrop-filter: blur(12px);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.kpi-card:hover { border-color: rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.kpi-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-icon-blue { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
.kpi-icon-amber { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
.kpi-icon-emerald { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
.kpi-icon-purple { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; }
.kpi-content { display: flex; flex-direction: column; gap: 0.15rem; }
.kpi-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); }
.kpi-value { font-size: 1.5rem; font-weight: 900; color: white; font-variant-numeric: tabular-nums; transition: color 0.3s; }
.kpi-val-blue { color: #60a5fa; }
.kpi-val-amber { color: #fbbf24; }
.kpi-val-emerald { color: #34d399; }
.kpi-val-red { color: #f87171; }
.kpi-val-purple { color: #a78bfa; }

/* ── Charts ── */
.charts-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; }
.chart-card {
    background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.chart-card:hover { border-color: rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.chart-card-wide { min-height: 240px; }
.chart-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin: 0 0 1rem 0; }
.chart-empty { color: rgba(255,255,255,0.25); font-size: 0.8rem; text-align: center; padding: 2rem; }
.chart-body { display: flex; align-items: center; gap: 1.5rem; }
.donut-svg { width: 160px; height: 160px; flex-shrink: 0; transform: rotate(-90deg); }
.donut-center-val { fill: white; font-size: 1.1rem; font-weight: 900; transform: rotate(90deg); transform-origin: center; }
.donut-center-label { fill: rgba(255,255,255,0.35); font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; transform: rotate(90deg); transform-origin: center; }
.chart-legend { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-label { flex: 1; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.legend-pct { color: rgba(255,255,255,0.4); font-size: 0.65rem; width: 28px; text-align: right; }
.legend-val { color: rgba(255,255,255,0.8); font-weight: 700; font-variant-numeric: tabular-nums; }

/* Line chart */
.line-chart-svg { width: 100%; height: auto; }
.chart-dot-label { fill: rgba(255,255,255,0.7); font-size: 0.5rem; font-weight: 700; }
.chart-x-label { fill: rgba(255,255,255,0.3); font-size: 0.4rem; font-weight: 600; text-transform: uppercase; }

/* Budget vs Result */
.budget-chart { display: flex; flex-direction: column; gap: 1rem; }
.budget-bar-row { display: flex; align-items: center; gap: 1rem; }
.budget-bar-label { width: 70px; font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.5); text-align: right; }
.budget-bar-track { flex: 1; height: 28px; background: rgba(255,255,255,0.03); border-radius: 8px; overflow: hidden; }
.budget-bar-fill {
    height: 100%; border-radius: 8px;
    transition: width 0.8s ease;
    display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;
}
.budget-bar-val { width: 70px; font-size: 0.85rem; font-weight: 800; font-variant-numeric: tabular-nums; }

/* ── Advancement Section ── */
.advancement-section {
    background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);
}
.section-title {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin: 0 0 1.25rem 0;
}
.section-icon { color: #3b82f6; }
.advancement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.adv-progress-card { display: flex; flex-direction: column; gap: 0.75rem; }
.adv-progress-header { display: flex; justify-content: space-between; align-items: center; }
.adv-progress-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 600; }
.adv-progress-pct { font-size: 1.5rem; font-weight: 900; color: #3b82f6; }
.adv-progress-track { height: 12px; background: rgba(255,255,255,0.04); border-radius: 6px; overflow: hidden; }
.adv-progress-fill {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    box-shadow: 0 0 12px rgba(59,130,246,0.3);
    transition: width 0.8s ease;
}
.adv-progress-footer { display: flex; justify-content: space-between; font-size: 0.65rem; color: rgba(255,255,255,0.35); }

/* Revenue dot chart */
.adv-dot-chart { width: 100%; height: auto; }

/* ── Monthly Table ── */
.table-container {
    background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; overflow: hidden; backdrop-filter: blur(12px);
}
.table-header-title {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.5);
    margin: 0; padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.table-scroll { overflow-x: auto; }
.finance-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.finance-table th {
    text-align: left; padding: 0.85rem 1rem;
    font-size: 0.55rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em;
    color: rgba(255,255,255,0.35); border-bottom: 1px solid rgba(255,255,255,0.06);
    position: sticky; top: 0; background: rgba(15,23,42,0.95); z-index: 1;
}
.th-num { text-align: right; }
.th-cat { min-width: 100px; }
.table-row { transition: background 0.2s; }
.table-row:nth-child(even) { background: rgba(255,255,255,0.015); }
.table-row:hover { background: rgba(255,255,255,0.04); }
.td-cat { padding: 0.65rem 1rem; color: white; font-weight: 600; font-size: 0.8rem; }
.td-num { padding: 0.65rem 1rem; text-align: right; color: rgba(255,255,255,0.7); font-variant-numeric: tabular-nums; font-size: 0.75rem; }
.td-blue { color: #93c5fd; }
.td-purple { color: #c4b5fd; }
.td-amber { color: #fcd34d; }
.td-cyan { color: #67e8f9; }
.td-pink { color: #f9a8d4; }
.return-val { font-weight: 700; font-variant-numeric: tabular-nums; }
.return-positive { color: #34d399; }
.return-negative { color: #f87171; }
.return-warn { color: #fbbf24; }

/* ── RAF (Reste À Faire) ── */
.raf-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.raf-row { display: grid; grid-template-columns: 120px 1fr 130px; gap: 1rem; align-items: center; }
.raf-label { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.6); }
.raf-bar-track { display: flex; height: 20px; border-radius: 8px; overflow: hidden; }
.raf-bar-actual { height: 100%; border-radius: 8px 0 0 8px; transition: width 0.8s ease; min-width: 2px; }
.raf-bar-remaining { height: 100%; border-radius: 0 8px 8px 0; transition: width 0.8s ease; }
.raf-values { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.raf-sep { color: rgba(255,255,255,0.2); }
.raf-total { color: rgba(255,255,255,0.4); }

/* ── Responsive ── */
@media (max-width: 768px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
    .chart-body { flex-direction: column; }
    .advancement-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr; }
}
`;
