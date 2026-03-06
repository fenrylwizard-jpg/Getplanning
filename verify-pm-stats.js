const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: 'Herlin - Jupiter' },
        include: {
            tasks: true
        }
    });

    if (!project) return console.log('Project not found');

    const totalBudgetHours = project.tasks.reduce((acc, t) => acc + (t.quantity * t.minutesPerUnit / 60), 0);
    const totalRealizedHours = project.tasks.reduce((acc, t) => acc + (t.completedQuantity * t.minutesPerUnit / 60), 0);
    const hourlyRate = 43.35;

    console.log(`Project: ${project.name}`);
    console.log(`Total Budget Hours: ${totalBudgetHours.toFixed(2)}h`);
    console.log(`Total Realized Hours: ${totalRealizedHours.toFixed(2)}h`);
    console.log(`Budget MO: ${(totalBudgetHours * hourlyRate).toLocaleString('fr-FR')} €`);
    console.log(`Valorisé: ${(totalRealizedHours * hourlyRate).toLocaleString('fr-FR')} €`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
