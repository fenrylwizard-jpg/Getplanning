const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({ where: { name: 'Herlin - Jupiter' } });
  
  const plans = await prisma.weeklyPlan.findMany({
    where: { projectId: project.id, isClosed: true },
    include: { tasks: { include: { task: true } } }
  });

  let totalPlannedHours = 0;
  let totalActualHours = 0;

  console.log('Planned vs Executed per week (Herlin - Jupiter):');
  for (const plan of plans) {
    const planned = plan.tasks.reduce((s, pt) => s + (pt.plannedQuantity * pt.task.minutesPerUnit) / 60, 0);
    const actual  = plan.tasks.reduce((s, pt) => s + (pt.actualQuantity  * pt.task.minutesPerUnit) / 60, 0);
    totalPlannedHours += planned;
    totalActualHours  += actual;
    console.log(`  W${plan.weekNumber}: Planned ${planned.toFixed(1)}h | Actual ${actual.toFixed(1)}h | TargetReached: ${plan.targetReached}`);
  }

  console.log(`\n  Total Planned: ${totalPlannedHours.toFixed(2)}h`);
  console.log(`  Total Actual:  ${totalActualHours.toFixed(2)}h`);

  // Cross-reference with the PM dashboard XP-rate calculation
  // The project has workers × hours at an expected billing rate
  // We'll find the effective rate by looking at avg minutesPerUnit across tasks
  const allTasks = await prisma.task.findMany({ where: { projectId: project.id } });
  const avgMpu = allTasks.reduce((s, t) => s + t.minutesPerUnit, 0) / allTasks.length;
  const BILLING_RATE = 53.0; // typical BE electrician
  const COST_RATE = BILLING_RATE * 0.817; // ~43.35
  console.log(`\n  Tasks in project: ${allTasks.length}`);
  console.log(`  Avg min/unit: ${avgMpu.toFixed(2)}`);
  console.log(`  Implied cost rate check: €${COST_RATE.toFixed(2)}/h`);

  // Admin: open/closed plans
  const openPlans = await prisma.weeklyPlan.findMany({
    where: { isClosed: false },
    select: { id: true, weekNumber: true, projectId: true, project: { select: { name: true } } }
  });
  console.log('\nOpen plans (for auto-close trigger):');
  if (openPlans.length === 0) {
    console.log('  None (all plans are closed)');
  } else {
    openPlans.forEach(p => console.log(`  ${p.project.name} W${p.weekNumber}`));
  }

  // Admin global KPIs
  const projectCount = await prisma.project.count();
  const reportCount  = await prisma.dailyReport.count();
  const approvedReports = await prisma.dailyReport.count({ where: { status: 'APPROVED' } });
  const hitRate = reportCount > 0 ? ((approvedReports / reportCount) * 100).toFixed(1) : 'N/A';
  console.log(`\nAdmin Dashboard KPIs:`);
  console.log(`  Total Projects: ${projectCount}`);
  console.log(`  Total Reports: ${reportCount}`);
  console.log(`  Approved Reports: ${approvedReports}`);
  console.log(`  Hit Rate (approved/total): ${hitRate}%`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
