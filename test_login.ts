import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'antigravity.pm@eeg.be';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("User found:", user);
  const isMatch = await bcrypt.compare("password", user.passwordHash);
  console.log("Password match for 'password':", isMatch);
}

main().finally(() => prisma.$disconnect());
