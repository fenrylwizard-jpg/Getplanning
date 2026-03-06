const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('password', 10);

  // 1. Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@worksite.com' },
    update: {},
    create: {
      email: 'admin@worksite.com',
      name: 'Adrien Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      xp: 0,
      level: 1,
    },
  });

  // 2. Create PM
  await prisma.user.upsert({
    where: { email: 'pm@worksite.com' },
    update: {},
    create: {
      email: 'pm@worksite.com',
      name: 'Pierre Manager',
      passwordHash: hashedPassword,
      role: 'PM',
      status: 'APPROVED',
      xp: 0,
      level: 1,
    },
  });

  // 3. Create SM
  await prisma.user.upsert({
    where: { email: 'sm@worksite.com' },
    update: {},
    create: {
      email: 'sm@worksite.com',
      name: 'Sam Site',
      passwordHash: hashedPassword,
      role: 'SM',
      status: 'APPROVED',
      xp: 0,
      level: 1,
      characterId: 1, // Defaulting to mason (1)
    },
  });

  console.log('Seeding complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
