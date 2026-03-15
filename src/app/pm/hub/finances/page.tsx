'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface FinanceSnapshot {
  id: string;
  month: string;
  sheetName: string | null;
  totalRevenue: number | null;
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
}

const fmt = (val: number | null, decimals = 0) => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(val);
};

const pct = (val: number | null) => {
  if (val === null || val === undefined) return '—';
  return `${(val * 100).toFixed(1)}%`;
};

const monthName = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

export default function FinancesPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [snapshots, setSnapshots] = useState<FinanceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    fetch(`/api/hub/finances?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setSnapshots(d.snapshots || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  const latest = snapshots[snapshots.length - 1];

  if (!projectId) {
    return (
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-12 text-center">
        <p className="text-gray-400 text-lg">Sélectionnez un projet pour voir les finances</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Cost breakdown for latest snapshot
  const costBreakdown = latest ? [
    { label: 'Main d\'oeuvre', value: latest.laborCost, color: '#3b82f6' },
    { label: 'Ingénierie', value: latest.engineeringCost, color: '#8b5cf6' },
    { label: 'Matériel', value: latest.materialCost, color: '#06b6d4' },
    { label: 'Sous-traitance', value: latest.subcontractorCost, color: '#f59e0b' },
    { label: 'Provisions', value: latest.provisionsCost, color: '#ef4444' },
    { label: 'Ext. Régie', value: latest.externalLaborCost, color: '#10b981' },
  ].filter(c => c.value && c.value !== 0) : [];
  
  const totalBreakdown = costBreakdown.reduce((s, c) => s + (c.value || 0), 0);

  // Chart: result evolution
  const maxResult = Math.max(...snapshots.map(s => Math.abs(s.result || 0)), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {latest ? [
          { label: 'Revenu Total', value: fmt(latest.totalRevenue), icon: '💰', color: 'from-blue-500/20 to-blue-600/10' },
          { label: 'Coût Total', value: fmt(latest.totalCost), icon: '💸', color: 'from-purple-500/20 to-purple-600/10' },
          { label: 'Résultat', value: fmt(latest.result), icon: (latest.result || 0) >= 0 ? '📈' : '📉', color: (latest.result || 0) >= 0 ? 'from-emerald-500/20 to-emerald-600/10' : 'from-red-500/20 to-red-600/10' },
          { label: 'Marge', value: pct(latest.marginPercent), icon: '🎯', color: (latest.marginPercent || 0) >= 0.05 ? 'from-cyan-500/20 to-cyan-600/10' : 'from-amber-500/20 to-amber-600/10' },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-xl border border-white/5 p-5`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{card.icon}</span>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
            </div>
            <p className="text-white text-xl font-bold">{card.value}</p>
          </div>
        )) : (
          <div className="col-span-4 bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl border border-white/5 p-8 text-center text-gray-500">
            Aucune donnée financière disponible
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Result Evolution Chart */}
        <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Évolution du Résultat
          </h3>
          {snapshots.length > 0 ? (
            <div className="space-y-3">
              {snapshots.map((snap, idx) => {
                const val = snap.result || 0;
                const width = Math.abs(val) / maxResult * 100;
                const isPositive = val >= 0;
                return (
                  <div key={snap.id} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-16 text-right font-mono">
                      {monthName(snap.month)}
                    </span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'
                        }`}
                        style={{ width: `${Math.max(width, 3)}%`, animationDelay: `${idx * 100}ms` }}
                      />
                      <span className={`absolute inset-0 flex items-center px-3 text-xs font-semibold ${
                        width > 40 ? 'text-white' : isPositive ? 'text-emerald-400' : 'text-red-400' 
                      }`}>
                        {fmt(val)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium w-12 text-right ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {pct(snap.marginPercent)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Pas de données</p>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>🍩</span> Répartition des Coûts
            {latest && <span className="text-gray-400 text-xs ml-auto">{latest.sheetName || monthName(latest.month)}</span>}
          </h3>
          {costBreakdown.length > 0 ? (
            <div className="space-y-3">
              {costBreakdown.map(item => {
                const pctVal = totalBreakdown > 0 ? ((item.value || 0) / totalBreakdown * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-300 text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">{pctVal.toFixed(0)}%</span>
                        <span className="text-white text-sm font-mono font-medium w-28 text-right">{fmt(item.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pctVal}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Pas de données</p>
          )}
        </div>
      </div>

      {/* Monthly Comparison Table */}
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>📅</span> Évolution Mensuelle
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Mois</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Revenu</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Main d&apos;oeuvre</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Ingénierie</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Matériel</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">S/Trait.</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Résultat</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Marge</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">Aucune donnée</td>
                </tr>
              ) : (
                snapshots.map((snap, idx) => {
                  const prev = idx > 0 ? snapshots[idx - 1] : null;
                  const resultDelta = prev && snap.result && prev.result ? snap.result - prev.result : null;
                  return (
                    <tr key={snap.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{snap.sheetName || monthName(snap.month)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(snap.totalRevenue)}</td>
                      <td className="px-4 py-3 text-right text-blue-300 font-mono text-xs">{fmt(snap.laborCost)}</td>
                      <td className="px-4 py-3 text-right text-purple-300 font-mono text-xs">{fmt(snap.engineeringCost)}</td>
                      <td className="px-4 py-3 text-right text-cyan-300 font-mono text-xs">{fmt(snap.materialCost)}</td>
                      <td className="px-4 py-3 text-right text-amber-300 font-mono text-xs">{fmt(snap.subcontractorCost)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs font-semibold ${(snap.result || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmt(snap.result)}
                        </span>
                        {resultDelta !== null && (
                          <span className={`ml-1 text-[10px] ${resultDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {resultDelta >= 0 ? '↑' : '↓'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs ${(snap.marginPercent || 0) >= 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pct(snap.marginPercent)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
