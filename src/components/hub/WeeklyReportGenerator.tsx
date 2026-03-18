"use client";

import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

export default function WeeklyReportGenerator({ project }: { project: any }) {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleGeneratePDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);

        try {
            // Dynamically import html2pdf to avoid Next.js SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const element = reportRef.current;
            
            // Temporarily make it visible for capture
            element.classList.remove('hidden');

            const opt = {
                margin:       10,
                filename:     `Rapport_Hebdo_${project.name}_${new Date().toISOString().split('T')[0]}.pdf`,
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            // Hide it again
            if (reportRef.current) {
                reportRef.current.classList.add('hidden');
            }
            setIsGenerating(false);
        }
    };

    // Prepare data for the report
    const latestPlan = project.weeklyPlans?.sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.weekNumber - a.weekNumber;
    })[0];

    const today = new Date().toLocaleDateString('fr-FR');

    return (
        <>
            <button 
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="btn btn-primary flex items-center gap-2"
            >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                Générer Rapport Hebdo PDF
            </button>

            {/* Hidden container for the PDF content */}
            <div className="hidden">
                <div ref={reportRef} className="bg-white text-black p-8 w-[210mm] min-h-[297mm] mx-auto box-border" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                    
                    {/* Header */}
                    <div className="border-b-4 border-cyan-600 pb-4 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 m-0">RAPPORT HEBDOMADAIRE</h1>
                            <h2 className="text-xl text-cyan-700 font-bold mt-2">{project.name}</h2>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                            <p><strong>Date:</strong> {today}</p>
                            <p><strong>Référence:</strong> PRJ-{project.id.substring(0,8).toUpperCase()}</p>
                            {latestPlan && <p><strong>Semaine:</strong> {latestPlan.weekNumber} / {latestPlan.year}</p>}
                        </div>
                    </div>

                    {/* Project Status Summary */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Statut Global</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Budget Initial</p>
                                <p className="text-xl font-bold text-slate-800">{project.totalBudgetHours} h</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Temps Consommé (Global)</p>
                                <p className="text-xl font-bold text-slate-800">{project.totalEarnedHours?.toLocaleString()} h</p>
                            </div>
                        </div>
                    </div>

                    {/* Latest Weekly Plan Details */}
                    {latestPlan ? (
                        <div className="mb-8 pl-1"> {/* page-break-inside: avoid logic could be added here */}
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Dernier Point - Semaine {latestPlan.weekNumber}</h3>
                            
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                        <th className="p-2 border border-slate-200">Poste / Tâche</th>
                                        <th className="p-2 border border-slate-200 text-center">Prévu</th>
                                        <th className="p-2 border border-slate-200 text-center">Réalisé</th>
                                        <th className="p-2 border border-slate-200 text-center">Efficacité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestPlan.tasks.map((pt: any, i: number) => {
                                        const percent = pt.plannedQuantity > 0 
                                            ? Math.round((pt.actualQuantity / pt.plannedQuantity) * 100) 
                                            : 0;
                                        
                                        const color = percent >= 90 ? 'text-green-600' : percent >= 70 ? 'text-amber-500' : 'text-red-500';

                                        return (
                                            <tr key={i} className="border-b border-slate-200">
                                                <td className="p-2 border-r border-slate-200 font-medium">{pt.task.description}</td>
                                                <td className="p-2 border-r border-slate-200 text-center text-slate-600">{pt.plannedQuantity}</td>
                                                <td className="p-2 border-r border-slate-200 text-center font-bold">{pt.actualQuantity}</td>
                                                <td className={`p-2 text-center font-bold ${color}`}>{percent}%</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            
                            {latestPlan.notes && (
                                <div className="mt-4 p-4 bg-amber-50 rounded-lg text-sm border border-amber-100">
                                    <strong>Commentaires du Chef de Chantier :</strong><br />
                                    <p className="mt-1 whitespace-pre-wrap">{latestPlan.notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic mb-8">Aucun historique hebdomadaire disponible pour ce chantier.</p>
                    )}

                    {/* Finances Issues / Remarques */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Problèmes & Remarques (Administration)</h3>
                        <p className="text-sm text-slate-600">
                            Ce document est généré de manière automatique et certifie de l&apos;état d&apos;avancement du projet {project.name} à la date du {today}. Pour toute anomalie constatée sur les quantitatifs, merci de vous rapprocher de la direction de projet ou de laisser un commentaire directement dans la plateforme Worksite Tracker.
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between">
                        <div className="text-center w-1/2">
                            <p className="font-bold text-slate-800 mb-16">Le Chef de Projet</p>
                            <div className="border-b border-slate-300 w-32 mx-auto"></div>
                        </div>
                        <div className="text-center w-1/2">
                            <p className="font-bold text-slate-800 mb-16">Le Conducteur de Travaux / Client</p>
                            <div className="border-b border-slate-300 w-32 mx-auto"></div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </>
    );
}
