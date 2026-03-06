import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'pm@worksite.com' }
  })
  if (user) {
    console.log('ID:', user.id)
    console.log('Name:', user.name)
    console.log('CharacterId:', (user as any).characterId)
    console.log('Level:', (user as any).level)
    console.log('XP:', (user as any).xp)
  } else {
    console.log('User not found')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
