const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// SM state verification
async function checkSMState() {
  const sm2 = await prisma.user.findUnique({ where: { email: 'sm2@eeg.be' } });
  console.log('SM2 state:', JSON.stringify(sm2));

  const reports = await prisma.dailyReport.findMany({
    where: { siteManagerId: sm2.id },
    orderBy: { date: 'desc' },
    take: 5,
    select: { date: true, status: true, projectId: true }
  });
  console.log('Recent reports:', JSON.stringify(reports, null, 2));
}

// PM state verification
async function checkPMState() {
  const pm1 = await prisma.user.findUnique({ where: { email: 'pm1@eeg.be' } });
  console.log('PM1 state:', JSON.stringify(pm1));

  const project = await prisma.project.findFirst({ where: { name: 'Herlin - Jupiter' } });
  console.log('Herlin Jupiter project:', JSON.stringify(project));

  const plans = await prisma.weeklyPlan.findMany({
    where: { projectId: project.id },
    orderBy: { weekNumber: 'asc' },
    take: 5,
    select: { weekNumber: true, targetReached: true, isClosed: true, numberOfWorkers: true, targetHoursCapacity: true }
  });
  console.log('Plans:', JSON.stringify(plans, null, 2));

  const planTasks = await prisma.weeklyPlanTask.findMany({
    where: { weeklyPlan: { projectId: project.id } },
    take: 10,
    select: { plannedQuantity: true, actualQuantity: true, task: { select: { minutesPerUnit: true, description: true, category: true } } }
  });
  console.log('Sample plan tasks:', JSON.stringify(planTasks, null, 2));
}

// Admin state verification
async function checkAdminState() {
  const projects = await prisma.project.count();
  const users = await prisma.user.count();
  const pendingUsers = await prisma.user.count({ where: { status: 'PENDING' } });
  const closedPlans = await prisma.weeklyPlan.count({ where: { isClosed: true } });
  const openPlans = await prisma.weeklyPlan.count({ where: { isClosed: false } });
  
  console.log('Admin KPIs:', JSON.stringify({ projects, users, pendingUsers, closedPlans, openPlans }));
}

async function main() {
  console.log('=== SM VERIFICATION ===');
  await checkSMState();
  console.log('\n=== PM VERIFICATION ===');
  await checkPMState();
  console.log('\n=== ADMIN VERIFICATION ===');
  await checkAdminState();
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
