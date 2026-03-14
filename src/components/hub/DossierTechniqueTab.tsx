import T from "@/components/T";
import { FolderCog, FileText, Upload, FolderOpen, Search } from "lucide-react";

interface DossierTechniqueTabProps {
    project: {
        revisions: { id: string; fileName: string; uploadedAt: Date; changesMade: string | null }[];
    };
}

export default function DossierTechniqueTab({ project }: DossierTechniqueTabProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                        <FolderCog size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2"><T k="hub_technique" /></h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto"><T k="hub_technique_desc" /></p>
                </div>
            </div>

            {/* Placeholder Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: Upload, label: "hub_upload_docs", desc: "hub_upload_docs_desc", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                    { icon: FolderOpen, label: "hub_document_library", desc: "hub_document_library_desc", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                    { icon: Search, label: "hub_search_docs", desc: "hub_search_docs_desc", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                ].map(({ icon: Icon, label, desc, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-6 flex flex-col items-center text-center`}>
                        <Icon size={28} className={`${color} mb-3`} />
                        <h4 className="text-sm font-bold text-white mb-1"><T k={label} /></h4>
                        <p className="text-xs text-gray-500"><T k={desc} /></p>
                    </div>
                ))}
            </div>

            {/* Revision Log (Real Data) */}
            <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" /> <T k="hub_revision_log" /> ({project.revisions.length})
                </h3>

                {project.revisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-40">
                        <FileText size={48} className="mb-3 text-gray-600" />
                        <p className="text-gray-500 text-sm font-bold"><T k="hub_no_revisions" /></p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {project.revisions.map((rev, idx) => (
                            <div key={rev.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                        R{project.revisions.length - idx}
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-200 font-bold">{rev.fileName}</span>
                                        {rev.changesMade && (
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rev.changesMade}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-bold">
                                    {new Date(rev.uploadedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
