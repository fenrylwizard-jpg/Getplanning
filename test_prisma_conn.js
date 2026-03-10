const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Success! Connected to:", process.env.DATABASE_URL || "unknown");
  } catch (e) {
    console.log("Failed to connect:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
