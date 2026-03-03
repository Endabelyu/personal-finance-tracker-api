/**
 * Global E2E Setup & Teardown
 * Clears all transactions and budgets for the E2E test user before each run.
 * Categories and user account are left intact.
 */
import { db, client } from '../../server/lib/db';
import { transactions, budgets, users, session as sessionTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

const E2E_USER_EMAIL = 'testuser1@gmail.com';

async function cleanE2EUserData() {
  console.log('\n🧹 [global-setup] Clearing E2E test user data...');

  // Find the test user by email
  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, E2E_USER_EMAIL),
  });

  if (!userRecord) {
    console.log('⚠️  [global-setup] E2E test user not found — skipping cleanup.');
    return;
  }

  const userId = userRecord.id;

  // Delete user-specific data
  const [deletedTx, deletedBudgets] = await Promise.all([
    db.delete(transactions).where(eq(transactions.userId, userId)).returning({ id: transactions.id }),
    db.delete(budgets).where(eq(budgets.userId, userId)).returning({ id: budgets.id }),
  ]);

  // Ensure income/expense categories exist so tests work smoothly
  const { categories } = await import('../../db/schema');
  await db.insert(categories).values([
    { id: 'food', label: 'Food & Dining', color: '#EF4444', icon: '🍔', type: 'expense' },
    { id: 'salary', label: 'Salary', color: '#10B981', icon: '💰', type: 'income' }
  ]).onConflictDoNothing();

  console.log(`✅ [global-setup] Deleted ${deletedTx.length} transactions, ${deletedBudgets.length} budgets for ${E2E_USER_EMAIL}`);
}

export default async function globalSetup() {
  try {
    await cleanE2EUserData();
  } finally {
    await client.end();
  }
}
