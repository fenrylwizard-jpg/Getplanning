'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface UploadResult {
  success: boolean;
  results: { purchases: number; finances: number; etudes: number };
  error?: string;
}

export default function HubUploadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId') || '';
  
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [files, setFiles] = useState<{ purchases: File | null; finances: File | null; etudes: File | null }>({
    purchases: null, finances: null, etudes: null,
  });
  
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = useCallback((type: 'purchases' | 'finances' | 'etudes') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) setFiles(prev => ({ ...prev, [type]: file }));
  }, []);

  const handleFileSelect = (type: 'purchases' | 'finances' | 'etudes') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleUpload = async () => {
    if (!projectId) return;
    setUploading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('month', `${month}-01`);
      
      if (files.purchases) formData.append('purchasesFile', files.purchases);
      if (files.finances) formData.append('financesFile', files.finances);
      if (files.etudes) formData.append('etudesFile', files.etudes);
      
      const res = await fetch('/api/upload/hub-files', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResult({ success: true, results: data.results });
      
      // Force a page reload after short delay so the layout's status banner refreshes
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setResult({ success: false, results: { purchases: 0, finances: 0, etudes: 0 }, error: message });
    } finally {
      setUploading(false);
    }
  };

  const fileZones = [
    { key: 'purchases' as const, label: 'Comparatif Achats', icon: '🛒', accept: '.xlsx,.xls', desc: 'Fichier Comparatif achats (.xlsx)' },
    { key: 'finances' as const, label: 'Suivi Financier', icon: '💰', accept: '.xlsx,.xls', desc: 'Fichier Suivi financier (.xlsx)' },
    { key: 'etudes' as const, label: 'Suivi des Études', icon: '📋', accept: '.xlsx,.xlsm,.xls', desc: 'Fichier Suivi des études (.xlsm)' },
  ];

  const hasAnyFile = files.purchases || files.finances || files.etudes;

  if (!projectId) {
    return (
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-12 text-center">
        <div className="text-4xl mb-4">📤</div>
        <p className="text-gray-400 text-lg">Sélectionnez un projet dans le menu ci-dessus pour importer des fichiers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <div className="max-w-xs">
          <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Mois</label>
          <input
            type="text"
            title="Mois (format: YYYY-MM)"
            placeholder="YYYY-MM"
            pattern="\d{4}-\d{2}"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="w-full bg-[#060d1f] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* File Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fileZones.map(zone => (
          <div
            key={zone.key}
            onDragOver={e => { e.preventDefault(); setDragOver(zone.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={handleDrop(zone.key)}
            className={`relative bg-[#0a1a35]/60 backdrop-blur-sm rounded-2xl border-2 border-dashed p-8 transition-all duration-200 text-center ${
              dragOver === zone.key
                ? 'border-blue-400 bg-blue-500/5 scale-[1.02]'
                : files[zone.key]
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-4xl mb-4">{zone.icon}</div>
            <h4 className="text-white font-semibold mb-1">{zone.label}</h4>
            <p className="text-gray-500 text-xs mb-4">{zone.desc}</p>
            
            {files[zone.key] ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-emerald-300 text-sm truncate max-w-[200px]">{files[zone.key]!.name}</span>
                </div>
                <button
                  onClick={() => setFiles(prev => ({ ...prev, [zone.key]: null }))}
                  className="text-red-400 text-xs hover:text-red-300 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm cursor-pointer hover:bg-white/10 transition-colors">
                <span>📎</span> Choisir un fichier
                <input
                  type="file"
                  accept={zone.accept}
                  onChange={handleFileSelect(zone.key)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div className="flex justify-center">
        <button
          onClick={handleUpload}
          disabled={!projectId || !hasAnyFile || uploading}
          className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            !projectId || !hasAnyFile || uploading
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-100'
          }`}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>📤 Importer les fichiers</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-6 ${
          result.success
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          {result.success ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h4 className="text-emerald-300 font-semibold">Import réussi !</h4>
              <div className="flex justify-center gap-6">
                {result.results.purchases > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{result.results.purchases}</p>
                    <p className="text-gray-400 text-xs">Catégories d&apos;achat</p>
                  </div>
                )}
                {result.results.finances > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{result.results.finances}</p>
                    <p className="text-gray-400 text-xs">Snapshots financiers</p>
                  </div>
                )}
                {result.results.etudes > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{result.results.etudes}</p>
                    <p className="text-gray-400 text-xs">Documents d&apos;études</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-4xl">❌</div>
              <h4 className="text-red-300 font-semibold">Erreur d&apos;import</h4>
              <p className="text-red-400 text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
