const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const projects = await prisma.project.findMany({
        include: {
            tasks: {
                select: { category: true, description: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    for (const p of projects) {
        console.log(`\nProject: ${p.name} (Created: ${p.createdAt})`);
        const cats = new Set(p.tasks.map(t => t.category));
        console.log(`Categories:`, Array.from(cats));
        
        // Let's find tasks in "Tableau de distribution" or "Tableaux Electriques"
        const tdTasks = p.tasks.filter(t => t.category.includes('Tableau'));
        console.log(`Tasks with 'Tableau' in category (${tdTasks.length}):`, tdTasks.slice(0, 3).map(t => `${t.category} -> ${t.description}`));
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
