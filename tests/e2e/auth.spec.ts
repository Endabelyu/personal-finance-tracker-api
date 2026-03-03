import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  test('should successfully register a new user', async ({ page }) => {
    // Navigate to register page
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Fill registration form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard and show welcome toast
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Total Balance')).toBeVisible();
  });

  test('should fail to log in with incorrect credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'badpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should successfully log in and navigate dashboard', async ({ page }) => {
    // Register the user first directly via API or UI? Let's use UI for full E2E, 
    // or assume we use the user created in the first test (needs persistent state or sequential tests). 
    // Wait, testing parallel means we should create a new user or rely on a known test user.
    // Let's rely on the known user you told me to test earlier.
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'testuser1@gmail.com');
    await page.fill('input[name="password"]', 'tes-naswa');
    await page.click('button[type="submit"]');

    // Verify dashboard redirect
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).first().toBeVisible();

    // Verify navigation
    await page.click('text=Transactions');
    await expect(page).toHaveURL('/transactions');
    await expect(page.locator('text=Income').first()).toBeVisible();

    await page.click('text=Budget');
    await expect(page).toHaveURL('/budget');
    
    await page.click('text=Reports');
    await expect(page).toHaveURL('/reports');
  });
});
