const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { email: true, name: true, role: true, level: true, xp: true, characterId: true } });
    const projects = await prisma.project.findMany({ select: { id: true, name: true } });
    const summary = {
      users: users.map(u => `${u.email} | ${u.name} | ${u.role} | Lvl:${u.level} | XP:${u.xp} | CID:${u.characterId}`),
      projects: projects.map(p => `${p.id} | ${p.name}`)
    };
    require('fs').writeFileSync('concise_state.txt', JSON.stringify(summary, null, 2));
}

main().finally(() => prisma.$disconnect());
