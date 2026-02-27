import { db } from '@server/lib/db';
import { categories, users, transactions, budgets } from './schema';
import { eq } from 'drizzle-orm';

// Default categories for the personal finance tracker
const defaultCategories = [
  // Income categories
  { id: 'salary', label: 'Salary', color: '#22c55e', icon: '💰', type: 'income' },
  { id: 'freelance', label: 'Freelance', color: '#16a34a', icon: '💻', type: 'income' },
  { id: 'investments', label: 'Investments', color: '#15803d', icon: '📈', type: 'income' },
  { id: 'gifts', label: 'Gifts', color: '#86efac', icon: '🎁', type: 'income' },
  { id: 'other-income', label: 'Other Income', color: '#4ade80', icon: '💵', type: 'income' },

  // Expense categories
  { id: 'food', label: 'Food & Dining', color: '#f97316', icon: '🍽️', type: 'expense' },
  { id: 'transport', label: 'Transportation', color: '#3b82f6', icon: '🚗', type: 'expense' },
  { id: 'housing', label: 'Housing & Rent', color: '#8b5cf6', icon: '🏠', type: 'expense' },
  { id: 'utilities', label: 'Utilities', color: '#06b6d4', icon: '💡', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment', color: '#ec4899', icon: '🎬', type: 'expense' },
  { id: 'shopping', label: 'Shopping', color: '#f43f5e', icon: '🛍️', type: 'expense' },
  { id: 'healthcare', label: 'Healthcare', color: '#ef4444', icon: '🏥', type: 'expense' },
  { id: 'education', label: 'Education', color: '#6366f1', icon: '📚', type: 'expense' },
  { id: 'travel', label: 'Travel', color: '#14b8a6', icon: '✈️', type: 'expense' },
  { id: 'other-expense', label: 'Other Expense', color: '#6b7280', icon: '📦', type: 'expense' },
];

// Demo user data
const DEMO_USER_ID = 'demo-user-001';
const demoUser = {
  id: DEMO_USER_ID,
  email: 'demo@personalfinance.app',
  name: 'Demo User',
  emailVerified: true,
  image: null,
};

// Helper to generate a date within the last N days
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Helper to generate a date in a specific month with random day
function randomDateInMonth(year: number, month: number): Date {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, month - 1, day);
}

// Demo transactions - mix of income and expenses over last 3 months
function generateDemoTransactions(userId: string): Array<{
  userId: string;
  type: 'income' | 'expense';
  amount: string;
  categoryId: string;
  description: string;
  date: Date;
}> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const twoMonthsAgo = prevMonth === 1 ? 12 : prevMonth - 1;
  const twoMonthsAgoYear = prevMonth === 1 ? prevYear - 1 : prevYear;

  return [
    // INCOME - Current Month
    {
      userId,
      type: 'income',
      amount: '5500.00',
      categoryId: 'salary',
      description: 'Monthly salary',
      date: randomDateInMonth(currentYear, currentMonth),
    },
    {
      userId,
      type: 'income',
      amount: '850.00',
      categoryId: 'freelance',
      description: 'Website development project',
      date: daysAgo(5),
    },
    {
      userId,
      type: 'income',
      amount: '125.50',
      categoryId: 'investments',
      description: 'Dividend payment',
      date: daysAgo(10),
    },

    // INCOME - Previous Month
    {
      userId,
      type: 'income',
      amount: '5500.00',
      categoryId: 'salary',
      description: 'Monthly salary',
      date: randomDateInMonth(prevYear, prevMonth),
    },
    {
      userId,
      type: 'income',
      amount: '450.00',
      categoryId: 'freelance',
      description: 'Consulting work',
      date: randomDateInMonth(prevYear, prevMonth),
    },
    {
      userId,
      type: 'income',
      amount: '200.00',
      categoryId: 'gifts',
      description: 'Birthday gift from family',
      date: randomDateInMonth(prevYear, prevMonth),
    },

    // INCOME - Two Months Ago
    {
      userId,
      type: 'income',
      amount: '5500.00',
      categoryId: 'salary',
      description: 'Monthly salary',
      date: randomDateInMonth(twoMonthsAgoYear, twoMonthsAgo),
    },
    {
      userId,
      type: 'income',
      amount: '320.00',
      categoryId: 'investments',
      description: 'Stock sale profit',
      date: randomDateInMonth(twoMonthsAgoYear, twoMonthsAgo),
    },

    // EXPENSES - Housing & Utilities
    {
      userId,
      type: 'expense',
      amount: '1200.00',
      categoryId: 'housing',
      description: 'Monthly rent',
      date: randomDateInMonth(currentYear, currentMonth),
    },
    {
      userId,
      type: 'expense',
      amount: '1200.00',
      categoryId: 'housing',
      description: 'Monthly rent',
      date: randomDateInMonth(prevYear, prevMonth),
    },
    {
      userId,
      type: 'expense',
      amount: '1200.00',
      categoryId: 'housing',
      description: 'Monthly rent',
      date: randomDateInMonth(twoMonthsAgoYear, twoMonthsAgo),
    },
    {
      userId,
      type: 'expense',
      amount: '145.00',
      categoryId: 'utilities',
      description: 'Electricity bill',
      date: daysAgo(3),
    },
    {
      userId,
      type: 'expense',
      amount: '65.00',
      categoryId: 'utilities',
      description: 'Internet bill',
      date: daysAgo(7),
    },
    {
      userId,
      type: 'expense',
      amount: '120.00',
      categoryId: 'utilities',
      description: 'Phone bill',
      date: daysAgo(12),
    },

    // EXPENSES - Food & Dining
    {
      userId,
      type: 'expense',
      amount: '85.50',
      categoryId: 'food',
      description: 'Grocery shopping - Walmart',
      date: daysAgo(2),
    },
    {
      userId,
      type: 'expense',
      amount: '45.00',
      categoryId: 'food',
      description: 'Dinner with friends',
      date: daysAgo(4),
    },
    {
      userId,
      type: 'expense',
      amount: '120.75',
      categoryId: 'food',
      description: 'Weekly groceries',
      date: daysAgo(8),
    },
    {
      userId,
      type: 'expense',
      amount: '32.00',
      categoryId: 'food',
      description: 'Lunch at cafe',
      date: daysAgo(15),
    },
    {
      userId,
      type: 'expense',
      amount: '95.00',
      categoryId: 'food',
      description: 'Grocery shopping',
      date: daysAgo(22),
    },

    // EXPENSES - Transportation
    {
      userId,
      type: 'expense',
      amount: '55.00',
      categoryId: 'transport',
      description: 'Gas refill',
      date: daysAgo(6),
    },
    {
      userId,
      type: 'expense',
      amount: '320.00',
      categoryId: 'transport',
      description: 'Car maintenance',
      date: daysAgo(18),
    },
    {
      userId,
      type: 'expense',
      amount: '45.00',
      categoryId: 'transport',
      description: 'Uber rides',
      date: daysAgo(25),
    },

    // EXPENSES - Entertainment & Shopping
    {
      userId,
      type: 'expense',
      amount: '28.00',
      categoryId: 'entertainment',
      description: 'Movie tickets',
      date: daysAgo(9),
    },
    {
      userId,
      type: 'expense',
      amount: '15.00',
      categoryId: 'entertainment',
      description: 'Streaming subscription',
      date: daysAgo(11),
    },
    {
      userId,
      type: 'expense',
      amount: '150.00',
      categoryId: 'shopping',
      description: 'New shoes',
      date: daysAgo(14),
    },
    {
      userId,
      type: 'expense',
      amount: '75.00',
      categoryId: 'shopping',
      description: 'Clothing',
      date: daysAgo(20),
    },

    // EXPENSES - Healthcare & Education
    {
      userId,
      type: 'expense',
      amount: '125.00',
      categoryId: 'healthcare',
      description: 'Doctor visit',
      date: daysAgo(16),
    },
    {
      userId,
      type: 'expense',
      amount: '45.00',
      categoryId: 'healthcare',
      description: 'Pharmacy',
      date: daysAgo(17),
    },
    {
      userId,
      type: 'expense',
      amount: '199.00',
      categoryId: 'education',
      description: 'Online course',
      date: daysAgo(21),
    },

    // EXPENSES - Travel & Other
    {
      userId,
      type: 'expense',
      amount: '450.00',
      categoryId: 'travel',
      description: 'Weekend trip hotel',
      date: daysAgo(30),
    },
    {
      userId,
      type: 'expense',
      amount: '85.00',
      categoryId: 'travel',
      description: 'Flight tickets',
      date: daysAgo(32),
    },
    {
      userId,
      type: 'expense',
      amount: '25.00',
      categoryId: 'other-expense',
      description: 'Miscellaneous supplies',
      date: daysAgo(13),
    },
  ];
}

// Demo budgets for different categories and months
function generateDemoBudgets(userId: string): Array<{
  userId: string;
  categoryId: string;
  limitAmount: string;
  month: string;
}> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  return [
    // Current month budgets
    { userId, categoryId: 'food', limitAmount: '500.00', month: currentMonth },
    { userId, categoryId: 'transport', limitAmount: '300.00', month: currentMonth },
    { userId, categoryId: 'entertainment', limitAmount: '150.00', month: currentMonth },
    { userId, categoryId: 'shopping', limitAmount: '200.00', month: currentMonth },
    { userId, categoryId: 'utilities', limitAmount: '250.00', month: currentMonth },

    // Previous month budgets
    { userId, categoryId: 'food', limitAmount: '500.00', month: prevMonth },
    { userId, categoryId: 'transport', limitAmount: '300.00', month: prevMonth },
    { userId, categoryId: 'entertainment', limitAmount: '150.00', month: prevMonth },
  ];
}

// Seed categories - idempotent (uses onConflictDoNothing)
export async function seedCategories() {
  console.log('Seeding categories...');

  for (const category of defaultCategories) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.id });
  }

  console.log(`Seeded ${defaultCategories.length} categories`);
}

// Seed demo user - idempotent
export async function seedDemoUser() {
  console.log('Seeding demo user...');

  await db
    .insert(users)
    .values(demoUser)
    .onConflictDoNothing({ target: users.id });

  console.log('Seeded demo user');
}

// Seed demo transactions - idempotent (clears existing demo transactions first)
export async function seedDemoTransactions() {
  console.log('Seeding demo transactions...');

  // Clear existing demo transactions to avoid duplicates
  // Clear existing demo transactions to avoid duplicates
  await db.delete(transactions).where(eq(transactions.userId, DEMO_USER_ID));

  const demoTransactions = generateDemoTransactions(DEMO_USER_ID);

  for (const transaction of demoTransactions) {
    await db.insert(transactions).values(transaction);
  }

  console.log(`Seeded ${demoTransactions.length} transactions`);
}

// Seed demo budgets - idempotent (clears existing demo budgets first)
export async function seedDemoBudgets() {
  console.log('Seeding demo budgets...');

  // Clear existing demo budgets to avoid duplicates
  // Clear existing demo budgets to avoid duplicates
  await db.delete(budgets).where(eq(budgets.userId, DEMO_USER_ID));

  const demoBudgets = generateDemoBudgets(DEMO_USER_ID);

  for (const budget of demoBudgets) {
    await db.insert(budgets).values(budget);
  }

  console.log(`Seeded ${demoBudgets.length} budgets`);
}

// Main seed function - runs all seed operations
export async function seedAll() {
  console.log('Starting database seed...\n');

  await seedCategories();
  await seedDemoUser();
  await seedDemoTransactions();
  await seedDemoBudgets();

  console.log('\nDatabase seed completed successfully!');
}

// Run if executed directly
// Run if executed directly (Bun-specific)
if (typeof process !== 'undefined' && process.argv[1]?.includes('seed.ts')) {
  await seedAll();
  process.exit(0);
}
