import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import type { MockedFunction } from 'vitest';

/**
 * Create a test client for Hono routes
 */
export function createRouteTester<T extends Hono>(app: T) {
  return testClient(app);
}

/**
 * Mock database queries
 */
export function mockDbQuery(returnValue: unknown) {
  return vi.fn().mockResolvedValue(returnValue);
}

/**
 * Mock authenticated user context
 */
export function createMockUser(overrides?: Partial<{ id: string; email: string; name: string }>) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Mock session data
 */
export function createMockSession(overrides?: Partial<{ id: string; userId: string }>) {
  return {
    id: 'session-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock transaction data
 */
export function createMockTransaction(overrides?: Partial<{
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: string;
  categoryId: string;
  description: string;
  date: Date;
}>) {
  return {
    id: 'txn-123',
    userId: 'user-123',
    type: 'expense' as const,
    amount: '50.00',
    categoryId: 'food',
    description: 'Grocery shopping',
    date: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock category data
 */
export function createMockCategory(overrides?: Partial<{
  id: string;
  label: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
}>) {
  return {
    id: 'food',
    label: 'Food & Dining',
    color: '#FF5722',
    icon: '🍔',
    type: 'expense' as const,
    ...overrides,
  };
}

/**
 * Type helper for mocked modules
 */
export type MockedModule<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? MockedFunction<(...args: A) => R>
    : T[K];
};
