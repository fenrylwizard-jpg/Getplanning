import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const pw = await bcrypt.hash('password', 10)
  
  // Create simple antigravity accounts
  const pmUser = await prisma.user.upsert({
    where: { email: 'antigravity@eeg.be' },
    update: { passwordHash: pw },
    create: { email: 'antigravity@eeg.be', name: 'Antigravity (PM)', passwordHash: pw, role: 'PM', status: 'APPROVED' }
  });

  console.log("Created/Updated simpler user: antigravity@eeg.be (password: password)");
}

main().finally(() => prisma.$disconnect());
