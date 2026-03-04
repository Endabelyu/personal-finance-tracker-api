import { test, expect } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

test.use({ storageState: 'tests/setup/.auth/user.json' });

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=/Akun|Account/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to Edit Profil page', async ({ page }) => {
    await page.click('text=Edit Profil');
    await expect(page).toHaveURL(/.*\/profile\/edit/);
    await expect(page.locator('input[name="name"], input[type="text"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should update display name', async ({ page }) => {
    await page.click('text=Edit Profil');
    await expect(page).toHaveURL(/.*\/profile\/edit/);

    const nameInput = page.locator('input[name="name"], input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('E2E Test Name', { force: true });

    await page.click('button[type="submit"]', { force: true });

    // Success: redirected back or shows saved
    await expect(page.locator('text=Tersimpan!, text=Berhasil').or(page.locator('text=E2E Test Name')).filter({ visible: true }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('should navigate to Keamanan (Security) page', async ({ page }) => {
    await page.click('text=Keamanan');
    await expect(page).toHaveURL(/.*\/profile\/security/);
    await expect(page.locator('input[id="currentPassword"]')).toBeVisible();
    await expect(page.locator('input[id="newPassword"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

  test('should show validation errors for invalid password change', async ({ page }) => {
    await page.click('text=Keamanan');
    await expect(page).toHaveURL(/.*\/profile\/security/);

    // Wait for form
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    // Submit with empty fields
    await submitBtn.click({ force: true });
    await expect(page.locator('text=Masukkan kata sandi saat ini')).toBeVisible();

    // New password too short
    await page.fill('#currentPassword', 'tes-naswa');
    await page.fill('#newPassword', 'short');
    await page.fill('#confirmPassword', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=minimal 8 karakter')).toBeVisible();

    // Passwords don't match
    await page.fill('#currentPassword', 'password123');
    await page.fill('#newPassword', 'newpassword123');
    await page.fill('#confirmPassword', 'differentpass');
    await page.click('button[type="submit"]', { force: true });
    await expect(page.locator('text=tidak cocok')).toBeVisible();
  });

  test('should trigger CSV export download', async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    
    await page.click('text=Ekspor Data');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/transactions.*\.csv/);
  });
});
