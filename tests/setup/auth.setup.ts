/**
 * Auth Setup — runs once before all tests.
 * Logs in as the E2E test user and saves session state to disk.
 * All spec files reference this stored state to avoid repeated logins.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = 'tests/setup/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');

  await page.fill('input[name="email"]', 'testuser1@gmail.com');
  await page.fill('input[name="password"]', 'tes-naswa');
  await page.click('button[type="submit"]');

  // Wait for successful redirect to dashboard
  await expect(page).toHaveURL('/', { timeout: 15_000 });

  // Disable walkthrough by setting localStorage state
  await page.evaluate(() => {
    localStorage.setItem('finance-tracker-walkthrough', JSON.stringify({
      isCompleted: true,
      isSkipped: true,
      lastVisit: new Date().toISOString()
    }));
  });

  // Save authenticated state
  await page.context().storageState({ path: AUTH_FILE });
});
