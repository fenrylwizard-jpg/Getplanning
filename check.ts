import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: {
      projectsAsPM: true,
      projectsAsSM: true,
    }
  });

  let out = "";
  for (const user of users) {
    if (user.projectsAsPM.length > 0 || user.projectsAsSM.length > 0) {
      out += `✅ HAS PROJECT: User: ${user.email} (role: ${user.role}) - PM for ${user.projectsAsPM.length} projects, SM for ${user.projectsAsSM.length} projects\n`;
    } else {
      out += `❌ NO PROJECT:  User: ${user.email} (role: ${user.role})\n`;
    }
  }
  fs.writeFileSync('output.txt', out);
}

main().finally(() => prisma.$disconnect());
