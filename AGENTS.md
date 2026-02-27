# AGENTS.md — Personal Finance Tracker

> Guidelines for AI assistants working on this codebase.
> Reference: [PLANNING.md](./PLANNING.md) | [TASKS.md](./TASKS.md)

---

## 1. Project Overview

**Personal Finance Tracker** is a full-stack personal finance web application with an AI-powered CLI code generator.

- **Web App**: Dashboard, transactions, budgets, reports, authentication
- **FinanceAI CLI**: AI-powered code generator for scaffolding features

### Current State
- Repository has comprehensive planning documents (PLANNING.md, TASKS.md)
- Project is in early planning phase — directory structure documented but not fully implemented
- Development follows phased approach (Phase 0 through Phase 8)

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Router v7                          │
│              (SSR Frontend + Loaders/Actions)               │
│                      app/routes/                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ hono/client (fully typed RPC)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Hono API Server                         │
│                    server/routes/                           │
│                      /api/*                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Drizzle ORM                             │
│                    db/schema/                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Modules

| Module | Purpose | Location |
|--------|---------|----------|
| Frontend | React Router v7 app with SSR | `app/` |
| API | Hono server with typed RPC | `server/` |
| Database | Drizzle schema and migrations | `db/` |
| CLI | FinanceAI code generator | `cli/` |
| Auth | Better Auth (Drizzle adapter) | `server/lib/auth.ts` |

---

## 3. Key Directories

```
personal-finance-tracker/
├── app/                          # React Router v7 frontend
│   ├── routes/                   # File-based routes
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   ├── layout/               # Sidebar, Header, AppLayout
│   │   └── finance/              # Domain-specific components
│   └── lib/                      # Client utilities
│
├── server/                       # Hono API server
│   ├── routes/                   # API route handlers
│   └── lib/                      # Server utilities (db, auth)
│
├── db/                           # Database schema and migrations
│   ├── schema/                   # Drizzle table definitions
│   └── migrations/               # drizzle-kit SQL files
│
├── cli/                          # FinanceAI CLI tool
│   ├── commands/                 # CLI commands
│   └── templates/                # Code generation templates
│
└── [config files]                # See Important Files section
```

---

## 4. Development Commands

### Setup
```bash
# Start PostgreSQL
docker-compose up -d

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET
```

### Database
```bash
# Generate migration
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push

# Seed database
npm run db:seed

# Open Drizzle Studio
npx drizzle-kit studio
```

### Development
```bash
# Start dev server
npm run dev
# → App at http://localhost:5173
# → Drizzle Studio at http://localhost:4983
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Testing & QA
```bash
# Run tests
npm test

# Run type check
npm run type-check

# Run linting
npm run lint
```

---

## 5. Code Conventions & Common Patterns

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Routes | kebab-case with dots for nesting | `auth.login.tsx`, `_app.dashboard.tsx` |
| Components | PascalCase | `Button.tsx`, `StatCard.tsx` |
| Utilities | camelCase | `auth-client.ts`, `api-client.ts` |
| Schema files | camelCase | `transactions.ts`, `categories.ts` |

### TypeScript Conventions

- **Strict mode enabled** — no implicit any
- **Path aliases**: `@app/*`, `@server/*`, `@db/*`
- **Explicit return types** on exported functions
- **Interface over Type** for object shapes

### React Router Patterns

```typescript
// Route loader with auth check
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const transactions = await getTransactions(session.userId);
  return { transactions };
}

// Route action with form handling
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = schema.safeParse(Object.fromEntries(formData));
  
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }
  
  await createTransaction(result.data);
  return redirect('/transactions');
}
```

### Hono Route Patterns

```typescript
// Route handler with Zod validation
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().transform((v) => parseFloat(v)),
  categoryId: z.string(),
  description: z.string().optional(),
  date: z.string().date(),
});

app.post('/transactions', zValidator('json', createSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.getVar('user'); // from auth middleware
  
  const transaction = await db.insert(transactions)
    .values({ ...data, userId: user.id })
    .returning();
    
  return c.json(transaction[0], 201);
});
```

### Drizzle Schema Patterns

```typescript
// Table definition with relations
import { pgTable, uuid, varchar, decimal, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 10 }).notNull(), // 'income' | 'expense'
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  categoryId: varchar('category_id').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));
```

### Error Handling

```typescript
// API error responses
app.onError((err, c) => {
  console.error(err);
  
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Client error handling
const response = await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify(data),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Failed to create transaction');
}
```

---

## 6. Important Files

### Entry Points
| File | Purpose |
|------|---------|
| `app/root.tsx` | React Router root component (HTML shell) |
| `app/entry.client.tsx` | Client-side hydration entry |
| `app/entry.server.tsx` | Server-side rendering entry |
| `server/index.ts` | Hono server entry point |
| `cli/bin/financeai.ts` | CLI entry point |

### Configuration
| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + React Router plugin config |
| `react-router.config.ts` | React Router framework config |
| `drizzle.config.ts` | Drizzle ORM config |
| `tailwind.config.js` | Tailwind CSS config |
| `tsconfig.json` | TypeScript config with path aliases |
| `docker-compose.yml` | PostgreSQL + pgAdmin services |

### Key Modules
| File | Purpose |
|------|---------|
| `server/lib/db.ts` | Drizzle + postgres connection |
| `server/lib/auth.ts` | Better Auth instance |
| `app/lib/auth-client.ts` | Better Auth React client |
| `app/lib/api-client.ts` | Hono RPC client |
| `db/schema/index.ts` | Schema exports |

---

## 7. Runtime/Tooling Preferences

### Required Runtime
- **Node.js**: 18+ (LTS recommended)
- **Package Manager**: npm (workspaces enabled)

### Core Tooling
| Tool | Purpose | Version |
|------|---------|---------|
| TypeScript | Language | ^5.4.0 |
| Vite | Build tool | ^5.1.0 |
| React Router | Framework | ^7.0.0 |
| Hono | API server | ^4.0.0 |
| Drizzle ORM | Database ORM | ^0.30.0 |
| Drizzle Kit | Migrations | ^0.20.0 |
| Tailwind CSS | Styling | ^3.4.0 |
| Better Auth | Authentication | ^1.0.0 |
| Vitest | Testing | ^1.4.0 |

### Constraints
- **No Express** — use Hono for API
- **No Prisma** — use Drizzle ORM
- **No Next.js** — use React Router v7
- **Edge-ready** — code should work on Cloudflare Workers

---

## 8. Testing & QA

### Test Framework
- **Vitest** for unit and integration tests
- **@testing-library/react** for component tests
- **hono/testing** for API route tests

### Test Commands
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- transactions.test.ts
```

### Coverage Expectations
- Business logic: 80%+ coverage
- API routes: 70%+ coverage
- UI components: 60%+ coverage

### Testing Patterns

```typescript
// API route test
import { testClient } from 'hono/testing';
import { app } from '../server';

const client = testClient(app);

describe('GET /api/transactions', () => {
  it('returns transactions for authenticated user', async () => {
    const res = await client.api.transactions.$get();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBeInstanceOf(Array);
  });
});
```

---

## 9. Environment Variables

### Required
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/financetracker

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret-here
BETTER_AUTH_URL=http://localhost:5173

# App
NODE_ENV=development
PORT=3000
```

### Optional
```env
# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Security Notes
- Never commit `.env` files
- Use strong random value for `BETTER_AUTH_SECRET` (32+ chars)
- `DATABASE_URL` should use connection pooling in production

---

## 10. API Routes

### Authentication (Better Auth)
```
POST   /api/auth/sign-up/email
POST   /api/auth/sign-in/email
POST   /api/auth/sign-out
GET    /api/auth/session
```

### Transactions
```
GET    /api/transactions         → List (filter: month, type, category, search, page)
POST   /api/transactions         → Create transaction
PUT    /api/transactions/:id     → Update (owner check)
DELETE /api/transactions/:id     → Delete (owner check)
```

### Budgets
```
GET    /api/budgets              → List budgets for ?month=YYYY-MM
POST   /api/budgets              → Upsert budget limit
PUT    /api/budgets/:id          → Update limit
DELETE /api/budgets/:id          → Remove limit
```

### Categories
```
GET    /api/categories           → List all categories (public, seeded)
```

### Reports
```
GET    /api/reports/summary      → { income, expenses, balance, savingsRate }
GET    /api/reports/by-category  → Category breakdown array
GET    /api/reports/monthly      → Month-over-month last 6 months
```

---

## 11. Database Schema

### Core Tables

#### users *(managed by Better Auth)*
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | Better Auth UUID |
| email | text UNIQUE | |
| name | text | |
| emailVerified | boolean | |
| image | text | Avatar URL |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### categories
| Column | Type | Notes |
|--------|------|-------|
| id | varchar PK | 'food', 'transport', etc. |
| label | varchar | Display name |
| color | varchar | Hex color |
| icon | varchar | Emoji |
| type | enum | 'income' \| 'expense' \| 'both' |

#### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| userId | text FK | → users.id |
| type | enum | 'income' \| 'expense' |
| amount | decimal(15,2) | Always positive |
| categoryId | varchar FK | → categories.id |
| description | text | |
| date | date | Transaction date |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### budgets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| userId | text FK | → users.id |
| categoryId | varchar FK | → categories.id |
| limitAmount | decimal(15,2) | Monthly spending limit |
| month | varchar(7) | 'YYYY-MM' format |
| createdAt | timestamp | |

---

## 12. Development Workflow

### Phase-Based Development

Development follows 9 phases in strict order:

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
 Setup     Schema     Auth       API       UI Base    Pages      CLI       Tests      Polish
```

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 0 | Project Scaffolding | package.json, configs, Docker, base setup |
| 1 | Database Schema | Drizzle tables, migrations, seed data |
| 2 | Auth | Better Auth setup, login/register pages |
| 3 | Core API Routes | Hono routes for transactions, budgets, reports |
| 4 | UI Base Components | Layout, buttons, forms, finance components |
| 5 | Pages | Dashboard, transactions, budget, reports |
| 6 | FinanceAI CLI | Code generation CLI tool |
| 7 | Testing | Unit, integration tests |
| 8 | Polish & DevOps | UI polish, CSV export, CI/CD |

### MVP Checklist
Minimum to ship:
- [ ] Phase 0 complete
- [ ] Phase 1 complete
- [ ] Phase 2 complete (email auth only)
- [ ] Phase 3.1 + 3.2 + 3.3 complete (categories + transactions + budgets)
- [ ] Phase 4 complete
- [ ] Phase 5.1 + 5.2 + 5.3 complete (dashboard + transactions + budget)

### Before Committing Code

1. **Type check**: `npm run type-check`
2. **Lint**: `npm run lint`
3. **Test**: `npm test`
4. **Verify** no `.env` files committed
5. **Verify** no `console.log` in production code

---

## Quick Reference

### Common Imports
```typescript
// Server
import { db } from '@server/lib/db';
import { auth } from '@server/lib/auth';

// Client
import { authClient } from '@app/lib/auth-client';
import { api } from '@app/lib/api-client';

// Database
import { transactions, categories, budgets } from '@db/schema';
```

### Path Aliases
```json
{
  "@app/*": ["./app/*"],
  "@server/*": ["./server/*"],
  "@db/*": ["./db/*"]
}
```

### Getting Help
- See [PLANNING.md](./PLANNING.md) for detailed tech decisions
- See [TASKS.md](./TASKS.md) for atomic task breakdown
- Check `server/lib/` for auth and db setup examples
- Check `app/components/ui/` for component patterns
