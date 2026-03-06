const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true, level: true, xp: true, characterId: true }
    });
    console.log('--- USERS ---');
    console.table(users);

    const projects = await prisma.project.findMany({
        select: { id: true, name: true, projectManagerId: true, siteManagerId: true }
    });
    console.log('--- PROJECTS ---');
    console.table(projects);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
