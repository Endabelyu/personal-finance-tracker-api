import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { db } from '@server/lib/db';
import { transactions, categories } from '@db/schema';

export interface ListTransactionsOptions {
  userId: string;
  month?: string;
  type?: 'income' | 'expense';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listTransactions(options: ListTransactionsOptions) {
  const { userId, month, type, category, search, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions: (SQL | undefined)[] = [eq(transactions.userId, userId)];

  if (month) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    conditions.push(
      sql`${transactions.date} >= ${startDate} AND ${transactions.date} <= ${endDate}`
    );
  }

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  if (category) {
    conditions.push(eq(transactions.categoryId, category));
  }

  if (search) {
    conditions.push(like(transactions.description, `%${search}%`));
  }

  const items = await db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit,
    offset,
    with: { category: true },
  });

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface CreateTransactionInput {
  userId: string;
  type: 'income' | 'expense';
  amount: string;
  categoryId: string;
  description?: string;
  date: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, input.categoryId),
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const result = await db
    .insert(transactions)
    .values({
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      description: input.description,
      date: new Date(input.date),
      userId: input.userId,
    })
    .returning();

  return result[0];
}

export interface UpdateTransactionInput {
  type?: 'income' | 'expense';
  amount?: string;
  categoryId?: string;
  description?: string;
  date?: string;
}

export async function updateTransaction(id: string, userId: string, input: UpdateTransactionInput) {
  const existing = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!existing) {
    throw Object.assign(new Error('Transaction not found'), { status: 404 });
  }

  if (existing.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  if (input.categoryId) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, input.categoryId),
    });
    if (!category) {
      throw Object.assign(new Error('Category not found'), { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.type) updateData.type = input.type;
  if (input.amount) updateData.amount = input.amount;
  if (input.categoryId) updateData.categoryId = input.categoryId;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.date) updateData.date = new Date(input.date);

  const result = await db
    .update(transactions)
    .set(updateData)
    .where(eq(transactions.id, id))
    .returning();

  return result[0];
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });

  if (!existing) {
    throw Object.assign(new Error('Transaction not found'), { status: 404 });
  }

  if (existing.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  return { success: true };
}
