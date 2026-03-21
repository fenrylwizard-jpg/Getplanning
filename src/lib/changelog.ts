/**
 * Changelog data for GetPlanning.
 * 
 * RULES:
 * - Each day with at least one deploy gets ONE version entry.
 * - Version format: 0.MAJOR.PATCH (incrementing PATCH per day).
 * - If multiple deploys happen the same day, add items to that day's entry.
 * - Most recent version first.
 */

export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

const changelog: ChangelogEntry[] = [
    {
        version: '0.1.5',
        date: '21 mars 2026',
        changes: [
            'Persistance des données de planification (PDF extrait)',
            'En-tête mois/année collante dans le planning Gantt',
            'Affichage des lignes de titre dans le planning',
            'Clôture hebdomadaire corrigée (semaines ISO)',
            'Rapport de synthèse hebdomadaire avec graphiques',
            'Bouton "Générer Rapport Hebdo PDF" fonctionnel',
            'Lien Historique dans l\'onglet Production',
            'Graphique admin: courbes cumulées Planifié vs Réalisé',
            'PM reçoit l\'XP de ses chefs de chantier',
            'Planning: taille de texte augmentée, meilleur contraste',
            'Planning: tâches 100% masquées automatiquement (bouton pour réafficher)',
            'Système de changelog automatique',
        ],
    },
    {
        version: '0.1.4',
        date: '20 mars 2026',
        changes: [
            'Fix productivité après suppression/resoumission de rapport',
            'Correction resoumission de rapport journalier',
            'Affichage productivité corrigé dans la page historique',
        ],
    },
    {
        version: '0.1.3',
        date: '19 mars 2026',
        changes: [
            'Admin peut supprimer plans et rapports depuis l\'historique',
            'Accès admin aux pages SM/PM des projets',
            'Fix rapport journalier bloqué',
            'Changelog sur la page de connexion',
        ],
    },
    {
        version: '0.1.2',
        date: '18 mars 2026',
        changes: [
            'Historique des rapports journaliers soumis',
            'Correction de la page historique (erreur 500)',
            'Amélioration qualité des images',
        ],
    },
    {
        version: '0.1.1',
        date: '17 mars 2026',
        changes: [
            'Planification multi-semaine (S+1, S+2, S+3)',
            'Rapports journaliers avec saisie par jour',
            'Système de rattrapage (backfill) pour jours manqués',
        ],
    },
];

export default changelog;
