import { test, expect } from '@playwright/test';
import path from 'path';

test.use({ storageState: 'tests/setup/.auth/user.json' });

// Map theme button labels to CSS class that gets applied to <html>
const THEMES: Array<{ label: string; cssClass: string }> = [
  { label: 'Deep Purple', cssClass: 'theme-deep-purple' },
  { label: 'Midnight Blue', cssClass: 'theme-midnight-blue' },
  { label: 'Warm Charcoal', cssClass: 'theme-warm-charcoal' },
  { label: 'Fresh Mint', cssClass: 'theme-fresh-mint' },
  { label: 'Candy Pop', cssClass: 'theme-candy-pop' },
  { label: 'Sunny Yellow', cssClass: 'theme-sunny-yellow' },
];

test.describe('Settings — Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1:has-text("Settings"), h1:has-text("Pengaturan")').first()).toBeVisible({ timeout: 10_000 });
  });

  for (const { label, cssClass } of THEMES) {
    test(`should apply "${label}" theme`, async ({ page }) => {
      // Wait for hydration
      await page.waitForTimeout(500);
      
      // Click the theme button
      await page.click(`button:has-text("${label}")`);
      await page.waitForTimeout(300);

      // Verify the HTML element has the correct class
      const htmlClass = await page.evaluate(() => document.documentElement.className);
      expect(htmlClass).toContain(cssClass);
    });
  }

  test('theme persists after page reload', async ({ page }) => {
    // Wait for hydration
    await page.waitForTimeout(500);

    // Apply Deep Purple
    await page.click('button:has-text("Deep Purple")');
    // Wait until the HTML element has the class before reloading
    await expect(page.locator('html')).toHaveClass(/theme-deep-purple/);

    // Reload
    await page.reload();
    await page.waitForTimeout(500);

    // Should still have Deep Purple
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('theme-deep-purple');
  });

  test('dark themes should have dark background variable', async ({ page }) => {
    await page.click('button:has-text("Midnight Blue")');
    await page.waitForTimeout(300);

    const bgStart = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--app-bg-start').trim()
    );
    // Midnight Blue bg-start is #0f172a (slate-900) — a dark color
    expect(bgStart).toBeTruthy();
    expect(bgStart).not.toMatch(/^#f|^#e|^#d/i); // should not start with light hex codes
  });
});
