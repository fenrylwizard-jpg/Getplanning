import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            select: { subLocations: true }
        });

        const tasks = await prisma.task.findMany({
            where: { projectId: id },
            orderBy: { description: 'asc' }
        });

        let subLocs: string[] = [];
        try {
            if (project?.subLocations) {
                subLocs = JSON.parse(project.subLocations);
            }
        } catch(e) { console.error("Could not parse sublocations", e) }

        return NextResponse.json({ tasks, subLocations: subLocs });
    } catch (err: unknown) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
}
