import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { transactions } from './transactions';

export const categories = pgTable('categories', {
  id: varchar('id').primaryKey(), // e.g., 'food', 'transport'
  label: varchar('label', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // hex color
  icon: varchar('icon', { length: 50 }), // emoji or icon name
  type: varchar('type', { length: 10 }).notNull(), // 'income' | 'expense' | 'both'
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
