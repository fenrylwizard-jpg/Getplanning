import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany();
  console.log("ALL USERS IN DB:", users.map(u => u.email));
}

main().finally(() => prisma.$disconnect());
