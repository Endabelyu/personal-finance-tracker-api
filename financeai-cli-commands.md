# FinanceAI CLI - Command Reference

AI-powered development tool for personal finance application development.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Code Generation](#code-generation)
- [Database Commands](#database-commands)
- [Test Generation](#test-generation)
- [Documentation](#documentation)
- [Refactoring](#refactoring)
- [Debugging](#debugging)
- [Utilities](#utilities)
- [AI Agent Commands](#ai-agent-commands)
- [Examples](#examples)

---

## Installation

```bash
npm install -g financeai-cli

# Or use npx
npx financeai-cli <command>

# Set up API key
export ANTHROPIC_API_KEY="your-api-key"
# or
financeai config:set-key --provider anthropic --key "your-api-key"
```

---

## Configuration

### Set Project Context

```bash
financeai config:context \
  --framework "express + typescript" \
  --orm "prisma" \
  --testing "jest" \
  --style "functional programming"
```

### Set Coding Conventions

```bash
financeai config:conventions \
  --naming "camelCase for variables, PascalCase for classes" \
  --file-structure "feature-based folders" \
  --imports "absolute paths with @ alias"
```

### Initialize Project

```bash
financeai init \
  --ai-prompt "initialize personal finance app with simplified COA structure, Express, TypeScript, Prisma"
```

---

## Code Generation

### Generate Model

**Basic:**
```bash
financeai generate model Transaction
```

**With AI prompt:**
```bash
financeai generate model Transaction \
  --ai-prompt "include soft delete, timestamps, and user relationship"
```

**Advanced:**
```bash
financeai generate model Investment \
  --fields "symbol:string,quantity:decimal,price:decimal" \
  --relationships "belongsTo:User,hasMany:InvestmentTransaction" \
  --ai-prompt "add calculated fields for total value and unrealized gain/loss"
```

**Options:**
- `--fields` - Comma-separated field definitions (name:type)
- `--relationships` - Comma-separated relationships (type:Model)
- `--ai-prompt` - Custom instructions for AI
- `--output` - Custom output path
- `--template` - Use custom template

### Generate Controller

**CRUD Controller:**
```bash
financeai generate controller TransactionController \
  --model Transaction
```

**With custom logic:**
```bash
financeai generate controller TransactionController \
  --model Transaction \
  --ai-prompt "include balance calculation endpoint, reconciliation endpoint, and transaction summary by category"
```

**Options:**
- `--model` - Associated model name
- `--type` - Controller type (rest, graphql)
- `--middleware` - Include specific middleware (auth, validation)

### Generate Service

```bash
financeai generate service TransactionService \
  --ai-prompt "include balance calculation, reconciliation logic, transaction validation, and support for split transactions"
```

**With repository pattern:**
```bash
financeai generate service TransactionService \
  --repository TransactionRepository \
  --ai-prompt "use repository for data access, implement business logic for double-entry bookkeeping"
```

### Generate Repository

```bash
financeai generate repository TransactionRepository \
  --model Transaction \
  --ai-prompt "include methods for date range queries, category grouping, balance calculations, and pagination"
```

### Generate Routes

```bash
financeai generate routes transactions \
  --controller TransactionController \
  --middleware auth,validation

# With versioning
financeai generate routes transactions \
  --controller TransactionController \
  --version v1 \
  --ai-prompt "RESTful routes with proper HTTP methods, include filtering, sorting, pagination"
```

### Scaffold Complete Feature

```bash
financeai scaffold Transaction \
  --type rest-api \
  --ai-prompt "full CRUD with soft delete, pagination, filtering by date and category, include tests"
```

**Generates:**
- Model
- Service
- Controller
- Routes
- Validation schemas
- Tests
- Migration

**Options:**
- `--type` - Feature type (rest-api, graphql, minimal)
- `--include` - Components to generate (model,service,controller,tests)
- `--skip` - Components to skip

---

## Database Commands

### Generate Migration

**Create table:**
```bash
financeai db:migration create_transactions_table \
  --ai-prompt "transaction table with amount, date, type enum (expense,income,transfer), account and category foreign keys, soft delete, timestamps, indexes on date and user_id"
```

**Alter table:**
```bash
financeai db:migration add_journal_id_to_transactions \
  --ai-prompt "add journal_id column as nullable bigint with foreign key to journal_headers for future COA migration"
```

**Complex migration:**
```bash
financeai db:migration setup_coa_structure \
  --ai-prompt "create accounts table with hierarchical structure (id, code, name, type enum, parent_id, balance, is_active), include indexes, add seed data for common personal finance categories"
```

**Options:**
- `--up` - Only generate up migration
- `--rollback` - Generate with rollback logic
- `--data` - Include data migration

### Generate Seeder

**Basic seed:**
```bash
financeai db:seed accounts \
  --ai-prompt "seed common personal finance accounts: Cash, bank accounts (BCA, Mandiri), expense categories (Food & Dining, Transportation, Shopping, Bills), income categories (Salary, Freelance)"
```

**Demo data:**
```bash
financeai db:seed demo-user \
  --ai-prompt "create demo user with realistic transactions for last 3 months, various categories, budgets set for major categories, 2 saving goals"
```

**Test data:**
```bash
financeai db:seed test-data \
  --ai-prompt "generate 100 random but realistic transactions across different categories, date ranges, and amounts, include some split transactions"
```

**Options:**
- `--count` - Number of records to generate
- `--user-id` - Seed for specific user
- `--date-range` - Date range for transactions

### Database Analysis

**Analyze schema:**
```bash
financeai db:analyze \
  --ai-prompt "review current schema, identify missing indexes for common queries, suggest performance optimizations"
```

**Generate ER Diagram:**
```bash
financeai db:diagram --output ./docs/schema.md

# With AI description
financeai db:diagram --output ./docs/schema.md \
  --ai-prompt "include relationship descriptions and business logic notes"
```

**Migration Planning:**
```bash
financeai db:migrate-plan simple-to-coa \
  --ai-prompt "generate step-by-step migration plan from current simplified schema to full COA with journal_headers and journal_lines, include data transformation scripts and rollback plan"
```

**Schema Diff:**
```bash
financeai db:diff production staging \
  --ai-prompt "compare schemas and generate migration to sync staging to production"
```

### Schema Optimization

```bash
financeai schema:optimize \
  --ai-prompt "analyze query patterns from logs, suggest index improvements, identify N+1 queries, recommend denormalization opportunities"
```

---

## Test Generation

### Unit Tests

**Test service:**
```bash
financeai test:unit TransactionService \
  --ai-prompt "test cases for createExpense, editTransaction, deleteTransaction, with edge cases: negative amounts, concurrent updates, balance reconciliation"
```

**Test model:**
```bash
financeai test:unit Transaction \
  --ai-prompt "test validations, relationships, computed properties, soft delete behavior"
```

**Options:**
- `--coverage` - Target coverage percentage (default: 80)
- `--watch` - Generate with watch mode setup
- `--mocks` - Auto-generate mock objects

### Integration Tests

**API integration:**
```bash
financeai test:integration /api/transactions \
  --ai-prompt "test full CRUD flow, authentication, authorization, pagination, filtering by date and category, error handling"
```

**Database integration:**
```bash
financeai test:integration TransactionService \
  --ai-prompt "test transactions with actual database, verify balance updates, test rollback on errors, concurrent transaction handling"
```

### E2E Tests

```bash
financeai test:e2e transaction-flow \
  --ai-prompt "user creates expense, edits amount and category, deletes it, verify balance updates correctly at each step, check audit trail"
```

### Generate Test Data Factories

```bash
financeai test:factory Transaction \
  --ai-prompt "create factory with realistic default values, support for different transaction types, related objects (user, account, category)"
```

### Test Coverage Report

```bash
financeai test:coverage-report \
  --ai-prompt "analyze current test coverage, identify untested critical paths, suggest priority test cases"
```

---

## Documentation

### API Documentation

**OpenAPI/Swagger:**
```bash
financeai docs:api --output ./docs/api.yaml \
  --ai-prompt "generate OpenAPI 3.0 spec for all transaction endpoints with request/response examples, authentication, error codes"
```

**Markdown API docs:**
```bash
financeai docs:endpoints --output ./docs/API.md \
  --ai-prompt "generate comprehensive API documentation with curl examples, response samples, error handling guide"
```

### Code Comments

**Add JSDoc:**
```bash
financeai docs:comment ./src/services/TransactionService.ts \
  --ai-prompt "add comprehensive JSDoc comments explaining business logic, edge cases, parameters, return types, throws"
```

**Batch comment:**
```bash
financeai docs:comment ./src/services/*.ts \
  --ai-prompt "add JSDoc to all service methods"
```

### README Generation

**Project README:**
```bash
financeai docs:readme \
  --ai-prompt "generate project README with architecture overview, setup instructions, development guide, deployment guide"
```

**Section-specific:**
```bash
financeai docs:readme --section database \
  --ai-prompt "explain database schema, relationships, design decisions, migration strategy"

financeai docs:readme --section api \
  --ai-prompt "API usage guide with authentication, rate limiting, pagination, filtering examples"
```

### Architecture Documentation

```bash
financeai docs:architecture \
  --ai-prompt "document overall system architecture, service layers, data flow, authentication flow, key design decisions"
```

**Decision records:**
```bash
financeai docs:decisions \
  --ai-prompt "document ADR (Architecture Decision Record) for choosing simplified schema over full COA in Phase 1, include trade-offs, migration path, triggers for upgrade"
```

### Generate Changelog

```bash
financeai docs:changelog --from v1.0.0 --to v1.1.0 \
  --ai-prompt "generate user-friendly changelog from git commits, categorize by features, fixes, breaking changes"
```

---

## Refactoring

### Code Analysis

```bash
financeai analyze ./src/services \
  --ai-prompt "identify code smells, suggest improvements, flag potential bugs, security issues, performance bottlenecks"
```

**Complexity analysis:**
```bash
financeai analyze:complexity ./src/services/TransactionService.ts \
  --ai-prompt "identify high-complexity methods, suggest simplification strategies"
```

### Suggest Refactoring

```bash
financeai refactor:suggest TransactionService \
  --ai-prompt "suggest service layer improvements, extract reusable logic into separate services, improve error handling, add proper logging"
```

### Apply Refactoring

```bash
financeai refactor:apply TransactionService \
  --ai-prompt "extract balance calculation logic into BalanceService, add proper error handling, improve type safety, add validation" \
  --review  # Show diff before applying
```

**Options:**
- `--review` - Show changes before applying
- `--backup` - Create backup before refactoring
- `--dry-run` - Show what would change without applying

### Extract Component

```bash
financeai refactor:extract balance-calculation \
  --from TransactionService \
  --to BalanceService \
  --ai-prompt "extract all balance calculation logic, include reconciliation methods"
```

### Modernize Code

```bash
financeai refactor:modernize ./src/legacy \
  --ai-prompt "convert callbacks to async/await, use modern ES6+ features, improve error handling"
```

---

## Debugging

### Generate Debug Helpers

**Add logging:**
```bash
financeai debug:logging TransactionService \
  --ai-prompt "add structured logging for all balance calculations, transaction operations, include request ID, user context, timing"
```

**Debug endpoint:**
```bash
financeai debug:endpoint /debug/reconcile \
  --ai-prompt "create debug endpoint to reconcile account balances, report discrepancies, suggest fixes, include dry-run mode"
```

### Generate Error Handlers

```bash
financeai generate error-handler \
  --ai-prompt "create centralized error handler with proper HTTP status codes, user-friendly messages, logging, error tracking integration"
```

### Performance Profiling

```bash
financeai debug:profile TransactionService \
  --ai-prompt "add performance profiling to identify slow operations, database query optimization opportunities"
```

---

## Utilities

### Code Review

```bash
financeai review ./src/services/TransactionService.ts \
  --ai-prompt "review for security issues, SQL injection risks, XSS vulnerabilities, performance problems, best practices violations"
```

**Pull request review:**
```bash
financeai review:pr --branch feature/budget-tracking \
  --ai-prompt "review PR changes, check for breaking changes, suggest improvements, identify potential bugs"
```

### Generate Boilerplate

**New feature:**
```bash
financeai feature budget-tracking \
  --ai-prompt "scaffold complete budget tracking feature: model with monthly budgets per category, service with spent calculation, controller with CRUD and summary endpoints, routes, validation, tests"
```

**New module:**
```bash
financeai module investment \
  --ai-prompt "create investment tracking module with portfolio management, real-time price updates via API, P&L calculation, asset allocation"
```

### Code Formatting

```bash
financeai format ./src \
  --ai-prompt "format code according to project conventions, fix linting issues, organize imports"
```

### Dependency Analysis

```bash
financeai deps:analyze \
  --ai-prompt "analyze dependencies, identify outdated packages, security vulnerabilities, suggest updates, check for unused dependencies"
```

### Generate Security Audit

```bash
financeai security:audit \
  --ai-prompt "audit authentication implementation, authorization logic, input validation, SQL injection risks, XSS vulnerabilities, generate security report"
```

---

## AI Agent Commands

### Interactive Mode

```bash
financeai chat

# Example interaction:
> "I need to add recurring transaction support"

AI: Let me help you with that. I'll need to:
    1. Create RecurringTransaction model with frequency, interval, next_occurrence
    2. Add scheduler service using node-cron
    3. Create cron job to process due transactions
    4. Add API endpoints for CRUD operations
    5. Generate tests
    
    Proceed? (y/n)

> "yes, but use node-cron for scheduling"

AI: Got it. Generating files...
    ✅ Created model: RecurringTransaction
    ✅ Created service: RecurringTransactionService
    ✅ Created scheduler: TransactionScheduler
    ✅ Created controller: RecurringTransactionController
    ✅ Created routes: /api/recurring-transactions
    ✅ Created tests
    
    Next steps:
    1. Run migration: npm run migrate
    2. Start scheduler: add to app startup
    3. Test: npm test

> "generate migration"

AI: Generating migration...
    ✅ Created migration: create_recurring_transactions_table
```

### Context-Aware Generation

```bash
financeai generate service NotificationService \
  --context-aware \
  --ai-prompt "notification service for budget alerts and bill reminders, use existing user preferences and notification channels from config, integrate with email service"
```

**Follow existing patterns:**
```bash
financeai generate controller DebtController \
  --follow-pattern TransactionController \
  --ai-prompt "follow same structure as TransactionController but adapt for debt management: CRUD operations, payment tracking, amortization schedule"
```

### Batch Operations

```bash
financeai batch generate investment-module \
  --ai-prompt "complete investment tracking module: Investment and InvestmentTransaction models, portfolio service with P&L calculation, price update service with API integration, controller with CRUD and analytics endpoints, routes, validation, comprehensive tests, migrations"
```

### AI Explain

```bash
financeai explain ./src/services/TransactionService.ts \
  --ai-prompt "explain this service, how it works, business logic, edge cases, improvement suggestions"
```

### AI Suggest

```bash
financeai suggest \
  --context "I need to implement sharing mode where multiple users can collaborate on budgets" \
  --ai-prompt "suggest complete implementation approach: database schema changes, service layer modifications, permission system, API changes, testing strategy"
```

### Generate from Natural Language

```bash
financeai create "a feature where users can split expenses among multiple people, track who owes what, and mark payments" \
  --ai-prompt "design and implement complete expense splitting feature"
```

---

## Template Management

### Save Template

```bash
financeai template:save service-template \
  --from ./src/services/TransactionService.ts \
  --ai-prompt "extract template with placeholders for model name, business logic"
```

### List Templates

```bash
financeai template:list
```

### Use Template

```bash
financeai generate service BudgetService \
  --template service-template \
  --ai-prompt "adapt for budget CRUD operations with spending calculation"
```

### Share Template

```bash
financeai template:export service-template \
  --output ./templates/service-template.json

financeai template:import ./templates/service-template.json
```

---

## Examples

### Example 1: Complete Feature Development

```bash
# 1. Scaffold the feature
financeai scaffold Budget --type rest-api \
  --ai-prompt "monthly budget per category with alert thresholds, spent vs budget calculation, include rollover support for unused budget"

# 2. Review generated code
financeai review ./src/modules/budget \
  --ai-prompt "check for security issues and best practices"

# 3. Generate additional tests
financeai test:unit BudgetService --coverage 90 \
  --ai-prompt "test edge cases: negative budgets, overspending, rollover calculations, concurrent updates"

# 4. Generate API documentation
financeai docs:api --output ./docs/budget-api.yaml \
  --ai-prompt "document budget API endpoints with examples"

# Output:
✅ Generated model: Budget (./src/models/Budget.ts)
✅ Generated service: BudgetService (./src/services/BudgetService.ts)
✅ Generated controller: BudgetController (./src/controllers/BudgetController.ts)
✅ Generated routes: /api/budgets (./src/routes/budget.routes.ts)
✅ Generated validation: budget.validation.ts
✅ Generated tests: BudgetService.test.ts (coverage: 92%)
✅ Generated migration: 20260227_create_budgets_table.ts
✅ Generated API docs: ./docs/budget-api.yaml
```

### Example 2: Database Migration

```bash
# 1. Plan migration
financeai db:migrate-plan simple-to-coa \
  --ai-prompt "generate complete migration plan from simplified schema to full COA with journal entries"

# 2. Generate migration files
financeai db:migration setup_journal_structure \
  --ai-prompt "create journal_headers and journal_lines tables with proper indexes and foreign keys"

financeai db:migration add_journal_support_to_transactions \
  --ai-prompt "add journal_id to transactions table for linking"

# 3. Generate data migration script
financeai db:migration migrate_transactions_to_journals \
  --ai-prompt "convert existing transactions to journal entries, create opening balances from current account balances"

# 4. Generate rollback plan
financeai db:rollback-plan journal-migration \
  --ai-prompt "create rollback strategy if migration fails"
```

### Example 3: Add Tests to Existing Code

```bash
# 1. Analyze coverage
financeai test:coverage-report \
  --ai-prompt "identify untested critical paths in transaction handling"

# 2. Generate missing tests
financeai test:unit TransactionService \
  --missing-only \
  --ai-prompt "generate tests for uncovered methods, focus on edge cases"

# 3. Generate integration tests
financeai test:integration TransactionFlow \
  --ai-prompt "test complete transaction flow: create, edit, delete with balance updates"

# 4. Run and verify
npm test
```

### Example 4: Refactor Legacy Code

```bash
# 1. Analyze code
financeai analyze ./src/legacy/AccountManager.js \
  --ai-prompt "identify code smells, complexity issues, outdated patterns"

# 2. Get refactoring suggestions
financeai refactor:suggest ./src/legacy/AccountManager.js \
  --ai-prompt "suggest modern approach using service layer, async/await, proper error handling"

# 3. Apply refactoring with review
financeai refactor:apply ./src/legacy/AccountManager.js \
  --ai-prompt "convert to TypeScript, use modern patterns, extract business logic to services" \
  --review

# 4. Generate tests for refactored code
financeai test:unit AccountService \
  --ai-prompt "comprehensive tests for refactored account management logic"
```

### Example 5: Interactive Development Session

```bash
financeai chat

> "I need to add support for multiple currencies"

AI: Great! For multi-currency support, I recommend:
    1. Add currency field to accounts table
    2. Add exchange_rate table for historical rates
    3. Create CurrencyService for conversions
    4. Update TransactionService to handle currency conversion
    5. Add currency selection in UI
    
    Should I start with database schema changes? (y/n)

> "yes"

AI: Generating migration...
    ✅ Created migration: add_currency_support
    
    Migration includes:
    - currency VARCHAR(3) on accounts table (default: 'IDR')
    - exchange_rates table (from_currency, to_currency, rate, date)
    - Index on exchange_rates(from_currency, to_currency, date)
    
    Next: Shall I generate the CurrencyService? (y/n)

> "yes, integrate with exchangerate-api.com"

AI: Creating CurrencyService with exchangerate-api integration...
    ✅ Created service: CurrencyService
    ✅ Added methods: convert, getRate, updateRates
    ✅ Added cron job for daily rate updates
    ✅ Created tests: CurrencyService.test.ts
    
    Environment variables needed:
    - EXCHANGE_RATE_API_KEY
    
    Would you like me to update the TransactionService to use currency conversion? (y/n)

> "yes"

AI: Updating TransactionService...
    ✅ Updated TransactionService.createExpense to handle currency
    ✅ Updated balance calculations with currency conversion
    ✅ Updated tests
    
    All done! Summary:
    - Database migration ready
    - CurrencyService implemented
    - TransactionService updated
    - Tests added
    
    Next steps:
    1. Review changes: git diff
    2. Run migration: npm run migrate
    3. Set EXCHANGE_RATE_API_KEY in .env
    4. Run tests: npm test
```

---

## Global Options

These options work with most commands:

- `--ai-prompt <text>` - Custom instruction for AI
- `--output <path>` - Specify output location
- `--dry-run` - Show what would be generated without creating files
- `--verbose` - Detailed output
- `--yes` - Skip confirmations
- `--template <name>` - Use specific template
- `--context-aware` - Analyze project context before generating
- `--follow-pattern <file>` - Follow pattern from existing file

---

## Configuration File

Create `.financeai.json` in project root:

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "framework": "express",
  "language": "typescript",
  "orm": "prisma",
  "testing": "jest",
  "conventions": {
    "naming": {
      "variables": "camelCase",
      "classes": "PascalCase",
      "files": "kebab-case"
    },
    "fileStructure": "feature-based",
    "imports": "absolute-with-alias"
  },
  "paths": {
    "models": "./src/models",
    "services": "./src/services",
    "controllers": "./src/controllers",
    "routes": "./src/routes",
    "tests": "./src/__tests__",
    "migrations": "./prisma/migrations"
  },
  "templates": {
    "service": "./templates/service.template.ts",
    "controller": "./templates/controller.template.ts"
  }
}
```

---

## Best Practices

### 1. Always review generated code
```bash
financeai generate service UserService --dry-run
# Review output, then run without --dry-run
```

### 2. Use descriptive AI prompts
```bash
# ❌ Bad
financeai generate service Payment

# ✅ Good
financeai generate service PaymentService \
  --ai-prompt "handle credit card payments, support refunds, integrate with Stripe, include fraud detection checks, proper error handling"
```

### 3. Leverage context-aware generation
```bash
financeai generate controller BudgetController \
  --context-aware \
  --follow-pattern TransactionController
```

### 4. Generate tests alongside code
```bash
financeai scaffold Feature \
  --include model,service,controller,tests
```

### 5. Use interactive mode for complex tasks
```bash
financeai chat
# Iteratively build features with AI guidance
```

---

## Troubleshooting

### Command not found
```bash
# Check installation
npm list -g financeai-cli

# Reinstall if needed
npm install -g financeai-cli
```

### AI API errors
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Test connection
financeai test-connection
```

### Generated code issues
```bash
# Review with AI
financeai review ./generated-file.ts --ai-prompt "check for issues"

# Regenerate with more context
financeai generate service MyService \
  --context-aware \
  --ai-prompt "more detailed requirements..."
```

---

## Advanced Usage

### Chain commands
```bash
financeai scaffold Budget --type rest-api && \
financeai test:unit BudgetService && \
financeai docs:api --output ./docs/budget-api.yaml
```

### Custom scripts
```bash
# Create custom workflow script
cat > scripts/add-feature.sh << 'EOF'
#!/bin/bash
FEATURE_NAME=$1
financeai scaffold $FEATURE_NAME --type rest-api
financeai test:unit ${FEATURE_NAME}Service --coverage 85
financeai docs:api --output ./docs/${FEATURE_NAME,,}-api.yaml
echo "✅ Feature $FEATURE_NAME created successfully"
EOF

chmod +x scripts/add-feature.sh
./scripts/add-feature.sh Investment
```

### CI/CD Integration
```bash
# In CI pipeline
financeai test:coverage-report --fail-under 80
financeai security:audit --fail-on-high
financeai docs:api --output ./docs/api.yaml --verify
```

---

## Version & Help

```bash
# Show version
financeai --version

# Show help
financeai --help

# Command-specific help
financeai generate --help
financeai db:migration --help
```

---

## Community & Support

- GitHub: https://github.com/yourusername/financeai-cli
- Issues: https://github.com/yourusername/financeai-cli/issues
- Docs: https://financeai-cli.dev
- Discord: https://discord.gg/financeai

---

## License

MIT License - See LICENSE file for details
