'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface EtudeTask {
  id: string;
  wbs: string | null;
  activity: string;
  assignedTo: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number | null;
  status: string | null;
  progress: number | null;
}

interface Summary {
  total: number;
  averageProgress: number;
  byStatus: Record<string, number>;
  byAssignee: Record<string, { total: number; avgProgress: number }>;
}

const getStatusColor = (status: string | null) => {
  if (!status) return { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };
  const s = status.toLowerCase();
  if (s.includes('termin')) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (s.includes('cours') || s.includes('progress')) return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
  if (s.includes('tard') || s.includes('retard')) return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' };
  if (s.includes('attent') || s.includes('venir') || s.includes('planifi')) return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
  return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
};

const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-gray-600 text-xs">—</span>;
  const config = getStatusColor(status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {status}
    </span>
  );
};

export default function EtudesPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [tasks, setTasks] = useState<EtudeTask[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/hub/etudes?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => {
        setTasks(d.tasks || []);
        setSummary(d.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const filtered = tasks.filter(t => {
    const assignee = t.assignedTo || 'Non assigné';
    if (filterAssignee !== 'all' && assignee !== filterAssignee) return false;
    const status = t.status || 'Non défini';
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    return true;
  });

  const assignees = Object.keys(summary?.byAssignee || {}).sort();

  if (!projectId) {
    return (
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-12 text-center">
        <p className="text-gray-400 text-lg">Sélectionnez un projet pour voir le planning des études</p>
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
      {/* Global Progress Header */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-1">Avancement Global</h3>
            <p className="text-blue-200/60 text-sm">Progression moyenne de toutes les tâches d&apos;ingénierie</p>
          </div>
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white font-medium">{Math.round(summary.averageProgress)}%</span>
              <span className="text-white/50">{summary.total} tâches au total</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${summary.averageProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards by Assignee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {assignees.map(assignee => {
          const stats = summary!.byAssignee[assignee];
          return (
            <button
              key={assignee}
              onClick={() => setFilterAssignee(filterAssignee === assignee ? 'all' : assignee)}
              className={`bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl border p-5 text-left transition-all hover:border-white/15 ${
                filterAssignee === assignee ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                  {assignee.substring(0, 2)}
                </div>
                <h4 className="text-white font-medium text-sm truncate max-w-[120px]" title={assignee}>{assignee}</h4>
                <span className="text-gray-500 text-xs ml-auto bg-white/5 px-2 py-1 rounded-md">{stats.total} t.</span>
              </div>
              
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.avgProgress}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 text-right">
                {Math.round(stats.avgProgress)}% achevé
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Filter Overview */}
      {summary && (
        <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl border border-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Tous ({summary.total})
            </button>
            {Object.entries(summary.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const config = getStatusColor(status);
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    filterStatus === status
                      ? `${config.bg} ${config.text} ${config.border}`
                      : `text-gray-400 hover:${config.text} border-transparent hover:border-white/10`
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase w-16">#</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Activité</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Assigné à</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Dates</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Durée</th>
                <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase w-32">Statut</th>
                <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase w-24">Progression</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Aucune tâche trouvée
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {t.wbs || '—'}
                    </td>
                    <td className="px-4 py-3 text-white text-sm max-w-[300px]">
                      <div className="font-medium truncate" title={t.activity}>
                        {t.activity}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-xs px-2 py-1 bg-white/5 rounded-md">
                        {t.assignedTo || 'Non assigné'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString('fr-FR') : '—'}
                      <span className="mx-1 text-gray-600">→</span>
                      {t.endDate ? new Date(t.endDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {t.duration != null ? `${t.duration} j` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.progress !== null && t.progress !== undefined ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-emerald-400 font-mono">{Math.round(t.progress)}%</span>
                          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }} 
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 text-gray-500 text-xs">
            {filtered.length} tâche{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
