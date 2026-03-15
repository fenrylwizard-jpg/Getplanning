"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import T from "@/components/T";

interface FileUploadZoneProps {
    projectId: string;
    module: "planning" | "purchases" | "technique" | "finances";
    acceptTypes?: string;
    onUploadComplete?: (data: unknown) => void;
    icon?: React.ReactNode;
    title: string;
    subtitle: string;
    accentColor?: string;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export default function FileUploadZone({
    projectId,
    module,
    acceptTypes = ".xlsx,.xls,.pdf",
    onUploadComplete,
    icon,
    title,
    subtitle,
    accentColor = "purple",
}: FileUploadZoneProps) {
    const [state, setState] = useState<UploadState>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fileName, setFileName] = useState("");
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
        purple: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_40px_rgba(168,85,247,0.15)]" },
        emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]" },
        amber: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]" },
        indigo: { border: "border-indigo-500/40", bg: "bg-indigo-500/10", text: "text-indigo-400", glow: "shadow-[0_0_40px_rgba(99,102,241,0.15)]" },
        cyan: { border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-[0_0_40px_rgba(6,182,212,0.15)]" },
    };
    const colors = colorMap[accentColor] || colorMap.purple;

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setState("dragging");
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setState("idle");
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleUpload = useCallback(async (file: File) => {
        setFileName(file.name);
        setState("uploading");
        setProgress(0);

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/project/${projectId}/${module}/upload`, {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setProgress(100);

            // Check if any records were actually parsed
            const count = data.count ?? 0;
            if (count === 0) {
                setState("error");
                setErrorMessage(`Fichier reçu mais 0 enregistrement extrait. Vérifiez le format du fichier Excel (feuilles, colonnes).`);
                setTimeout(() => { setState("idle"); setProgress(0); }, 6000);
            } else {
                setState("success");
                setSuccessMessage(`${count} enregistrement${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} avec succès`);
                onUploadComplete?.(data);
                setTimeout(() => { setState("idle"); setProgress(0); setSuccessMessage(""); }, 5000);
            }
        } catch (err) {
            clearInterval(progressInterval);
            setState("error");
            setErrorMessage(err instanceof Error ? err.message : "Upload failed");
            setTimeout(() => {
                setState("idle");
                setProgress(0);
            }, 4000);
        }
    }, [projectId, module, onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const isPdf = acceptTypes.includes(".pdf");
    const FileIcon = isPdf ? FileText : FileSpreadsheet;

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => state === "idle" && fileInputRef.current?.click()}
            className={`
                relative overflow-hidden rounded-2xl border-2 border-dashed p-8 sm:p-12
                transition-all duration-500 cursor-pointer group
                ${state === "dragging"
                    ? `${colors.border} ${colors.bg} ${colors.glow} scale-[1.02]`
                    : state === "uploading"
                    ? "border-white/20 bg-white/5"
                    : state === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                    : state === "error"
                    ? "border-red-500/40 bg-red-500/10"
                    : `border-white/10 hover:${colors.border} hover:${colors.bg} hover:${colors.glow}`
                }
            `}
        >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${accentColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

            <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                {state === "idle" || state === "dragging" ? (
                    <>
                        <div className={`w-20 h-20 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                            {icon || <Upload size={36} className={colors.text} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                            <p className="text-sm text-gray-400">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                            <FileIcon size={14} />
                            <span><T k="hub_accepted_formats" />: {acceptTypes.replace(/\./g, "").toUpperCase()}</span>
                        </div>
                        {state === "dragging" && (
                            <div className={`text-sm font-bold ${colors.text} animate-pulse`}>
                                <T k="hub_drop_here" />
                            </div>
                        )}
                    </>
                ) : state === "uploading" ? (
                    <>
                        <Loader2 size={36} className={`${colors.text} animate-spin`} />
                        <div>
                            <p className="text-sm font-bold text-white">{fileName}</p>
                            <p className="text-xs text-gray-400 mt-1"><T k="hub_analyzing" />...</p>
                        </div>
                        <div className="w-full max-w-xs bg-white/5 h-2 rounded-full overflow-hidden mt-2">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r from-${accentColor}-500 to-${accentColor}-400 transition-all duration-300`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                ) : state === "success" ? (
                    <>
                        <CheckCircle2 size={36} className="text-emerald-400" />
                        <div>
                            <p className="text-sm font-bold text-emerald-400">{successMessage || <T k="hub_upload_success" />}</p>
                            <p className="text-xs text-gray-400 mt-1">{fileName}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <AlertCircle size={36} className="text-red-400" />
                        <div>
                            <p className="text-sm font-bold text-red-400"><T k="hub_upload_error" /></p>
                            <p className="text-xs text-gray-400 mt-1">{errorMessage}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
