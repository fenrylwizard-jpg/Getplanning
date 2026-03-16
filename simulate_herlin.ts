import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function generateProject(
  name: string,
  pmId: string,
  smId: string,
  weeksOfHistory: number,
  options: {
    hasActiveCurrentWeek: boolean;
  }
) {
  // 1. Create Project
  const project = await prisma.project.create({
    data: {
      name,
      location: 'Site ' + name,
      subLocations: { create: [{name: 'Batiment A'}, {name: 'Batiment B'}, {name: 'Batiment C'}] },
      projectManagerId: pmId,
      siteManagerId: smId,
    },
  })

  // 2. Create Tasks (Realistic set for a 24-week project)
  const taskData = [
    { taskCode: 'STR-001', category: 'Structure', description: 'Bétonnage colonnes', unit: 'm3', quantity: 500, minutesPerUnit: 120 },
    { taskCode: 'CBL-001', category: 'Câblage', description: 'Tirage câble XVB 3G2.5', unit: 'm', quantity: 20000, minutesPerUnit: 2.0 },
    { taskCode: 'APP-001', category: 'Appareillage', description: 'Pose Prises Courant 2P+T', unit: 'pc', quantity: 2500, minutesPerUnit: 15.0 },
    { taskCode: 'LIG-001', category: 'Luminaires', description: 'Installation LED Panels', unit: 'pc', quantity: 800, minutesPerUnit: 25.0 },
  ]
  
  const createdTasks = []
  for (const t of taskData) {
    const task = await prisma.task.create({
      data: {
        ...t,
        projectId: project.id,
        completedQuantity: 0,
      }
    })
    createdTasks.push({ ...task, maxQ: t.quantity })
  }

  const baseDate = new Date()
  
  // 3. Simulate History
  for (let w = 1; w <= weeksOfHistory; w++) {
    // Randomize some issues for RCA
    const hasIssue = Math.random() > 0.8;
    const isTargetReached = !hasIssue;
    
    const weeklyPlan = await prisma.weeklyPlan.create({
      data: {
        projectId: project.id,
        weekNumber: w,
        year: baseDate.getFullYear(),
        numberOfWorkers: 6,
        targetHoursCapacity: 240,
        hasDrawings: true,
        hasMaterials: true,
        hasTools: true,
        isSubmitted: true,
        targetReached: isTargetReached,
        issuesReported: isTargetReached ? "" : "Problème d'approvisionnement ou intempéries",
        missedTargetReason: isTargetReached ? null : (Math.random() > 0.5 ? "MATERIAL_DELAY" : "WEATHER"),
      }
    })

    for (const taskObj of createdTasks) {
        const remaining = taskObj.maxQ - taskObj.completedQuantity;
        if (remaining <= 0) continue;

        // Progress speed: enough to finish in ~30 weeks
        const progressPercent = 0.02 + (Math.random() * 0.04);
        const plannedQ = Math.min(remaining, Math.floor(taskObj.maxQ * progressPercent));
        const actualQ = isTargetReached ? plannedQ : Math.floor(plannedQ * (0.3 + Math.random() * 0.4));

        if (plannedQ > 0) {
            await prisma.weeklyPlanTask.create({
                data: {
                    weeklyPlanId: weeklyPlan.id,
                    taskId: taskObj.id,
                    plannedQuantity: plannedQ,
                    actualQuantity: actualQ,
                    locations: JSON.stringify(['Batiment ' + (Math.random() > 0.5 ? 'A' : 'B')])
                }
            })
            taskObj.completedQuantity += actualQ;
            await prisma.task.update({
                where: { id: taskObj.id },
                data: { completedQuantity: taskObj.completedQuantity }
            })
        }
    }
  }

  // 4. Current Unsubmitted Week
  if (options.hasActiveCurrentWeek) {
    await prisma.weeklyPlan.create({
      data: {
        projectId: project.id,
        weekNumber: weeksOfHistory + 1,
        year: baseDate.getFullYear(),
        numberOfWorkers: 6,
        targetHoursCapacity: 240,
        hasDrawings: true,
        hasMaterials: true,
        hasTools: true,
        isSubmitted: false,
      }
    })
  }

  console.log(`✅ Simulated ${weeksOfHistory} weeks for: ${name}`);
}

async function main() {
    const passwordHash = await bcrypt.hash('password', 10);

    // Get or Create PM
    let pm = await prisma.user.findFirst({ where: { role: 'PM' } });
    if (!pm) {
        pm = await prisma.user.create({
            data: {
                email: 'pm_sim@worksite.com',
                name: 'Alice Simulator',
                passwordHash,
                role: 'PM',
                status: 'APPROVED'
            },
        });
    }

    // Create Site Manager "Herlin"
    const sm = await prisma.user.create({
        data: {
            email: `herlin_${Date.now()}@worksite.com`,
            name: 'Herlin Site Manager',
            passwordHash,
            role: 'SM',
            status: 'APPROVED'
        },
    });

    console.log(`👤 Created Site Manager: ${sm.name}`);

    // Simulate the projects
    await generateProject('Herlin - 4 Weeks Simulation', pm.id, sm.id, 4, { hasActiveCurrentWeek: true });
    await generateProject('Herlin - 12 Weeks Simulation', pm.id, sm.id, 12, { hasActiveCurrentWeek: true });
    await generateProject('Herlin - 24 Weeks Simulation', pm.id, sm.id, 24, { hasActiveCurrentWeek: true });

    console.log("🏁 Simulation for Herlin completed.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
