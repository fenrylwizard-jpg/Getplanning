"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdminDeletePlanButton({ planId, projectId, weekNumber, year }: { planId: string; projectId: string; weekNumber: number; year: number }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Supprimer la planification S${weekNumber} (${year}) ? Cette action est irréversible.`)) return;
        
        setDeleting(true);
        try {
            const res = await fetch(`/api/project/${projectId}/plan/admin-delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            if (res.ok) {
                toast.success(`Planification S${weekNumber} supprimée`);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            title="Supprimer cette planification (Admin)"
            className="absolute top-3 right-3 z-20 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all disabled:opacity-50 group/del"
        >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}

export function AdminDeleteReportButton({ reportId, projectId, reportDate }: { reportId: string; projectId: string; reportDate: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const dateStr = new Date(reportDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const handleDelete = async () => {
        if (!confirm(`Supprimer le rapport du ${dateStr} ? Cette action est irréversible.`)) return;
        
        setDeleting(true);
        try {
            const res = await fetch(`/api/project/${projectId}/report/admin-delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });

            if (res.ok) {
                toast.success(`Rapport du ${dateStr} supprimé`);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur réseau');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            title="Supprimer ce rapport (Admin)"
            className="absolute top-3 right-3 z-20 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all disabled:opacity-50"
        >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}
