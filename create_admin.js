const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@worksite.com';
  const password = 'password';
  const name = 'Administrateur';
  const role = 'ADMIN';

  console.log(`Checking if user ${email} already exists...`);
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Updating role to ADMIN.`);
    await prisma.user.update({
      where: { email },
      data: { role, status: 'APPROVED' }
    });
  } else {
    console.log(`Creating new admin user: ${email}`);
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        status: 'APPROVED'
      }
    });
  }
  console.log('---RESULT_START---');
  console.log('ADMIN_CREATED: true');
  console.log('---RESULT_END---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
