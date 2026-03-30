# 🏗️ Worksite Tracker (+ 🍳 Cooking Module)

> **A-to-Z walkthrough so that any AI (or human) can rebuild or resume work on this project.**

## 📍 Location
- **Local path**: `C:\Users\Imam\.gemini\antigravity\scratch\worksite-tracker`
- **Git repo**: `https://github.com/fenrylwizard-jpg/Getplanning.git` (branch: `main`)
- **Deployment**: Auto-deploys on push via **Dokploy** to a VPS
- **Live URL**: Hosted on the VPS (check Dokploy dashboard for exact URL)

## 🏗️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| Database | PostgreSQL (via Prisma ORM v5) |
| Auth | JWT (jose) + bcrypt |
| Charts | Recharts |
| PDF parsing | pdf.js-extract, pdf2json |
| AI | Google Gemini (`@google/genai`) |
| Email | Resend |
| PWA | next-pwa |

## 📂 Project Structure
```
worksite-tracker/
├── package.json
├── prisma/
│   ├── schema.prisma       # Database models (User, Project, Task, WeeklyPlan, DailyReport, etc.)
│   └── seed.ts             # Seeds admin user + badges
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard, weekly report, user management
│   │   ├── api/            # API routes (REST)
│   │   │   ├── admin/      # Admin-only APIs (weekly-stats, repair-db, etc.)
│   │   │   ├── auth/       # Login/register
│   │   │   ├── cooking/    # Cooking module APIs
│   │   │   ├── cron/       # Scheduled jobs (weekly-close)
│   │   │   └── project/[id]/ # Per-project APIs (report, planning, tasks, etc.)
│   │   ├── cooking/        # 🍳 COOKING MODULE (see below)
│   │   ├── login/          # Login page with changelog
│   │   ├── pm/             # Project Manager views
│   │   ├── register/       # Registration
│   │   └── sm/             # Site Manager views (project hub, reports, planning, analytics)
│   ├── components/
│   │   ├── AdminWeeklyGraph.tsx   # Admin performance graph
│   │   ├── T.tsx                  # i18n translation component
│   │   └── hub/                   # Project hub components
│   │       ├── PlanningTab.tsx    # Gantt planning with PDF import
│   │       ├── ProductionTab.tsx  # Daily reports + weekly summary
│   │       ├── FileUploadZone.tsx # AI-powered file upload
│   │       └── WeeklyReportGenerator.tsx
│   └── lib/
│       ├── prisma.ts       # Prisma client singleton
│       ├── auth.ts         # JWT verification
│       ├── xp-engine.ts    # RPG XP system
│       ├── streak-utils.ts # Streak calculations
│       ├── i18n.ts         # Translations (FR/EN/NL)
│       └── changelog.ts    # Versioned changelog data
├── public/
│   ├── cooking/            # Cooking module assets (images)
│   └── ...                 # Other static assets
└── Dockerfile              # For Dokploy deployment
```

## 🎮 Key Business Features

### Roles
- **Admin**: Full control, user management, weekly close, analytics
- **PM (Project Manager)**: Oversees multiple projects, sees SM reports
- **SM (Site Manager)**: Manages one project, submits daily reports, planning

### Core Systems
1. **Weekly Planning**: SM creates weekly plans with tasks + quantities
2. **Daily Reports**: SM submits actuals daily, tracked against plan
3. **Planning Module**: PDF Gantt chart import → AI extracts milestones
4. **RPG System**: XP for reports + badges + levels + character tiers
5. **Weekly Close**: Admin closes the week → generates summary report
6. **PM XP Inheritance**: PM earns same XP as their SMs
7. **Cooking Module**: Separate recipe/meal-prep/pantry app (share same auth)

### Database (Prisma Models)
Key models: `User`, `Project`, `Task`, `WeeklyPlan`, `WeeklyPlanTask`, `DailyReport`, `DailyTaskProgress`, `PlanningMilestone`, `Badge`, `UserBadge`, `BlockageLog`

## 🔑 Environment Variables
```
DATABASE_URL=postgresql://...    # PostgreSQL connection string
JWT_SECRET=...                   # JWT signing secret
GEMINI_API_KEY=...               # For AI features (PDF parsing, etc.)
RESEND_API_KEY=...               # For email notifications
```

## 🚀 How to Run (from scratch)

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Git

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/fenrylwizard-jpg/Getplanning.git worksite-tracker
cd worksite-tracker

# 2. Install dependencies
npm install

# 3. Set up environment
# Create .env file with DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, RESEND_API_KEY

# 4. Set up database
npx prisma generate
npx prisma db push

# 5. Seed initial data (admin user + badges)
npx prisma db seed

# 6. Run dev server
npm run dev
# → Opens on http://localhost:3000

# 7. Default admin login: check prisma/seed.ts for credentials
```

### Deployment (Dokploy)
- Push to `main` branch on GitHub
- Dokploy auto-builds and deploys via Docker
- Build command: `npx prisma generate && next build`
- Start command: `npx prisma generate && npx prisma db push --accept-data-loss && next start`

## 🍳 Cooking Module Details

The cooking module lives at `src/app/cooking/` and is a self-contained sub-app:

```
src/app/cooking/
├── CookingAuthContext.tsx  # Auth context (shares worksite auth)
├── cooking.css             # Full custom CSS (67KB)
├── layout.tsx              # App shell with bottom nav
├── page.tsx                # Landing/dashboard page
├── components/
│   ├── FloatingFairy.tsx   # Animated mascot helper
│   └── RecipeDetailModal.tsx
├── data/                   # Static recipe/protocol data
├── journal/                # Food journal feature
├── login/                  # Cooking-specific login
├── mealprep/               # Meal prep planner
├── pantry/                 # Pantry inventory
├── profile/                # User cooking profile
├── protocols/              # Cooking protocols/techniques
├── recipes/                # Recipe browser + CRUD
├── register/               # Registration
├── shopping/               # Shopping list manager
└── public/                 # Cooking images (in worksite-tracker/public/cooking/)
```

## ⚠️ Known Issues & Gotchas
- `npx prisma db push` can fail on first deploy — run manually if needed
- Some lint warnings for inline CSS styles (non-critical)
- `canvas` npm package may need native build tools on some systems
- Cooking module shares the same DB but has its own auth context

## 📦 Critical Files to Backup
- `.env` — Database URL + secrets
- `prisma/schema.prisma` — Database schema (source of truth)
- `src/` — All application code
- `public/cooking/` — Cooking module images
- Git repo itself is the primary backup
