/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../types/hono.d.ts" />
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql, sum } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { budgets, transactions, categories } from '@db/schema';
import { requireAuth } from '@server/lib/auth-middleware.server';

import { writeLimiter, readLimiter } from '@server/lib/rate-limit';

const app = new Hono();

// List schema for query params
const listQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format, optionally provided
});

// Upsert budget schema
const upsertSchema = z.object({
  categoryId: z.string(),
  limitAmount: z.union([z.string(), z.number()]).transform((v) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return num.toFixed(2);
  }),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
});

// Update budget schema
const updateSchema = z.object({
  limitAmount: z.union([z.string(), z.number()]).transform((v) => {
    const num = typeof v === 'string' ? parseFloat(v) : v;
    return num.toFixed(2);
  }),
});

// Apply auth middleware to all routes
app.use('*', requireAuth);
// Rate limiting
app.use('GET /*', readLimiter);
app.use('POST /*', writeLimiter);
app.use('PUT /*', writeLimiter);
app.use('DELETE /*', writeLimiter);

// GET /api/budgets?month=YYYY-MM - List budgets for month with spending calculation
app.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user') as { id: string };
  const { month: validMonth } = c.req.valid('query');
  const month = validMonth || new Date().toISOString().slice(0, 7); // Default to current YYYY-MM

  // Get budgets for the user and month
  const userBudgets = await db.query.budgets.findMany({
    where: and(eq(budgets.userId, user.id), eq(budgets.month, month)),
    with: {
      category: true,
    },
  });

  // Build correct month boundaries
  const startDate = `${month}-01`;
  // Use next month's first day as exclusive upper bound (handles variable month lengths)
  const [year, monthNum] = month.split('-');
  const nextMonthDate = new Date(Number(year), Number(monthNum), 1); // month is 1-based here = correct next month
  const endDate = nextMonthDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // Single aggregate query: sum expenses per category for the month (avoids N+1)
  const spendingByCategory = await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<string>`COALESCE(sum(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${startDate}::date AND ${transactions.date} < ${endDate}::date`
      )
    )
    .groupBy(transactions.categoryId);

  const spendingMap = new Map(
    spendingByCategory.map((s) => [s.categoryId, s.total])
  );

  const budgetsWithSpending = userBudgets.map((budget) => {
    const spent = parseFloat(spendingMap.get(budget.categoryId) ?? '0');
    const limitAmount = parseFloat(budget.limitAmount);
    return {
      ...budget,
      spent: spent.toFixed(2),
      remaining: (limitAmount - spent).toFixed(2),
      percentageUsed: limitAmount > 0 ? Math.round((spent / limitAmount) * 100) : 0,
    };
  });

  return c.json({
    items: budgetsWithSpending,
    month,
  });
});

// POST /api/budgets - Upsert budget (category + month = unique)
app.post('/', zValidator('json', upsertSchema), async (c) => {
  const user = c.get('user') as { id: string };
  const data = c.req.valid('json');

  // Verify category exists
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, data.categoryId),
  });

  if (!category) {
    return c.json({ error: 'Category not found' }, 400);
  }

  // Check if budget already exists for this category + month
  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, user.id),
      eq(budgets.categoryId, data.categoryId),
      eq(budgets.month, data.month)
    ),
  });

  if (existing) {
    // Update existing budget
    const result = await db
      .update(budgets)
      .set({
        limitAmount: data.limitAmount,
      })
      .where(eq(budgets.id, existing.id))
      .returning();

    return c.json({
      ...result[0],
      updated: true,
    });
  }

  // Create new budget
  const result = await db
    .insert(budgets)
    .values({
      userId: user.id,
      categoryId: data.categoryId,
      limitAmount: data.limitAmount,
      month: data.month,
    })
    .returning();

  return c.json({
    ...result[0],
    updated: false,
  }, 201);
});

// PUT /api/budgets/:id - Update limit amount
app.put('/:id', zValidator('json', updateSchema), async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');
  const { limitAmount } = c.req.valid('json');

  // Check ownership
  const existing = await db.query.budgets.findFirst({
    where: eq(budgets.id, id),
  });

  if (!existing) {
    return c.json({ error: 'Budget not found' }, 404);
  }

  if (existing.userId !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Update budget
  const result = await db
    .update(budgets)
    .set({
      limitAmount,
    })
    .where(eq(budgets.id, id))
    .returning();

  return c.json(result[0]);
});

// DELETE /api/budgets/:id - Remove budget limit (owner check)
app.delete('/:id', async (c) => {
  const user = c.get('user') as { id: string };
  const id = c.req.param('id');

  // Check ownership
  const existing = await db.query.budgets.findFirst({
    where: eq(budgets.id, id),
  });

  if (!existing) {
    return c.json({ error: 'Budget not found' }, 404);
  }

  if (existing.userId !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Delete budget
  await db.delete(budgets).where(eq(budgets.id, id));

  return c.json({ success: true });
});

export default app;
export type BudgetsApp = typeof app;
