import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema/*',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/financetracker',
  },
} satisfies Config;
  