import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { name, pmEmail, siteManagerId, location, subLocations, startDate, endDate } = await req.json();

        const pm = await prisma.user.findUnique({ where: { email: pmEmail } });

        if (!pm) return NextResponse.json({ error: "PM not found" }, { status: 404 });

        const proj = await prisma.project.create({
            data: {
                name: name,
                location: location || null,
                ...(subLocations && Array.isArray(subLocations) && subLocations.length > 0
                    ? { subLocations: { create: subLocations.map((s: string) => ({ name: s })) } }
                    : {}),
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                projectManagerId: pm.id,
                siteManagerId: siteManagerId || null,
            }
        });

        return NextResponse.json({ success: true, projectId: proj.id });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
