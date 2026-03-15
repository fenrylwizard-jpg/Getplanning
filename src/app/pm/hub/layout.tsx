'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
}

interface UploadStatus {
  upload: {
    purchasesFile: string | null;
    financesFile: string | null;
    etudesFile: string | null;
    uploadedAt: string;
    month: string;
  } | null;
  counts: {
    purchases: number;
    finances: number;
    etudes: number;
  };
}

const tabs = [
  { label: 'Achats', path: 'purchases', icon: '🛒' },
  { label: 'Finances', path: 'finances', icon: '💰' },
  { label: 'Études', path: 'etudes', icon: '📋' },
  { label: 'Upload', path: 'upload', icon: '📤' },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Load projects list
  useEffect(() => {
    fetch('/api/project')
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  // Load upload status when project changes
  useEffect(() => {
    if (!projectId) {
      setUploadStatus(null);
      return;
    }
    setLoadingStatus(true);
    fetch(`/api/hub/upload-status?projectId=${projectId}`)
      .then(r => r.json())
      .then(d => { setUploadStatus(d); setLoadingStatus(false); })
      .catch(() => setLoadingStatus(false));
  }, [projectId]);

  const handleProjectChange = (newProjectId: string) => {
    // Get the current tab path segment
    const segments = pathname.split('/');
    const currentTab = segments[segments.length - 1] || 'purchases';
    const validTab = tabs.some(t => t.path === currentTab) ? currentTab : 'purchases';

    if (newProjectId) {
      router.push(`/pm/hub/${validTab}?projectId=${newProjectId}`);
    } else {
      router.push(`/pm/hub/${validTab}`);
    }
  };

  const buildTabHref = (tabPath: string) => {
    return projectId ? `/pm/hub/${tabPath}?projectId=${projectId}` : `/pm/hub/${tabPath}`;
  };

  const fileStatuses = [
    { key: 'purchases', label: 'Achats', icon: '🛒', file: uploadStatus?.upload?.purchasesFile, count: uploadStatus?.counts?.purchases || 0 },
    { key: 'finances', label: 'Finances', icon: '💰', file: uploadStatus?.upload?.financesFile, count: uploadStatus?.counts?.finances || 0 },
    { key: 'etudes', label: 'Études', icon: '📋', file: uploadStatus?.upload?.etudesFile, count: uploadStatus?.counts?.etudes || 0 },
  ];

  const uploadDate = uploadStatus?.upload?.uploadedAt
    ? new Date(uploadStatus.upload.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-[#060d1f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Hub Projet</h1>
          <p className="text-gray-400 text-sm">Suivi financier, achats et études techniques</p>
        </div>

        {/* Project Selector */}
        <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl border border-white/5 p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
              Projet actif
            </label>
            <select
              value={projectId}
              onChange={e => handleProjectChange(e.target.value)}
              className="flex-1 w-full sm:w-auto bg-[#060d1f] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Sélectionnez un projet...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File Import Status Banner */}
        {projectId && !loadingStatus && uploadStatus && (
          <div className="bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl border border-white/5 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📁</span>
              <h3 className="text-white text-sm font-semibold">Fichiers importés</h3>
              {uploadDate && (
                <span className="text-gray-500 text-xs ml-auto">
                  Dernier import : {uploadDate}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fileStatuses.map(fs => {
                const isActive = !!fs.file || fs.count > 0;
                return (
                  <div
                    key={fs.key}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <span className="text-lg">{fs.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <span className="text-emerald-400 text-xs font-semibold">✓ Actif</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Non importé</span>
                        )}
                      </div>
                      {isActive ? (
                        <p className="text-gray-400 text-[10px] truncate" title={fs.file || undefined}>
                          {fs.file || `${fs.count} enregistrement${fs.count > 1 ? 's' : ''}`}
                          {fs.file && fs.count > 0 && ` — ${fs.count} enregistrement${fs.count > 1 ? 's' : ''}`}
                        </p>
                      ) : (
                        <p className="text-gray-600 text-[10px]">Aucun fichier {fs.label.toLowerCase()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-[#0a1a35]/60 backdrop-blur-sm rounded-xl p-1.5 border border-white/5">
          {tabs.map(tab => {
            const tabHref = `/pm/hub/${tab.path}`;
            const isActive = pathname === tabHref || pathname?.startsWith(tabHref + '/');
            return (
              <Link
                key={tab.path}
                href={buildTabHref(tab.path)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}
