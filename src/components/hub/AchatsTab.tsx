"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingCart, Truck, Package, DollarSign, TrendingUp, CheckCircle2, Trash2, Plus, Pencil } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface AchatsTabProps {
    project?: { id: string };
}

interface PurchaseRow {
    id: string;
    category: string;
    status: string | null;
    inProgress: boolean;
    offerPriceSoum: number | null;
    costPrice: number | null;
    supplierSoum: string | null;
    supplierExe: string | null;
    negotiatedPrice: number | null;
    returnAmount: number | null;
    comments: string | null;
}

/* ─── Helpers ─── */
const fmt = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
};

const fmtK = (val: number) => {
    if (val >= 1000) return `${Math.round(val / 1000)}k€`;
    return `${Math.round(val)}€`;
};

const CHART_PALETTE = [
    "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#10b981",
    "#3b82f6", "#ef4444", "#84cc16", "#f97316", "#6366f1",
    "#14b8a6", "#e879f9",
];
const GAIN_PALETTE = [
    "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669",
    "#047857", "#065f46", "#064e3b",
];

/* ─── Donut Chart (pure SVG) ─── */
function DonutChart({ data, palette, title, centerLabel }: {
    data: { label: string; value: number }[];
    palette: string[];
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

    const radius = 80;
    const cx = 100, cy = 100;
    const strokeWidth = 28;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = 0;

    return (
        <div className="chart-card">
            <h4 className="chart-title">{title}</h4>
            <div className="chart-body">
                <svg viewBox="0 0 200 200" className="donut-svg">
                    {data.map((d, i) => {
                        const pct = d.value / total;
                        const dash = pct * circumference;
                        const gap = circumference - dash;
                        const offset = -(currentAngle / 360) * circumference;
                        currentAngle += pct * 360;
                        return (
                            <circle
                                key={i}
                                cx={cx} cy={cy} r={radius}
                                fill="none"
                                stroke={palette[i % palette.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dash} ${gap}`}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
                            />
                        );
                    })}
                    <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-val">{centerLabel}</text>
                    <text x={cx} y={cy + 14} textAnchor="middle" className="donut-center-label">Total</text>
                </svg>
                <div className="chart-legend">
                    {data.slice(0, 6).map((d, i) => (
                        <div key={i} className="legend-item">
                            <span className="legend-dot" style={{ background: palette[i % palette.length] }} />
                            <span className="legend-label">{d.label}</span>
                            <span className="legend-val">{fmtK(d.value)}</span>
                        </div>
                    ))}
                    {data.length > 6 && (
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: "#475569" }} />
                            <span className="legend-label">+{data.length - 6} autres</span>
                            <span className="legend-val">{fmtK(data.slice(6).reduce((s, d) => s + d.value, 0))}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Editable Cell ─── */
function EditableCell({ value, type = "text", onSave, disabled }: {
    value: string | number | null;
    type?: "text" | "number";
    onSave: (val: string | number | null) => void;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value ?? ""));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        setEditing(false);
        if (type === "number") {
            const num = parseFloat(draft.replace(/\s/g, "").replace(",", "."));
            onSave(isNaN(num) ? null : num);
        } else {
            onSave(draft || null);
        }
    };

    if (disabled) {
        return <span className="cell-text">{type === "number" ? fmt(value as number | null) : (value || "—")}</span>;
    }

    if (!editing) {
        return (
            <span className="cell-editable" onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}>
                {type === "number" ? fmt(value as number | null) : (value || "—")}
                <Pencil size={11} className="cell-pencil" />
            </span>
        );
    }

    return (
        <input
            ref={inputRef}
            className="cell-input"
            type={type === "number" ? "text" : "text"}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
            }}
        />
    );
}

/* ─── Main Component ─── */
export default function AchatsTab({ project }: AchatsTabProps) {
    const [rows, setRows] = useState<PurchaseRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const apiBase = `/api/project/${project?.id}/purchases`;

    const fetchData = useCallback(() => {
        if (!project?.id) return;
        setLoading(true);
        fetch(apiBase)
            .then(r => r.json())
            .then(d => {
                const cats = d.purchases || [];
                setRows(cats);
                setHasData(cats.length > 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [project?.id, apiBase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── CRUD helpers ── */
    const updateRow = async (id: string, field: string, value: unknown) => {
        // Optimistic update
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            // Auto-compute return if price fields change
            if (field === "offerPriceSoum" || field === "negotiatedPrice") {
                const offer = field === "offerPriceSoum" ? (value as number) : r.offerPriceSoum;
                const neg = field === "negotiatedPrice" ? (value as number) : r.negotiatedPrice;
                if (offer != null && neg != null && neg > 0) {
                    updated.returnAmount = Math.round((offer - neg) * 100) / 100;
                }
            }
            return updated;
        }));

        try {
            await fetch(`${apiBase}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value }),
            });
        } catch (e) {
            console.error("Update failed:", e);
        }
    };

    const addRow = async () => {
        try {
            const res = await fetch(apiBase, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: "" }),
            });
            const data = await res.json();
            if (data.purchase) {
                setRows(prev => [...prev, data.purchase]);
                setHasData(true);
            }
        } catch (e) {
            console.error("Add failed:", e);
        }
    };

    const deleteRow = async (id: string) => {
        setDeletingId(id);
        setTimeout(async () => {
            try {
                await fetch(`${apiBase}/${id}`, { method: "DELETE" });
                setRows(prev => prev.filter(r => r.id !== id));
                setDeletingId(null);
            } catch (e) {
                console.error("Delete failed:", e);
                setDeletingId(null);
            }
        }, 300);
    };

    /* ── Computed values ── */
    const totalBudget = rows.reduce((s, c) => s + (c.offerPriceSoum || 0), 0);
    const totalCost = rows.reduce((s, c) => s + (c.costPrice || 0), 0);
    const totalNegotiated = rows.reduce((s, c) => s + (c.negotiatedPrice || 0), 0);
    const totalReturn = rows.reduce((s, c) => s + (c.returnAmount || 0), 0);

    // Chart data: top purchases by offerPriceSoum
    const purchaseChartData = rows
        .filter(r => (r.offerPriceSoum || 0) > 0)
        .sort((a, b) => (b.offerPriceSoum || 0) - (a.offerPriceSoum || 0))
        .slice(0, 10)
        .map(r => ({ label: r.category, value: r.offerPriceSoum || 0 }));

    // Chart data: top gains (positive returnAmount)
    const gainsChartData = rows
        .filter(r => (r.returnAmount || 0) > 0)
        .sort((a, b) => (b.returnAmount || 0) - (a.returnAmount || 0))
        .slice(0, 8)
        .map(r => ({ label: r.category, value: r.returnAmount || 0 }));

    return (
        <div className="achats-root">
            <style>{ACHATS_CSS}</style>

            {/* Upload Zone */}
            <FileUploadZone
                projectId={project?.id || ""}
                module="purchases"
                acceptTypes=".xlsx,.xls"
                title="Importer les Achats"
                subtitle="Glissez un fichier Excel contenant la liste des achats et fournisseurs du projet"
                accentColor="amber"
                icon={<ShoppingCart size={36} className="text-amber-400" />}
                onUploadComplete={() => fetchData()}
            />

            {/* Data source */}
            {!hasData ? (
                <div className="data-banner data-banner-warn">
                    <p className="data-banner-text">
                        <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                    </p>
                </div>
            ) : (
                <div className="data-banner data-banner-ok">
                    <CheckCircle2 size={16} />
                    <p className="data-banner-text">
                        Données importées actives — {rows.length} catégorie{rows.length > 1 ? "s" : ""} d&apos;achat chargée{rows.length > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner" />
                </div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-purple"><DollarSign size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Budget Total</span>
                                <span className="kpi-value">{fmt(totalBudget)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-emerald"><Package size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Coût Revient</span>
                                <span className="kpi-value kpi-val-emerald">{fmt(totalCost)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-blue"><Truck size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Prix Négocié</span>
                                <span className="kpi-value kpi-val-blue">{fmt(totalNegotiated)}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon kpi-icon-amber"><TrendingUp size={20} /></div>
                            <div className="kpi-content">
                                <span className="kpi-label">Return</span>
                                <span className={`kpi-value ${totalReturn >= 0 ? "kpi-val-emerald" : "kpi-val-red"}`}>{fmt(totalReturn)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Charts ── */}
                    <div className="charts-row">
                        <DonutChart
                            data={purchaseChartData}
                            palette={CHART_PALETTE}
                            title="Répartition des Achats"
                            centerLabel={fmtK(totalBudget)}
                        />
                        <DonutChart
                            data={gainsChartData}
                            palette={GAIN_PALETTE}
                            title="Top Gains Négociation"
                            centerLabel={fmtK(totalReturn)}
                        />
                    </div>

                    {/* ── Table ── */}
                    <div className="table-container">
                        <div className="table-scroll">
                            <table className="purchase-table">
                                <thead>
                                    <tr>
                                        <th className="th-cat">Catégorie</th>
                                        <th className="th-num">Prix Soumission</th>
                                        <th className="th-num">Coût Revient</th>
                                        <th className="th-text">Fourn. SOUM</th>
                                        <th className="th-text">Fourn. EXE</th>
                                        <th className="th-num">Prix Négocié</th>
                                        <th className="th-num">Return</th>
                                        <th className="th-actions" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`table-row ${deletingId === row.id ? "row-deleting" : ""}`}
                                        >
                                            <td className="td-cat">
                                                <div className="cat-cell">
                                                    {row.inProgress && <span className="pulse-dot" />}
                                                    <EditableCell
                                                        value={row.category}
                                                        onSave={v => updateRow(row.id, "category", v)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="td-num">
                                                <EditableCell
                                                    value={row.offerPriceSoum}
                                                    type="number"
                                                    onSave={v => updateRow(row.id, "offerPriceSoum", v)}
                                                />
                                            </td>
                                            <td className="td-num">
                                                <EditableCell
                                                    value={row.costPrice}
                                                    type="number"
                                                    onSave={v => updateRow(row.id, "costPrice", v)}
                                                />
                                            </td>
                                            <td className="td-text">
                                                <EditableCell
                                                    value={row.supplierSoum}
                                                    onSave={v => updateRow(row.id, "supplierSoum", v)}
                                                />
                                            </td>
                                            <td className="td-text">
                                                <EditableCell
                                                    value={row.supplierExe}
                                                    onSave={v => updateRow(row.id, "supplierExe", v)}
                                                />
                                            </td>
                                            <td className="td-num">
                                                <EditableCell
                                                    value={row.negotiatedPrice}
                                                    type="number"
                                                    onSave={v => updateRow(row.id, "negotiatedPrice", v)}
                                                />
                                            </td>
                                            <td className="td-return">
                                                <span className={`return-val ${
                                                    (row.returnAmount || 0) > 0 ? "return-positive" :
                                                    (row.returnAmount || 0) < 0 ? "return-negative" : "return-zero"
                                                }`}>
                                                    {fmt(row.returnAmount)}
                                                </span>
                                            </td>
                                            <td className="td-actions">
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteRow(row.id)}
                                                    title="Supprimer cette ligne"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {rows.length > 0 && (
                                    <tfoot>
                                        <tr className="total-row">
                                            <td className="td-cat total-label">TOTAL</td>
                                            <td className="td-num total-val">{fmt(totalBudget)}</td>
                                            <td className="td-num total-val">{fmt(totalCost)}</td>
                                            <td colSpan={2} />
                                            <td className="td-num total-val">{fmt(totalNegotiated)}</td>
                                            <td className="td-return">
                                                <span className={`return-val total-val ${totalReturn >= 0 ? "return-positive" : "return-negative"}`}>
                                                    {fmt(totalReturn)}
                                                </span>
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        <button className="btn-add-row" onClick={addRow}>
                            <Plus size={16} /> Ajouter une ligne
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━ STYLES ━━━━━━━━━━━━━━━━━━━━━ */
const ACHATS_CSS = `
.achats-root {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: achats-fade 0.5s ease-out;
}
@keyframes achats-fade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Data Banners ── */
.data-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}
.data-banner-warn {
    background: rgba(245,158,11,0.04);
    border: 1px solid rgba(245,158,11,0.15);
    color: #fcd34d;
}
.data-banner-ok {
    background: rgba(16,185,129,0.04);
    border: 1px solid rgba(16,185,129,0.15);
    color: #6ee7b7;
}
.data-banner-text { margin: 0; }

/* ── Loading ── */
.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5rem 0;
}
.spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #f59e0b;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── KPI Grid ── */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
}
.kpi-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    backdrop-filter: blur(12px);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.kpi-card:hover {
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.kpi-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.kpi-icon-purple { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; }
.kpi-icon-emerald { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
.kpi-icon-blue { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
.kpi-icon-amber { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
.kpi-content { display: flex; flex-direction: column; gap: 0.15rem; }
.kpi-label {
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.35);
}
.kpi-value {
    font-size: 1.5rem;
    font-weight: 900;
    color: white;
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
}
.kpi-val-emerald { color: #34d399; }
.kpi-val-blue { color: #60a5fa; }
.kpi-val-red { color: #f87171; }

/* ── Charts Row ── */
.charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.chart-card {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 1.5rem;
    backdrop-filter: blur(12px);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.chart-card:hover {
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.chart-title {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.5);
    margin: 0 0 1rem 0;
}
.chart-empty {
    color: rgba(255,255,255,0.25);
    font-size: 0.8rem;
    text-align: center;
    padding: 2rem;
}
.chart-body {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}
.donut-svg {
    width: 160px;
    height: 160px;
    flex-shrink: 0;
    transform: rotate(-90deg);
}
.donut-center-val {
    fill: white;
    font-size: 1.1rem;
    font-weight: 900;
    transform: rotate(90deg);
    transform-origin: center;
}
.donut-center-label {
    fill: rgba(255,255,255,0.35);
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transform: rotate(90deg);
    transform-origin: center;
}
.chart-legend {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
}
.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}
.legend-label {
    flex: 1;
    color: rgba(255,255,255,0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.legend-val {
    color: rgba(255,255,255,0.8);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

/* ── Table ── */
.table-container {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(12px);
}
.table-scroll { overflow-x: auto; }
.purchase-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}
.purchase-table th {
    text-align: left;
    padding: 0.85rem 1rem;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.35);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: sticky;
    top: 0;
    background: rgba(15,23,42,0.95);
    z-index: 1;
}
.th-num { text-align: right; }
.th-actions { width: 40px; }

/* Rows */
.table-row {
    transition: background 0.2s, opacity 0.3s, transform 0.3s;
}
.table-row:nth-child(even) {
    background: rgba(255,255,255,0.015);
}
.table-row:hover {
    background: rgba(255,255,255,0.04);
}
.table-row.row-deleting {
    opacity: 0;
    transform: translateX(-20px);
}

/* Cells */
.td-cat { padding: 0.65rem 1rem; min-width: 200px; }
.td-num { padding: 0.65rem 1rem; text-align: right; font-variant-numeric: tabular-nums; }
.td-text { padding: 0.65rem 1rem; }
.td-return { padding: 0.65rem 1rem; text-align: right; }
.td-actions {
    padding: 0.65rem 0.5rem;
    width: 40px;
    text-align: center;
}

.cat-cell {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    animation: pulse-glow 2s infinite;
    flex-shrink: 0;
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
    50% { box-shadow: 0 0 0 4px rgba(52,211,153,0); }
}

/* Editable cells */
.cell-text {
    color: rgba(255,255,255,0.7);
    font-size: 0.8rem;
}
.cell-editable {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: rgba(255,255,255,0.8);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    border-radius: 6px;
    transition: background 0.2s;
}
.cell-editable:hover {
    background: rgba(255,255,255,0.06);
}
.cell-pencil {
    opacity: 0;
    transition: opacity 0.2s;
    color: rgba(255,255,255,0.3);
}
.cell-editable:hover .cell-pencil {
    opacity: 1;
}
.cell-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 6px;
    color: white;
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    outline: none;
    width: 100%;
    min-width: 60px;
    max-width: 180px;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.2s;
}
.cell-input:focus {
    border-color: rgba(139,92,246,0.7);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
}

/* Return column */
.return-val {
    font-size: 0.8rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}
.return-positive { color: #34d399; }
.return-negative { color: #f87171; }
.return-zero { color: rgba(255,255,255,0.25); }

/* Delete button */
.btn-delete {
    background: none;
    border: none;
    color: rgba(255,255,255,0.15);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s, background 0.2s;
}
.table-row:hover .btn-delete {
    opacity: 1;
}
.btn-delete:hover {
    color: #f87171;
    background: rgba(239,68,68,0.1);
}

/* Total row */
.total-row {
    border-top: 2px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
}
.total-label {
    padding: 0.85rem 1rem;
    font-weight: 900;
    color: white;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
}
.total-val {
    font-weight: 900 !important;
    color: white !important;
    font-size: 0.8rem;
}

/* Add row button */
.btn-add-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.85rem;
    background: none;
    border: none;
    border-top: 1px dashed rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.3);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}
.btn-add-row:hover {
    color: #fbbf24;
    background: rgba(245,158,11,0.04);
}

/* ── Responsive ── */
@media (max-width: 768px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .charts-row { grid-template-columns: 1fr; }
    .chart-body { flex-direction: column; }
    .donut-svg { width: 140px; height: 140px; }
}
@media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr; }
}
`;
