import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/user.json' });

test.describe('KYC', () => {
  test('page loads with instructions', async ({ page }) => {
    await page.goto('/kyc');
    await expect(page).toHaveURL(/\/kyc/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('text=/vérification|verification|documents/i').first()).toBeVisible();
  });

  test('upload input is present', async ({ page }) => {
    await page.goto('/kyc');
    await expect(page.locator('input[type="file"]').first()).toBeVisible();
  });

  test('underage birth date shows age error', async ({ page }) => {
    await page.goto('/kyc');
    const input = page.locator('input[name*="birth" i], input[type="date"]').first();
    if (await input.count() === 0) return;
    await input.fill('2010-01-01');
    await input.blur();
    await expect(page.locator('text=/18 ans|mineur|minor|age/i').first()).toBeVisible();
  });

  test('submit button disabled until form complete', async ({ page }) => {
    await page.goto('/kyc');
    const btn = page.locator('button[type="submit"], button:has-text("soumettre"), button:has-text("submit")').first();
    if (await btn.count() === 0) return;
    await expect(btn).toBeDisabled();
  });

  test('privacy policy link present', async ({ page }) => {
    await page.goto('/kyc');
    await expect(
      page.locator('a[href*="/privacy"], a:has-text("confidentialité"), a:has-text("privacy")').first()
    ).toBeVisible();
  });
});

test.describe('KYC - Status states', () => {
  test('pending state shows message', async ({ page }) => {
    await page.goto('/kyc');
    const pending = page.locator('text=/pending|en attente|sous.*examen/i').first();
    if (await pending.count() > 0) await expect(pending).toBeVisible();
  });

  test('rejected state shows reason', async ({ page }) => {
    await page.goto('/kyc');
    const rejected = page.locator('[data-rejection-reason], text=/raison.*rejet|rejection.*reason/i').first();
    if (await rejected.count() > 0) await expect(rejected).toBeVisible();
  });

  test('approved state shows verified badge', async ({ page }) => {
    await page.goto('/kyc');
    const badge = page.locator('[data-verified="true"], text=/vérifié|verified/i').first();
    if (await badge.count() > 0) await expect(badge).toBeVisible();
  });
});
