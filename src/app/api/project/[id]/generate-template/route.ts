import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch project with sub-locations
        const project = await prisma.project.findUnique({
            where: { id },
            include: { subLocations: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const zoneNames = project.subLocations.map(sl => sl.name);

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

        // Build example category/data rows
        const exampleRows = [
            // Title rows  
            ['', `Bordereau de prix`],
            ['', `Projet: ${project.name}`],
            [''],
            headers,
            // Example categories and items (empty - PM fills these in)
            ['1', 'Cheminement', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['1.1', 'Chemin de câble', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['', 'Chemin de câble 300x60', 'QP', 'm', '', '', '', ...zoneNames.map(() => '')],
            ['', 'Chemin de câble 400x60', 'QP', 'm', '', '', '', ...zoneNames.map(() => '')],
            ['2', 'Tirage Courant Fort', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['2.1', 'Cable de terre', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['', '', 'QP', 'm', '', '', '', ...zoneNames.map(() => '')],
            ['3', 'Tirage courant faible', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['4', 'Equipement', '', '', '', '', '', ...zoneNames.map(() => '')],
            ['5', 'Règles', '', '', '', '', '', ...zoneNames.map(() => '')],
        ];

        // Create worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(exampleRows);

        // Set column widths
        ws['!cols'] = [
            { wch: 8 },   // Poste
            { wch: 45 },  // Désignation
            { wch: 10 },  // Marché
            { wch: 8 },   // Unité
            { wch: 12 },  // Quantité
            { wch: 30 },  // temps de pose unitaire
            { wch: 14 },  // temps total
            ...zoneNames.map(() => ({ wch: 14 }))  // zones
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Bordereau');

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Return as downloadable file
        const filename = `bordereau_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        return new Response(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
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
