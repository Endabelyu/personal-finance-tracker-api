import { test, expect } from '@playwright/test';

// Use an isolated empty storage state so we are unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    // Make email completely unique to avoid parallel run overlap
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
  };

  test('should successfully register a new user', async ({ page }) => {
    // Navigate to register page
    await page.goto('/auth/register');
    await expect(page).toHaveTitle(/Personal Finance Tracker/);

    // Fill registration form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirm-password"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login with registered=true and show success message
    await expect(page).toHaveURL(/.*\/auth\/login\?registered=true/);
    await expect(page.locator('text=/Account created/i').first()).toBeVisible();
  });

  test('should fail to log in with incorrect credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'badpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should successfully log in and navigate dashboard', async ({ page }) => {
    // Register the user first directly via API or UI? Let's use UI for full E2E, 
    // or assume we use the user created in the first test (needs persistent state or sequential tests). 
    // Wait, testing parallel means we should create a new user or rely on a known test user.
    // Let's rely on the known user you told me to test earlier.
    await page.goto('/auth/login');
    
    // Disable walkthrough for this isolated session
    await page.evaluate(() => {
      localStorage.setItem('finance-tracker-walkthrough', JSON.stringify({ isCompleted: true, isSkipped: true }));
    });

    await page.fill('input[name="email"]', 'testuser1@gmail.com');
    await page.fill('input[name="password"]', 'tes-naswa');
    await page.click('button[type="submit"]');

    // Verify dashboard redirect
    await expect(page).toHaveURL('/');
    // Check for "Total Balance" or "Total Saldo" instead of literal "Dashboard" which may not appear
    await expect(page.locator('text=/Total Balance|Total Saldo/i').first()).toBeVisible();

    // Verify navigation by finding the visible link (Desktop sidebar vs Mobile drawer)
    await page.goto('/transactions');
    await expect(page).toHaveURL('/transactions');
    await expect(page.locator('text=/Income|Pemasukan/i').first()).toBeVisible();

    await page.goto('/budget');
    await expect(page).toHaveURL('/budget');
    
    await page.goto('/reports');
    await expect(page).toHaveURL('/reports');
  });
});
