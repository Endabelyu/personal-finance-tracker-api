import { test, expect } from '@playwright/test';
import path from 'path';

test.use({ storageState: 'tests/setup/.auth/user.json' });

test.describe('Transactions', () => {
  // Go to transactions page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.locator('h1:has-text("Transactions"), h1:has-text("Transaksi")').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should add an income transaction', async ({ page }) => {
    // Click the Add Transaction button to open the modal
    await page.locator('button:has-text("Add Transaction"), button:has-text("Tambah Transaksi")').first().click();

    // Wait for the modal label or modal content
    await expect(page.locator('text=/Add Transaction|Tambah Transaksi/i').first()).toBeVisible({ timeout: 5000 });

    // Select Income type
    await page.locator('button:has-text("Income")').click();

    // Fill amount
    await page.fill('input[name="amount"]', '5000000');

    // Select a category (first income category)
    const categorySelect = page.locator('select[name="categoryId"]');
    await expect(categorySelect.locator('option').nth(1)).toHaveText(/.+/);
    await categorySelect.selectOption({ index: 1 });

    // Set date
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);

    // Add description
    await page.fill('input[name="description"], textarea[name="description"]', 'Gaji Maret 2026');

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Modal closes and transaction appears in list
    await expect(page.locator('text=Gaji Maret 2026')).toBeVisible({ timeout: 10_000 });
  });

  test('should add an expense transaction', async ({ page }) => {
    // Open add modal by clicking the button
    await page.locator('button:has-text("Add Transaction"), button:has-text("Tambah Transaksi")').first().click();

    await expect(page.locator('text=/Add Transaction|Tambah Transaksi/i').first()).toBeVisible({ timeout: 5_000 });

    // Expense is default type
    await page.locator('button:has-text("Expense")').first().click();

    await page.fill('input[name="amount"]', '150000');
    const categorySelect = page.locator('select[name="categoryId"]');
    await expect(categorySelect.locator('option').nth(1)).toHaveText(/.+/); // Wait until options exist beyond the placeholder
    await categorySelect.selectOption({ index: 1 });
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="description"], textarea[name="description"]', 'Makan siang');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    await expect(page.locator('text=Makan siang')).toBeVisible({ timeout: 10_000 });
  });

  test('should search and filter transactions', async ({ page }) => {
    // Search
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]');
    await searchInput.fill('Gaji');
    await page.waitForTimeout(600); // debounce

    // Income filter
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('income');
    await page.waitForTimeout(400);

    // Should not show expense rows
    await expect(page.locator('text=Makan siang')).toBeHidden();
  });
});
