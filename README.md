# Personal Finance Tracker

A full-stack personal finance web application with an AI-powered CLI code generator. Track your income, expenses, budgets, and visualize your financial health with intuitive dashboards and reports.

## Features

- **Dashboard**: Overview of financial health with charts and recent transactions
- **Transactions**: Manage income and expenses with filtering, search, and CSV export
- **Budgets**: Set monthly spending limits by category with visual progress tracking
- **Reports**: View income vs expenses trends and category breakdowns with date range selection
- **Authentication**: Secure email-based authentication with Better Auth
- **Dark Mode**: Full dark mode support with theme toggle
- **FinanceAI CLI**: AI-powered code generator for scaffolding features
- **Transactions**: Manage income and expenses with filtering and search
- **Budgets**: Set monthly spending limits by category with visual progress tracking
- **Reports**: View income vs expenses trends and category breakdowns
- **Authentication**: Secure email-based authentication with Better Auth
- **FinanceAI CLI**: AI-powered code generator for scaffolding features

## Tech Stack

### Frontend
- **React Router v7** - Full-stack framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Hono** - Lightweight, fast API framework
- **Drizzle ORM** - Type-safe SQL-like ORM
- **Better Auth** - Authentication solution
- **PostgreSQL** - Relational database

### Development Tools
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **Drizzle Kit** - Database migrations and studio
- **TypeScript** - Static type checking

## Project Structure

```
personal-finance-tracker/
├── app/                          # React Router v7 frontend
│   ├── routes/                   # File-based routes
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   ├── layout/               # Layout components
│   │   └── finance/              # Domain-specific components
│   └── lib/                      # Client utilities
├── server/                       # Hono API server
│   ├── routes/                   # API route handlers
│   └── lib/                      # Server utilities
├── db/                           # Database schema and migrations
│   ├── schema/                   # Drizzle table definitions
│   └── migrations/               # SQL migration files
├── cli/                          # FinanceAI CLI tool
│   ├── commands/                 # CLI commands
│   └── templates/                # Code generation templates
└── README.md                     # This file
```

## Screenshots

> _Screenshots will be added here showing the main features of the application._

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Overview of financial health with key metrics and recent transactions*

### Transactions
![Transactions](docs/screenshots/transactions.png)
*Manage income and expenses with filtering and search capabilities*

### Budgets
![Budgets](docs/screenshots/budgets.png)
*Track spending limits by category with visual progress indicators*

### Reports
![Reports](docs/screenshots/reports.png)
*Visualize income vs expenses trends and category breakdowns*

### Dark Mode
![Dark Mode](docs/screenshots/dark-mode.png)
*Full dark mode support for comfortable viewing*

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Ensure PostgreSQL is running: `docker-compose up -d`
2. Verify your `DATABASE_URL` in `.env` is correct
3. Check if PostgreSQL is accessible: `psql $DATABASE_URL`

### Authentication Issues

**Problem**: `BETTER_AUTH_SECRET must be at least 32 characters`

**Solution**:
```bash
# Generate a secure secret
openssl rand -base64 32
```

Copy the output to your `.env` file as `BETTER_AUTH_SECRET`.

### Build Errors

**Problem**: TypeScript errors during build

**Solution**:
1. Run type check: `npm run type-check`
2. Check for missing dependencies: `npm install`
3. Clear build cache: `rm -rf build node_modules/.vite`

### Port Already in Use

**Problem**: `Error: Port 5173 is already in use`

**Solution**:
```bash
# Find and kill the process using the port
lsof -ti:5173 | xargs kill -9
# Or use a different port
PORT=5174 npm run dev
```

### CSV Export Not Working

**Problem**: Export button doesn't download file

**Solution**:
1. Check browser console for errors
2. Ensure transactions exist before exporting
3. Disable popup blockers for the site

```

## Setup Instructions

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd personal-finance-tracker
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/financetracker

# Better Auth
BETTER_AUTH_SECRET=your-32-character-secret-here
BETTER_AUTH_URL=http://localhost:5173

# App
NODE_ENV=development
PORT=3000
```

### 3. Set Up Database

```bash
# Start PostgreSQL (using Docker)
docker-compose up -d

# Push schema to database
npm run db:push

# Seed with default categories
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at:
- **App**: http://localhost:5173
- **API**: http://localhost:3000
- **Drizzle Studio**: http://localhost:4983

## Development Commands

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Drizzle Studio
npm run db:studio
```

### Testing & Quality

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run type check
npm run type-check

# Run linting
npm run lint
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `BETTER_AUTH_SECRET` | Secret key for auth (32+ chars) | `your-secret-key-here` |
| `BETTER_AUTH_URL` | Base URL of the application | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `3000` |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## API Routes

### Authentication (Better Auth)

```
POST   /api/auth/sign-up/email
POST   /api/auth/sign-in/email
POST   /api/auth/sign-out
GET    /api/auth/session
```

### API Endpoints

```
GET    /api/transactions         → List transactions (with filters)
POST   /api/transactions         → Create transaction
PUT    /api/transactions/:id     → Update transaction
DELETE /api/transactions/:id     → Delete transaction

GET    /api/budgets              → List budgets for month
POST   /api/budgets              → Create budget
PUT    /api/budgets/:id          → Update budget
DELETE /api/budgets/:id          → Delete budget

GET    /api/categories           → List all categories

GET    /api/reports/summary      → Financial summary
GET    /api/reports/monthly      → Monthly trends
GET    /api/reports/by-category  → Category breakdown
```

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative paths like:
import { Button } from '../../../components/ui/Button';

// Use path aliases:
import { Button } from '@app/components/ui';
import { db } from '@server/lib/db';
import { transactions } from '@db/schema';
```

Available aliases:
- `@app/*` → `app/*`
- `@server/*` → `server/*`
- `@db/*` → `db/*`

## License

MIT

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run type check: `npm run type-check`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Create a Pull Request

### Code Standards

- **TypeScript**: Follow strict mode requirements
- **Components**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes, avoid custom CSS when possible
- **Testing**: Write tests for new features and bug fixes
- **Commits**: Use clear, descriptive commit messages

### Pull Request Process

1. Ensure your PR description clearly describes the problem and solution
2. Reference any relevant issues
3. Include screenshots for UI changes
4. Ensure all CI checks pass
5. Request review from maintainers

### Reporting Bugs

Please use the issue tracker and include:
- Clear bug description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node version)

### Feature Requests

We welcome feature requests! Please:
- Check if the feature is already requested
- Describe the use case
- Explain why it would be valuable

Contributions are welcome! Please ensure:

1. TypeScript strict mode is followed
2. All tests pass (`npm test`)
3. Type checking passes (`npm run type-check`)
4. Code follows existing patterns and conventions

---

Built with modern web technologies for reliable personal finance management.
