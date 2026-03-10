import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const pw = await bcrypt.hash('password', 10)
  
  // Create or update antigravity accounts
  const pmUser = await prisma.user.upsert({
    where: { email: 'antigravity.pm@eeg.be' },
    update: {},
    create: { email: 'antigravity.pm@eeg.be', name: 'Antigravity PM', passwordHash: pw, role: 'PM', status: 'APPROVED' }
  });
  
  const smUser = await prisma.user.upsert({
    where: { email: 'antigravity.sm@eeg.be' },
    update: {},
    create: { email: 'antigravity.sm@eeg.be', name: 'Antigravity SM', passwordHash: pw, role: 'SM', status: 'APPROVED' }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'antigravity.admin@eeg.be' },
    update: {},
    create: { email: 'antigravity.admin@eeg.be', name: 'Antigravity Admin', passwordHash: pw, role: 'ADMIN', status: 'APPROVED' }
  });
  console.log(`Admin user created: ${adminUser.id}`);

  // Assign Herlin - Jupiter to antigravity
  await prisma.project.updateMany({
    data: {
      projectManagerId: pmUser.id,
      siteManagerId: smUser.id
    }
  });

  console.log("Antigravity accounts created/restored and all projects linked to them!");
}

main().finally(() => prisma.$disconnect());
