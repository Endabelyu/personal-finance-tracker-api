# 📋 PLANNING — Personal Finance Tracker

> AI-powered personal finance web application with CLI code generation tooling.
> Based on: `financeai-cli-commands.md`

---

## 1. Project Overview

A full-stack personal finance application with:
- **Web App** — Dashboard, transactions, budgets, reports, auth
- **FinanceAI CLI** — AI-powered code generator for scaffolding features

---

## 2. Tech Stack Decisions

### 2.1 Frontend — React Router v7 ✅
**Choice: React Router v7 (Framework mode)**

| Feature | Details |
|---|---|
| Routing | File-based routes via `app/routes/` |
| Data loading | Loaders + Actions (server-side) |
| SSR | Built-in via Vite |
| Deployment | Node / Cloudflare / Vercel adapters |

React Router v7 is the evolution of Remix — SSR, file-based routing, and loader/action pattern out of the box. No need for Next.js or TanStack Router.

---

### 2.2 Backend — Hono ✅
**Choice: Hono (API layer, not Express)**

| vs Express | Why Hono Wins |
|---|---|
| Speed | ~10x faster, edge-native runtime |
| TypeScript | First-class TS, zero `@types` packages |
| Edge-ready | Cloudflare Workers, Bun, Node, Deno |
| Type-safe RPC | Built-in `hono/client` for typed API calls from frontend |
| Built-in middleware | JWT, CORS, logger, Zod validator, rate limiter |
| Bundle size | Tiny footprint (~12KB) |

**Architecture:**
```
React Router v7 (SSR Frontend + Loaders/Actions)
        ↕  hono/client (fully typed RPC)
Hono API Server  (mounted at /api/*)
        ↕
Drizzle ORM
        ↕
PostgreSQL
```

---

### 2.3 ORM — Drizzle vs Prisma

**Choice: ✅ Drizzle ORM**

| Criteria | Drizzle | Prisma |
|---|---|---|
| Type Safety | ✅ Inferred from schema, 100% TS | ✅ Generated types |
| Performance | ✅ Near-raw SQL speed, no overhead | ⚠️ Query engine overhead |
| Bundle Size | ✅ ~30KB | ❌ ~15MB+ (query engine binary) |
| Edge Support | ✅ Works on Cloudflare Workers | ❌ Requires separate data proxy |
| Migration | ✅ `drizzle-kit` (simple SQL files) | ⚠️ Prisma Migrate (more complex) |
| Schema | ✅ Code-first, TypeScript schema | ✅ `.prisma` DSL schema |
| Raw SQL | ✅ Easy `sql` tagged template | ⚠️ Requires `$queryRaw` |
| Learning Curve | Low — feels like writing SQL | Low — intuitive DSL |
| Studio | ✅ Drizzle Studio (built-in) | ✅ Prisma Studio |
| Ecosystem | Growing fast | Mature, large community |

**Verdict:** Drizzle wins for this stack. Edge-ready, lightweight, fully typed, and pairs perfectly with Hono.

---

### 2.4 Auth — Better Auth vs Custom Build

**Choice: ✅ Better Auth**

#### Option A: Build Custom Auth
| Pro | Con |
|---|---|
| Full control | Takes 2-4 weeks to do properly |
| No dependency | JWT rotation, refresh tokens are tricky |
| Learn deeply | Session management edge cases |
| | CSRF, brute-force protection needed |
| | OAuth implementation complexity |

#### Option B: Better Auth
| Pro | Con |
|---|---|
| Production-ready out of the box | Another dependency |
| Drizzle adapter built-in ✅ | Slightly opinionated |
| Email/password + OAuth (Google, GitHub) | |
| Session management + refresh tokens | |
| CSRF protection built-in | |
| React client hooks (`useSession`) | |
| 2FA support | |
| Organization / multi-tenant support | |
| Active development (2024-2025) | |

**Verdict:** Better Auth wins. It has a **native Drizzle adapter**, React hooks, and handles all the security edge cases. Building auth from scratch is risky and time-consuming. Better Auth is the modern alternative to NextAuth/Lucia for our stack.

**Better Auth gives us:**
```ts
// Server
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: { clientId: '...', clientSecret: '...' }
  }
})

// Client (React)
const { data: session } = authClient.useSession()
```

---

## 3. Project Structure

```
personal-finance-tracker/
├── app/                          # React Router v7 frontend
│   ├── routes/
│   │   ├── _index.tsx            # Redirect to /dashboard or /auth/login
│   │   ├── auth.login.tsx
│   │   ├── auth.register.tsx
│   │   ├── auth.logout.tsx
│   │   ├── dashboard.tsx
│   │   ├── transactions.tsx
│   │   ├── transactions.new.tsx
│   │   ├── transactions.$id.edit.tsx
│   │   ├── budget.tsx
│   │   └── reports.tsx
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   ├── layout/               # Sidebar, Header, AppLayout
│   │   └── finance/              # Domain-specific components
│   ├── lib/
│   │   ├── auth-client.ts        # Better Auth client
│   │   ├── api-client.ts         # Hono RPC client
│   │   └── session.ts            # Session helpers for loaders
│   ├── root.tsx
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   └── tailwind.css
│
├── server/                       # Hono API server
│   ├── index.ts                  # Entry point
│   ├── lib/
│   │   ├── db.ts                 # Drizzle + postgres connection
│   │   └── auth.ts               # Better Auth instance
│   └── routes/
│       ├── index.ts              # Mount all routes
│       ├── auth.ts               # /api/auth/**
│       ├── transactions.ts       # /api/transactions
│       ├── budgets.ts            # /api/budgets
│       ├── categories.ts         # /api/categories
│       └── reports.ts            # /api/reports/*
│
├── db/
│   ├── schema/
│   │   ├── index.ts
│   │   ├── users.ts              # Better Auth managed
│   │   ├── transactions.ts
│   │   ├── budgets.ts
│   │   └── categories.ts
│   ├── migrations/               # drizzle-kit SQL files
│   └── seed.ts
│
├── cli/                          # FinanceAI CLI tool
│   ├── bin/
│   │   └── financeai.ts
│   ├── commands/
│   │   ├── init.ts
│   │   ├── generate.ts
│   │   ├── scaffold.ts
│   │   ├── db.ts
│   │   ├── test.ts
│   │   ├── docs.ts
│   │   └── chat.ts
│   ├── templates/               # Code generation templates
│   └── utils/
│       ├── ai.ts                # AI prompt helpers
│       └── config.ts            # .financeai.json reader/writer
│
├── drizzle.config.ts
├── vite.config.ts
├── react-router.config.ts
├── tailwind.config.js
├── tsconfig.json
├── docker-compose.yml
├── .env.example
├── PLANNING.md                  ← this file
└── TASKS.md
```

---

## 4. Database Schema

### users *(managed by Better Auth)*
| Column | Type | Notes |
|---|---|---|
| id | text PK | Better Auth UUID |
| email | text UNIQUE | |
| name | text | |
| emailVerified | boolean | |
| image | text | Avatar URL |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### sessions *(managed by Better Auth)*
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| userId | text FK | → users.id |
| token | text UNIQUE | |
| expiresAt | timestamp | |
| ipAddress | text | |
| userAgent | text | |

### categories
| Column | Type | Notes |
|---|---|---|
| id | varchar PK | 'food', 'transport', etc. |
| label | varchar | Display name |
| color | varchar | Hex color |
| icon | varchar | Emoji |
| type | enum | 'income' \| 'expense' \| 'both' |

### transactions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | text FK | → users.id |
| type | enum | 'income' \| 'expense' |
| amount | decimal(15,2) | Always positive |
| categoryId | varchar FK | → categories.id |
| description | text | |
| date | date | Transaction date |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### budgets
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| userId | text FK | → users.id |
| categoryId | varchar FK | → categories.id |
| limitAmount | decimal(15,2) | Monthly spending limit |
| month | varchar(7) | 'YYYY-MM' format |
| createdAt | timestamp | |

---

## 5. API Routes (Hono)

```
POST   /api/auth/**              → Better Auth handler (sign-in, sign-up, session)

GET    /api/transactions         → List (filter: month, type, category, search, page)
POST   /api/transactions         → Create transaction
PUT    /api/transactions/:id     → Update (owner check)
DELETE /api/transactions/:id     → Delete (owner check)

GET    /api/budgets              → List budgets for ?month=YYYY-MM
POST   /api/budgets              → Upsert budget limit
PUT    /api/budgets/:id          → Update limit
DELETE /api/budgets/:id          → Remove limit

GET    /api/categories           → List all categories

GET    /api/reports/summary      → { income, expenses, balance, savingsRate }
GET    /api/reports/by-category  → Category breakdown array
GET    /api/reports/monthly      → Month-over-month last 6 months
```

---

## 6. Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/financetracker

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret-here
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NODE_ENV=development
PORT=3000
```

---

## 7. Key Libraries

```json
{
  "dependencies": {
    "react-router": "^7.0.0",
    "@react-router/node": "^7.0.0",
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "@hono/zod-validator": "^0.2.0",
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0",
    "better-auth": "^1.0.0",
    "zod": "^3.22.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.344.0",
    "date-fns": "^3.3.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@react-router/dev": "^7.0.0",
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.4.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "vitest": "^1.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 8. Development Workflow

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Fill in DATABASE_URL and BETTER_AUTH_SECRET

# 4. Push DB schema
npx drizzle-kit push

# 5. Seed database
npm run db:seed

# 6. Start dev server
npm run dev
# → App at http://localhost:5173
# → Drizzle Studio at http://localhost:4983
```

---

## 9. MVP Scope

**Must have (MVP):**
- ✅ Auth (register, login, logout)
- ✅ Dashboard with stats + chart
- ✅ Add / edit / delete transactions
- ✅ Budget limits per category with progress bars
- ✅ Basic reports page

**Nice to have (Post-MVP):**
- Google OAuth
- CSV export
- Recurring transactions
- Multi-currency support
- FinanceAI CLI tool
- Mobile responsive polish
- Dark mode
