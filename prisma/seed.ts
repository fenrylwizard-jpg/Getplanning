import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ─── Excel Parser (same logic as metre-skill.ts) ────────────────────────────
interface MetreTask {
  taskCode: string
  description: string
  category: string
  unit: string
  quantity: number
  minutesPerUnit: number
}

function parseMetreFromFile(filePath: string): MetreTask[] {
  const buffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheets = workbook.SheetNames

  const meetstaatName = sheets.find(s =>
    s.toLowerCase().includes('meetstaat') || s.toLowerCase().includes('vorderstaat')
  ) || sheets[0]

  const budgetCodesName = sheets.find(s =>
    s.toLowerCase().includes('budget') || s.toLowerCase().includes('base')
  )

  const meetstaatSheet = workbook.Sheets[meetstaatName]
  const meetstaatData = XLSX.utils.sheet_to_json(meetstaatSheet, { header: 1, defval: '' }) as unknown[][]

  // Category map from budget codes
  const categoryMap: Record<string, string> = {}
  if (budgetCodesName) {
    const budgetSheet = workbook.Sheets[budgetCodesName]
    if (budgetSheet) {
      const budgetData = XLSX.utils.sheet_to_json(budgetSheet, { header: 1, defval: '' }) as unknown[][]
      budgetData.slice(1).forEach(row => {
        const code = String(row[2] || '').trim()
        const category = String(row[3] || '').trim()
        if (code && category) {
          categoryMap[code] = category
        }
      })
    }
  }

  const HEADER_ROW = 8
  const COL = { decomp: 0, tech: 3, article: 7, desc: 9, marche: 10, unit: 11, qty: 12, moMin: 16, totalHrs: 31 }

  const tasks: MetreTask[] = []

  for (let i = HEADER_ROW + 1; i < meetstaatData.length; i++) {
    const row = meetstaatData[i] as unknown[]
    if (!row || row.length < 17) continue

    const desc = String(row[COL.desc] || '').trim()
    const moMin = parseFloat(String(row[COL.moMin] || '0'))
    if (!desc || isNaN(moMin) || moMin <= 0) continue

    const marche = String(row[COL.marche] || '').trim()
    const unit = String(row[COL.unit] || '').trim()
    const techCode = String(row[COL.tech] || '').trim()
    const articleCode = String(row[COL.article] || '').trim()
    const decompStr = String(row[COL.decomp] || '').trim()

    let qty = parseFloat(String(row[COL.qty] || '1'))
    if ((marche === 'FF' || unit === 'PG') && decompStr) {
      const match = decompStr.match(/^(\d+(?:[.,]\d+)?)/)
      if (match) qty = parseFloat(match[1].replace(',', '.'))
    }
    if (isNaN(qty) || qty <= 0) qty = 1

    const totalHrs = parseFloat(String(row[COL.totalHrs] || '0'))

    // Category mapping logic
    let category = 'Non Catégorisé';
    if (techCode && categoryMap[techCode]) {
      category = categoryMap[techCode];
    } else if (techCode) {
      const HERLIN_FALLBACKS: Record<string, string> = {
        'EB1': 'Éclairage',
        'VK1': 'Éclairage de secours',
        'VKO1': 'Éclairage de secours',
        'VK01': 'Éclairage de secours',
        'AFBR1': 'Chemins de câbles',
        'BD1': 'Détection incendie',
        'DA1': 'Données',
        'HS1': 'Haute tension',
        'TC1': 'Contrôle d\'accès',
        'TC2': 'Contrôle d\'accès',
        'UUR1': 'Horloge mère',
        'BD2': 'Détection incendie',
        'BD1_1': 'Détection incendie',
        'INB1': 'Intrusion',
        'INB2': 'Intrusion',
        'ENGI1': 'Ingénierie',
        'ABM1': 'Abonnements',
        'AA1': 'Mise à la terre',
        'AS1': 'Astrid',
        'HS2': 'Poste HT',
        'SM1': 'Appareillage',
        'VSK1': 'Tableau de distribution',
        'KD1': 'Chemins de câbles',
        'VER1': 'Éclairage',
        'BVER1': 'Éclairage',
        'NVER1': 'Éclairage de secours',
        'DA2': 'Données',
        'VOE1': 'Câbles d\'alimentation',
      };
      category = HERLIN_FALLBACKS[techCode] || techCode;
    }

    const lowerDesc = desc.toLowerCase();
    if (category === techCode || category === marche || category === 'Non Catégorisé') {
      if (lowerDesc.includes('éclairage') || lowerDesc.includes('luminaire')) category = 'Éclairage';
      else if (lowerDesc.includes('incendie') || lowerDesc.includes('détection')) category = 'Détection incendie';
      else if (lowerDesc.includes('câble') || lowerDesc.includes('cablage')) category = 'Câblage';
      else if (lowerDesc.includes('prise') || lowerDesc.includes('interrupteur') || lowerDesc.includes('bouton poussoir')) category = 'Appareillage';
      else if (lowerDesc.includes('chemin de câble') || lowerDesc.includes('tube')) category = 'Chemins de câbles & Tubages';
      else if (lowerDesc.includes('contrôle d\'accès')) category = 'Contrôle d\'accès';
      else if (lowerDesc.includes('intrusion')) category = 'Intrusion';
      else if (lowerDesc.includes('terre') || lowerDesc.includes('equipotentielle')) category = 'Mise à la terre';
    }

    const taskCode = articleCode ? `${articleCode}_${i}` : `TASK_${i}`

    // Compute correct minutesPerUnit: totalMOminutes / qty
    const totalMOminutes = !isNaN(totalHrs) && totalHrs > 0 ? totalHrs * 60 : moMin
    const minutesPerUnit = qty > 0 ? Math.round((totalMOminutes / qty) * 100) / 100 : totalMOminutes

    tasks.push({ taskCode, description: desc, category, unit: unit || 'u', quantity: qty, minutesPerUnit })
  }

  return tasks
}

// ─── Create a full Herlin project variant ────────────────────────────────────
async function createHerlinProject(
  name: string,
  pmId: string,
  smId: string,
  tasks: MetreTask[],
  location: string,
  startDate: Date,
  endDate: Date,
  weeksOfHistory: number,
) {
  const project = await prisma.project.create({
    data: {
      name,
      location,
      projectManagerId: pmId,
      siteManagerId: smId,
      startDate,
      endDate,
    }
  })

  // Sub-locations
  for (const loc of ['Bâtiment A', 'Bâtiment B', 'Bâtiment Principal']) {
    await prisma.subLocation.create({ data: { name: loc, projectId: project.id } })
  }

  // Create all tasks from Excel
  const createdTasks: Array<typeof tasks[0] & { id: string; completed: number }> = []
  for (const t of tasks) {
    const created = await prisma.task.create({
      data: {
        projectId: project.id,
        taskCode: t.taskCode,
        description: t.description,
        category: t.category,
        unit: t.unit,
        quantity: t.quantity,
        minutesPerUnit: t.minutesPerUnit,
        completedQuantity: 0,
      }
    })
    createdTasks.push({ ...t, id: created.id, completed: 0 })
  }

  // Simulate weekly history
  for (let w = 1; w <= weeksOfHistory; w++) {
    const weekDate = new Date(startDate)
    weekDate.setDate(weekDate.getDate() + (w - 1) * 7)
    const weekNum = w
    const isLastWeek = w === weeksOfHistory
    const targetReached = isLastWeek ? Math.random() > 0.3 : true

    const weeklyPlan = await prisma.weeklyPlan.create({
      data: {
        projectId: project.id,
        weekNumber: weekNum,
        year: weekDate.getFullYear(),
        numberOfWorkers: 4 + Math.floor(Math.random() * 3),
        targetHoursCapacity: 160,
        hasDrawings: true,
        hasMaterials: true,
        hasTools: true,
        hasSubcontractors: false,
        isSubmitted: true,
        isClosed: true,
        targetReached,
        missedTargetReason: targetReached ? null : 'Retard livraison matériel',
      }
    })

    // Daily report for verification
    const report = await prisma.dailyReport.create({
      data: {
        projectId: project.id,
        siteManagerId: smId,
        date: weekDate,
        status: 'APPROVED',
        remarks: `Rapport semaine ${w}`,
      }
    })

    // Progress on a subset of tasks
    const taskSubset = createdTasks.filter(t => t.completed < t.quantity).slice(0, 5)
    for (const t of taskSubset) {
      const progressPct = 0.04 + Math.random() * 0.08
      const addedQty = Math.min(t.quantity - t.completed, Math.ceil(t.quantity * progressPct))
      if (addedQty <= 0) continue

      await prisma.weeklyPlanTask.create({
        data: {
          weeklyPlanId: weeklyPlan.id,
          taskId: t.id,
          plannedQuantity: addedQty,
          actualQuantity: targetReached ? addedQty : Math.floor(addedQty * 0.5),
          locations: '["Bâtiment A"]',
        }
      })

      await prisma.dailyTaskProgress.create({
        data: {
          dailyReportId: report.id,
          taskId: t.id,
          quantity: targetReached ? addedQty : Math.floor(addedQty * 0.5),
          hours: (t.minutesPerUnit * addedQty) / 60,
        }
      })

      t.completed += targetReached ? addedQty : Math.floor(addedQty * 0.5)
      await prisma.task.update({ where: { id: t.id }, data: { completedQuantity: t.completed } })
    }
  }

  console.log(`✅ Created: ${name} (${tasks.length} tasks, ${weeksOfHistory} weeks history)`)
  return project
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Clean
  await prisma.dailyTaskProgress.deleteMany()
  await prisma.dailyReport.deleteMany()
  await prisma.weeklyPlanTask.deleteMany()
  await prisma.weeklyPlan.deleteMany()
  await prisma.task.deleteMany()
  await prisma.subLocation.deleteMany()
  await prisma.revisionLog.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  console.log('🧹 Database cleaned.')

  const pw = await bcrypt.hash('password', 10)

  // ── ADMIN ──
  await prisma.user.create({
    data: { email: 'admin@eeg.be', name: 'Admin EEG', passwordHash: pw, role: 'ADMIN', status: 'APPROVED', xp: 0, level: 1, characterId: 1 }
  })

  // ── PROJECT MANAGERS (3) — different character classes & levels ──
  // characterId: 1=mason, 2=electrician, 3=carpenter, 4=plumber, 5=foreman
  // Levels: T0=1-9, T1=10-19, T2=20-29, T3=30-39

  const pm1 = await prisma.user.create({
    data: { email: 'pm1@eeg.be', name: 'Laurent Dupont', passwordHash: pw, role: 'PM', status: 'APPROVED',
            xp: 2500, level: 8, characterId: 1 }  // Mason T0
  })
  const pm2 = await prisma.user.create({
    data: { email: 'pm2@eeg.be', name: 'Sophie Leroy', passwordHash: pw, role: 'PM', status: 'APPROVED',
            xp: 14000, level: 18, characterId: 2 }  // Electrician T1
  })
  const pm3 = await prisma.user.create({
    data: { email: 'pm3@eeg.be', name: 'Marc Renard', passwordHash: pw, role: 'PM', status: 'APPROVED',
            xp: 28000, level: 28, characterId: 3 }  // Carpenter T2
  })

  // ── SITE MANAGERS (3) — different character classes & levels ──
  const sm1 = await prisma.user.create({
    data: { email: 'sm1@eeg.be', name: 'Antoine Bernard', passwordHash: pw, role: 'SM', status: 'APPROVED',
            xp: 1200, level: 5, characterId: 2 }  // Electrician T0
  })
  const sm2 = await prisma.user.create({
    data: { email: 'sm2@eeg.be', name: 'Nathalie Petit', passwordHash: pw, role: 'SM', status: 'APPROVED',
            xp: 22000, level: 24, characterId: 1 }  // Mason T2
  })
  const sm3 = await prisma.user.create({
    data: { email: 'sm3@eeg.be', name: 'Thomas Moreau', passwordHash: pw, role: 'SM', status: 'APPROVED',
            xp: 36000, level: 35, characterId: 3 }  // Carpenter T3
  })

  console.log('👤 Users created.')

  // ── LOAD Excel FILE ──
  const excelPath = path.join(process.cwd(), 'public', 'uploads', 'last_metre.xlsx')
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath)
    console.error('   Please upload the Herlin Excel file via the website first.')
    process.exit(1)
  }

  console.log('📊 Parsing Excel file...')
  const tasks = parseMetreFromFile(excelPath)
  console.log(`   → ${tasks.length} tasks found, importing into 3 projects.`)

  // Dates for 3 variants
  const now = new Date()
  const date4wStart  = new Date(now); date4wStart.setDate(date4wStart.getDate() - 28)
  const date12wStart = new Date(now); date12wStart.setDate(date12wStart.getDate() - 84)
  const date24wStart = new Date(now); date24wStart.setDate(date24wStart.getDate() - 168)

  const date4wEnd  = new Date(now); date4wEnd.setDate(date4wEnd.getDate() + 0)
  const date12wEnd = new Date(now); date12wEnd.setDate(date12wEnd.getDate() + 0)
  const date24wEnd = new Date(now); date24wEnd.setDate(date24wEnd.getDate() + 0)

  // ── Herlin - Jupiter (4 weeks, active, early stage) ──
  await createHerlinProject(
    'Herlin - Jupiter',
    pm1.id, sm1.id,
    tasks,
    'Naninne, Bâtiment A',
    date4wStart, date4wEnd,
    4
  )

  // ── Herlin - Mars (12 weeks, in progress) ──
  await createHerlinProject(
    'Herlin - Mars',
    pm2.id, sm2.id,
    tasks,
    'Naninne, Bâtiment B',
    date12wStart, date12wEnd,
    12
  )

  // ── Herlin - Neptune (24 weeks, nearly complete) ──
  await createHerlinProject(
    'Herlin - Neptune',
    pm3.id, sm3.id,
    tasks,
    'Naninne, Bâtiment Principal',
    date24wStart, date24wEnd,
    24
  )

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📋 Test Accounts (password: "password"):')
  console.log('   ADMIN  → admin@eeg.be')
  console.log('   PM1    → pm1@eeg.be  (Laurent,  Mason T0,       Level 8)')
  console.log('   PM2    → pm2@eeg.be  (Sophie,   Electrician T1, Level 18)')
  console.log('   PM3    → pm3@eeg.be  (Marc,     Carpenter T2,   Level 28)')
  console.log('   SM1    → sm1@eeg.be  (Antoine,  Electrician T0, Level 5)')
  console.log('   SM2    → sm2@eeg.be  (Nathalie, Mason T2,       Level 24)')
  console.log('   SM3    → sm3@eeg.be  (Thomas,   Carpenter T3,   Level 35)')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
