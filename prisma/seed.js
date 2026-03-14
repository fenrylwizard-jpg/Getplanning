const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create PM user
  const pmHash = await bcrypt.hash('admin123', 10);
  const pm = await prisma.user.create({
    data: {
      name: 'Admin PM',
      email: 'admin@eeg.com',
      passwordHash: pmHash,
      role: 'PM',
      status: 'APPROVED',
      company: 'EEG',
    },
  });

  // Create SM user
  const smHash = await bcrypt.hash('sm123', 10);
  const sm = await prisma.user.create({
    data: {
      name: 'Jean Dupont',
      email: 'sm@eeg.com',
      passwordHash: smHash,
      role: 'SM',
      status: 'APPROVED',
      company: 'EEG',
    },
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Complexe Bureau Bruxelles',
      location: 'Bruxelles, Belgique',
      startDate: new Date('2026-01-06'),
      endDate: new Date('2026-06-30'),
      projectManagerId: pm.id,
      siteManagerId: sm.id,
    },
  });

  // Create SubLocations
  await prisma.subLocation.createMany({
    data: [
      { name: 'Étage 1', projectId: project.id },
      { name: 'Étage 2', projectId: project.id },
      { name: 'Sous-sol', projectId: project.id },
    ],
  });

  // Create Tasks
  const tasks = await Promise.all([
    prisma.task.create({ data: { taskCode: 'EL-001', category: 'Eclairage', description: 'Pose luminaires LED encastrés', unit: 'pce', quantity: 120, completedQuantity: 45, minutesPerUnit: 30, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'EL-002', category: 'Eclairage', description: 'Câblage luminaires', unit: 'm', quantity: 800, completedQuantity: 350, minutesPerUnit: 5, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'CA-001', category: 'Câble', description: 'Tirage câble XVB 5G2.5', unit: 'm', quantity: 2000, completedQuantity: 900, minutesPerUnit: 4, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'CA-002', category: 'Câble', description: 'Tirage câble XVB 5G6', unit: 'm', quantity: 500, completedQuantity: 200, minutesPerUnit: 6, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'TB-001', category: 'Tableaux électriques', description: 'Montage tableau divisionnaire', unit: 'pce', quantity: 8, completedQuantity: 3, minutesPerUnit: 480, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'TB-002', category: 'Tableaux électriques', description: 'Raccordement tableau', unit: 'pce', quantity: 8, completedQuantity: 2, minutesPerUnit: 240, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'TU-001', category: "Tube d'attente", description: 'Pose tube IRO 20mm', unit: 'm', quantity: 1500, completedQuantity: 800, minutesPerUnit: 3, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'TU-002', category: "Tube d'attente", description: 'Pose tube IRO 32mm', unit: 'm', quantity: 600, completedQuantity: 250, minutesPerUnit: 4, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'AP-001', category: 'Appareillage', description: 'Pose prises 2P+T', unit: 'pce', quantity: 200, completedQuantity: 80, minutesPerUnit: 20, projectId: project.id } }),
    prisma.task.create({ data: { taskCode: 'AP-002', category: 'Appareillage', description: 'Pose interrupteurs', unit: 'pce', quantity: 100, completedQuantity: 40, minutesPerUnit: 15, projectId: project.id } }),
  ]);

  // Create Weekly Plans
  const week10 = await prisma.weeklyPlan.create({
    data: {
      weekNumber: 10, year: 2026, numberOfWorkers: 4, targetHoursCapacity: 160,
      projectId: project.id, isSubmitted: true, isClosed: true, targetReached: true,
      hasDrawings: true, hasMaterials: true, hasTools: true, hasSubcontractors: false,
    },
  });

  const week11 = await prisma.weeklyPlan.create({
    data: {
      weekNumber: 11, year: 2026, numberOfWorkers: 5, targetHoursCapacity: 200,
      projectId: project.id, isSubmitted: true, isClosed: true, targetReached: false,
      missedTargetReason: 'MATERIAL_DELAY', issuesReported: 'Retard livraison câbles XVB',
      hasDrawings: true, hasMaterials: false, hasTools: true, hasSubcontractors: false,
    },
  });

  const week12 = await prisma.weeklyPlan.create({
    data: {
      weekNumber: 12, year: 2026, numberOfWorkers: 5, targetHoursCapacity: 200,
      projectId: project.id, isSubmitted: false, isClosed: false,
      hasDrawings: true, hasMaterials: true, hasTools: true, hasSubcontractors: true,
    },
  });

  // Add tasks to weekly plans
  await prisma.weeklyPlanTask.createMany({
    data: [
      { weeklyPlanId: week10.id, taskId: tasks[0].id, plannedQuantity: 20, actualQuantity: 22 },
      { weeklyPlanId: week10.id, taskId: tasks[2].id, plannedQuantity: 300, actualQuantity: 310 },
      { weeklyPlanId: week10.id, taskId: tasks[6].id, plannedQuantity: 200, actualQuantity: 195 },
      { weeklyPlanId: week11.id, taskId: tasks[0].id, plannedQuantity: 15, actualQuantity: 10 },
      { weeklyPlanId: week11.id, taskId: tasks[1].id, plannedQuantity: 200, actualQuantity: 150 },
      { weeklyPlanId: week11.id, taskId: tasks[3].id, plannedQuantity: 100, actualQuantity: 80 },
      { weeklyPlanId: week12.id, taskId: tasks[4].id, plannedQuantity: 2, actualQuantity: 0 },
      { weeklyPlanId: week12.id, taskId: tasks[8].id, plannedQuantity: 40, actualQuantity: 0 },
      { weeklyPlanId: week12.id, taskId: tasks[9].id, plannedQuantity: 20, actualQuantity: 0 },
    ],
  });

  // Create Revision Logs
  await prisma.revisionLog.createMany({
    data: [
      { projectId: project.id, fileName: 'Plans électriques v3.2.pdf', changesMade: 'Mise à jour circuits étage 2', uploadedAt: new Date('2026-02-15') },
      { projectId: project.id, fileName: 'Schéma unifilaire v2.1.pdf', changesMade: 'Ajout tableau divisionnaire SS', uploadedAt: new Date('2026-03-01') },
      { projectId: project.id, fileName: 'Note de calcul v1.0.pdf', changesMade: null, uploadedAt: new Date('2026-01-10') },
    ],
  });

  // Create a second project for variety
  const project2 = await prisma.project.create({
    data: {
      name: 'Résidence Les Jardins',
      location: 'Liège, Belgique',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-09-30'),
      projectManagerId: pm.id,
      siteManagerId: sm.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { taskCode: 'EL-001', category: 'Eclairage', description: 'Pose spots encastrés', unit: 'pce', quantity: 80, completedQuantity: 10, minutesPerUnit: 25, projectId: project2.id },
      { taskCode: 'CA-001', category: 'Câble', description: 'Tirage câble résidentiel', unit: 'm', quantity: 1200, completedQuantity: 100, minutesPerUnit: 3, projectId: project2.id },
    ],
  });

  console.log('✅ Seeded: 2 users, 2 projects, 12 tasks, 3 weekly plans, 3 revision logs');
}

main().catch(console.error).finally(() => prisma.$disconnect());
