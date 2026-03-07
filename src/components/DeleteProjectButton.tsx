"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const pin = prompt(`Pour supprimer "${projectName}", veuillez entrer le code PIN :`);
        if (pin !== "645428") {
            if (pin !== null) toast.error("Code PIN incorrect.");
            return;
        }

        if (!confirm(`Confirmez-vous la suppression DÉFINITIVE de TOUTES les données du projet "${projectName}" ?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/project/${projectId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success(`Projet "${projectName}" supprimé.`);
                router.refresh();
            } else {
                toast.error("Erreur lors de la suppression du projet.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la suppression.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (projectName.toLowerCase().includes('herlin')) {
        return null;
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn flex items-center gap-2 justify-center bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-1.5 text-sm hover:bg-red-500/20 transition-colors"
        >
            <Trash2 size={16} />
            {isDeleting ? "Suppression..." : "Supprimer"}
        </button>
    );
}
