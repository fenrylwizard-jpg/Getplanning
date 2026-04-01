import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.cookingRecipe.count();
    console.log(`Recipes in DB: ${count}`);
    
    // Also log the first one if any
    if (count > 0) {
        const first = await prisma.cookingRecipe.findFirst();
        console.log('Sample:', first);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
