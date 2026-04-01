const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.cookingRecipe.count();
    console.log("CookingRecipe Count:", count);
    if (count > 0) {
      console.log("Sample:", await prisma.cookingRecipe.findFirst());
    }
  } catch (e) {
    console.log("Failed:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
