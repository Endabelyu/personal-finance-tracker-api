# FinanceAI CLI

CLI tool for scaffolding and managing your personal finance tracker.

## Installation

```bash
npm install -g ./cli
# or
npx ./cli financeai
```

## Commands

### `init`
Initialize a new FinanceAI project configuration:
```bash
financeai init
```

### `generate` (alias: `g`)
Generate code files:
```bash
financeai generate model <Name>
financeai generate service <Name>
financeai generate controller <Name>
financeai generate test <Name>
```

### Database Commands
```bash
financeai db:migration [options]   # Generate migration
financeai db:push                  # Push schema changes
financeai db:seed                  # Seed database
financeai db:reset                 # Reset database (drops all data!)
financeai db:studio                # Open Drizzle Studio
```

### Test Commands
```bash
financeai test run [pattern]       # Run tests once
financeai test watch [pattern]     # Run tests in watch mode
financeai test coverage            # Run with coverage
financeai test ui                  # Run with Vitest UI
```

## Configuration

The CLI creates a `.financeai.json` file with project settings:

```json
{
  "name": "my-app",
  "database": {
    "dialect": "postgresql",
    "url": "postgresql://user:pass@localhost/db"
  },
  "paths": {
    "schema": "./db/schema",
    "migrations": "./db/migrations",
    "routes": "./server/routes",
    "tests": "./tests"
  }
}
```

## Dependencies

- Commander.js - CLI framework
- Chalk - Terminal colors
- Ora - Loading spinners
- Inquirer - Interactive prompts
- fs-extra - File utilities