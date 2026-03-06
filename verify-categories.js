const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: { contains: 'Herlin' } },
        include: { tasks: { take: 20 } }
    });

    if (!project) {
        console.log('Project not found');
        return;
    }

    console.log(`Project: ${project.name}`);
    console.log('--- TASK CATEGORIES SAMPLE ---');
    const categories = Array.from(new Set(project.tasks.map(t => t.category)));
    console.log('Unique categories found in sample:', categories);
    
    project.tasks.forEach(t => {
        console.log(`- Category: [${t.category}] | Desc: ${t.description.substring(0, 50)}...`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
