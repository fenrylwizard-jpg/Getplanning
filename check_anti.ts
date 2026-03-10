import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany();
  const antiUsers = users.filter(u => u.email.toLowerCase().includes('antigravity'));
  console.log("Antigravity users found:", antiUsers);
}

main().finally(() => prisma.$disconnect());
