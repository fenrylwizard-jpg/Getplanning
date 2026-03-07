import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List templates for a project
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const projectId = url.searchParams.get('projectId');
        
        if (!projectId) {
            return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
        }

        const templates = await prisma.planTemplate.findMany({
            where: { projectId },
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: { select: { name: true } }
            }
        });

        return NextResponse.json({ templates });
    } catch (err) {
        console.error('Error fetching templates:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST: Save a new template
export async function POST(req: Request) {
    try {
        const { name, projectId, createdById, taskSelections } = await req.json();

        if (!name || !projectId || !createdById || !taskSelections) {
            return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
        }

        const template = await prisma.planTemplate.create({
            data: {
                name,
                projectId,
                createdById,
                taskSelections: JSON.stringify(taskSelections),
            }
        });

        return NextResponse.json({ template });
    } catch (err) {
        console.error('Error creating template:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
