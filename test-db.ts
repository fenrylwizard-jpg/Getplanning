import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        where: { name: { contains: 'Herlin' } }
    });

    for (const p of projects) {
        console.log(`\nProject: ${p.name} (${p.id})`);
        const reports = await prisma.dailyReport.findMany({
            where: { projectId: p.id }
        });
        for (const r of reports) {
            console.log(`  Report ID: ${r.id} | Date: ${r.date.toISOString()} | Status: ${r.status}`);
        }
    }
}

main().finally(() => prisma.$disconnect());
