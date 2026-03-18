'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PurchaseCategory {
  id: string;
  category: string;
  peInitials: string | null;
  status: string | null;
  isInterco: boolean;
  inProgress: boolean;
  offerPriceSoum: number | null;
  commercialDiscount: number | null;
  hypothesisInjected: number | null;
  costPrice: number | null;
  supplierSoum: string | null;
  supplierExe: string | null;
  negotiatedPrice: number | null;
  returnAmount: number | null;
  comments: string | null;
}

const fmt = (val: number | null) => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
};

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    if (!projectId) { 
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    fetch(`/api/hub/purchases?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setCategories(d.categories || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  const filtered = categories.filter(c => {
    if (filter === 'active') return c.inProgress;
    if (filter === 'pending') return !c.inProgress && c.offerPriceSoum === 0;
    return true;
  });

  // Summary calculations
  const totalBudget = categories.reduce((s, c) => s + (c.offerPriceSoum || 0), 0);
  const totalNegotiated = categories.reduce((s, c) => s + (c.negotiatedPrice || 0), 0);
  const totalReturn = categories.reduce((s, c) => s + (c.returnAmount || 0), 0);
  const totalCost = categories.reduce((s, c) => s + (c.costPrice || 0), 0);

  if (!projectId) {
    return (
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-md border border-white/5 p-12 text-center">
        <p className="text-gray-400 text-lg">Sélectionnez un projet pour voir les achats</p>
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Budget Soumission', value: fmt(totalBudget), icon: '📊', color: 'from-blue-500/20 to-blue-600/10' },
          { label: 'Coût de Revient', value: fmt(totalCost), icon: '💳', color: 'from-purple-500/20 to-purple-600/10' },
          { label: 'Prix Négocié', value: fmt(totalNegotiated), icon: '🤝', color: 'from-cyan-500/20 to-cyan-600/10' },
          { label: 'RETURN Total', value: fmt(totalReturn), icon: totalReturn >= 0 ? '📈' : '📉', color: totalReturn >= 0 ? 'from-emerald-500/20 to-emerald-600/10' : 'from-red-500/20 to-red-600/10' },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-md border border-white/5 p-5`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{card.icon}</span>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
            </div>
            <p className="text-white text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'active' ? 'En cours' : 'En attente'} ({
              f === 'all' ? categories.length : f === 'active' ? categories.filter(c => c.inProgress).length : categories.filter(c => !c.inProgress && c.offerPriceSoum === 0).length
            })
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-md border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Catégorie</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Prix Soumission</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Coût Revient</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Fourn. SOUM</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Fourn. EXE</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Prix Négocié</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">RETURN</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Commentaires</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Aucune donnée d&apos;achats disponible
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.inProgress && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        <span className="text-white font-medium">{c.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.offerPriceSoum)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.costPrice)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{c.supplierSoum || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.supplierExe ? (
                        <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
                          c.supplierExe !== c.supplierSoum ? 'bg-amber-500/15 text-amber-300' : 'bg-white/5 text-gray-300'
                        }`}>
                          {c.supplierExe}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.negotiatedPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-xs font-semibold ${
                        (c.returnAmount || 0) > 0 ? 'text-emerald-400' : (c.returnAmount || 0) < 0 ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {fmt(c.returnAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate" title={c.comments || ''}>
                      {c.comments || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-bold">TOTAL</td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalBudget)}</td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalCost)}</td>
                  <td colSpan={2} className="px-4 py-3" />
                  <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalNegotiated)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-xs font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(totalReturn)}
                    </span>
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
