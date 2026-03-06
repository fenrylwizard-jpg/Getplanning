const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const projects = await prisma.project.findMany();
    console.log(JSON.stringify({ users, projects }, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
