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

  let out = `Total users: ${users.length}\n\n`;
  for (const user of users) {
    if (user.projectsAsPM.length > 0 || user.projectsAsSM.length > 0) {
      out += `✅ HAS PROJECT: User: ${user.email} (role: ${user.role}) name: ${user.name} - PM for ${user.projectsAsPM.length} projects, SM for ${user.projectsAsSM.length} projects\n`;
    } else {
      out += `❌ NO PROJECT:  User: ${user.email} (role: ${user.role}) name: ${user.name}\n`;
    }
  }
  
  const projects = await prisma.project.findMany({
    include: {
      projectManager: true,
      siteManager: true
    }
  });
  out += `\nTotal projects: ${projects.length}\n`;
  for (const p of projects) {
    out += `Project: ${p.name} - PM: ${p.projectManager?.email} SM: ${p.siteManager?.email}\n`;
  }
  
  fs.writeFileSync('output2.txt', out);
}

main().finally(() => prisma.$disconnect());
