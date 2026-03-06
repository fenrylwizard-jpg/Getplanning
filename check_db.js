const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@worksite.com' }
  })
  if (admin) {
    console.log('---RESULT_START---')
    console.log('ADMIN_FOUND: true')
    console.log('ROLE: ' + admin.role)
    console.log('---RESULT_END---')
  } else {
    const anyAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    console.log('---RESULT_START---')
    console.log('ADMIN_FOUND: false')
    if (anyAdmin) {
      console.log('OTHER_ADMIN_EMAIL: ' + anyAdmin.email)
    }
    console.log('---RESULT_END---')
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
