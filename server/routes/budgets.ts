/// <reference path="../types/hono.d.ts" />
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, sql, sum } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { budgets, transactions, categories } from '@db/schema';
import { requireAuth } from '@server/lib/auth';

const app = new Hono();

// List schema for query params
const listQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
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

// GET /api/budgets?month=YYYY-MM - List budgets for month with spending calculation
app.get('/', zValidator('query', listQuerySchema), async (c) => {
  const user = c.get('user') as { id: string };
  const { month } = c.req.valid('query');

  // Get budgets for the user and month
  const userBudgets = await db.query.budgets.findMany({
    where: and(eq(budgets.userId, user.id), eq(budgets.month, month)),
    with: {
      category: true,
    },
  });

  // Calculate spending for each budget category
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const budgetsWithSpending = await Promise.all(
    userBudgets.map(async (budget) => {
      // Sum expenses for this category in the month
      const spentResult = await db
        .select({
          total: sum(transactions.amount),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            eq(transactions.categoryId, budget.categoryId),
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${startDate} AND ${transactions.date} <= ${endDate}`
          )
        );

      const spent = spentResult[0]?.total ?? '0';
      const limitAmount = parseFloat(budget.limitAmount);
      const spentAmount = parseFloat(spent);

      return {
        ...budget,
        spent: spentAmount.toFixed(2),
        remaining: (limitAmount - spentAmount).toFixed(2),
        percentageUsed: limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0,
      };
    })
  );

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
