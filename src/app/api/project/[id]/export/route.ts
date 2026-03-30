import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                subLocations: true,
                tasks: {
                    orderBy: { taskCode: 'asc' },
                    select: {
                        taskCode: true,
                        category: true,
                        description: true,
                        unit: true,
                        quantity: true,
                        completedQuantity: true,
                        minutesPerUnit: true,
                    }
                }
            }
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
            'Quantité réalisée',
            'Heures réalisées',
            ...zoneNames
        ];

        // Group tasks by category
        const categories = new Map<string, typeof project.tasks>();
        for (const task of project.tasks) {
            if (!categories.has(task.category)) {
                categories.set(task.category, []);
            }
            categories.get(task.category)!.push(task);
        }

        // Build rows
        const rows: (string | number)[][] = [
            ['', `Bordereau de prix`],
            ['', `Projet: ${project.name}`],
            [''],
            headers,
        ];

        let catIndex = 1;
        for (const [category, tasks] of categories) {
            // Category header row
            rows.push([String(catIndex), category, '', '', '', '', '', '', '', ...zoneNames.map(() => '')]);

            for (const task of tasks) {
                const poste = task.taskCode.split('_')[0] || '';
                const totalMinutes = task.quantity * task.minutesPerUnit;
                const completedHours = (task.completedQuantity * task.minutesPerUnit) / 60;

                rows.push([
                    poste,
                    task.description,
                    'QP',
                    task.unit,
                    task.quantity,
                    task.minutesPerUnit,
                    Math.round(totalMinutes * 100) / 100,
                    task.completedQuantity,
                    Math.round(completedHours * 100) / 100,
                    ...zoneNames.map(() => ''),
                ]);
            }
            catIndex++;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);

        ws['!cols'] = [
            { wch: 8 },   // Poste
            { wch: 45 },  // Désignation
            { wch: 10 },  // Marché
            { wch: 8 },   // Unité
            { wch: 12 },  // Quantité
            { wch: 30 },  // temps de pose unitaire
            { wch: 14 },  // temps total
            { wch: 16 },  // Quantité réalisée
            { wch: 16 },  // Heures réalisées
            ...zoneNames.map(() => ({ wch: 14 })),
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Bordereau');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const filename = `export_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        return new Response(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            }
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to export" },
            { status: 500 }
        );
    }
}
