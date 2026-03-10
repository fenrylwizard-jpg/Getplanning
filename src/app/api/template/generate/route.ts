import { NextResponse } from "next/server";
import * as XLSX from 'xlsx';

/**
 * GET /api/template/generate?zones=zone1&zones=zone2&...
 * Generates a downloadable Excel template with pre-filled zone columns.
 * Used when creating a NEW project (no project ID yet).
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const zoneNames = url.searchParams.getAll('zones').filter(z => z.trim());

        if (zoneNames.length === 0) {
            return NextResponse.json(
                { error: "At least one zone is required" },
                { status: 400 }
            );
        }

        // Build header row
        const headers = [
            'Poste',
            'Désignation',
            'Marché',
            'Unité',
            'Quantité',
            'temps de pose unitaire (min)',
            'temps total',
            ...zoneNames
        ];

        const emptyZones = zoneNames.map(() => '');

        // Build rows with title + header + example structure
        const rows = [
            ['', 'Bordereau de prix'],
            ['', 'Projet: [Nom du projet]'],
            [''],
            headers,
            // Example categories and items
            ['1', 'Cheminement', '', '', '', '', '', ...emptyZones],
            ['1.1', 'Chemin de câble', '', '', '', '', '', ...emptyZones],
            ['', 'Chemin de câble 300x60', 'QP', 'm', '', '20', '', ...emptyZones],
            ['', 'Chemin de câble 400x60', 'QP', 'm', '', '20', '', ...emptyZones],
            ['1.2', 'Goulotte', '', '', '', '', '', ...emptyZones],
            ['1.2', 'Tubage', '', '', '', '', '', ...emptyZones],
            ['2', 'Tirage Courant Fort', '', '', '', '', '', ...emptyZones],
            ['2.1', 'Cable de terre', '', '', '', '', '', ...emptyZones],
            ['2.2', 'Cable monobrin', '', '', '', '', '', ...emptyZones],
            ['2.3', 'Cable de puissance multibrins', '', '', '', '', '', ...emptyZones],
            ['3', 'Tirage courant faible', '', '', '', '', '', ...emptyZones],
            ['4', 'Equipement', '', '', '', '', '', ...emptyZones],
            ['4.1', 'Luminaires', '', '', '', '', '', ...emptyZones],
            ['4.2', 'Appareillage (y compris blochets)', '', '', '', '', '', ...emptyZones],
            ['4.3', 'Courant Faible', '', '', '', '', '', ...emptyZones],
            ['5', 'Règles', '', '', '', '', '', ...emptyZones],
            ['', 'Ouvrier (tirage câble, tubage, CDC, prises..)', 'QP', 'hr', '', '', '', ...emptyZones],
            ['', 'Câbleur (raccordements tableau)', 'QP', 'hr', '', '', '', ...emptyZones],
            ['', "Chef d'équipe", 'QP', 'hr', '', '', '', ...emptyZones],
        ];

        // Create worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Set column widths
        ws['!cols'] = [
            { wch: 8 },   // Poste
            { wch: 50 },  // Désignation
            { wch: 10 },  // Marché
            { wch: 8 },   // Unité
            { wch: 12 },  // Quantité
            { wch: 30 },  // temps de pose unitaire
            { wch: 14 },  // temps total
            ...zoneNames.map(() => ({ wch: 14 }))
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Bordereau');

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new Response(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="bordereau_template.xlsx"',
            }
        });

    } catch (error) {
        console.error("Template generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate template" },
            { status: 500 }
        );
    }
}
