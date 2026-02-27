import { pgTable, uuid, varchar, decimal, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  categoryId: varchar('category_id').notNull().references(() => categories.id),
  limitAmount: decimal('limit_amount', { precision: 15, scale: 2 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // 'YYYY-MM'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
