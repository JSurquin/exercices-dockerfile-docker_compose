import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/user.json' });

test.describe('Sell workflow', () => {
  test('page loads and trade link input is present', async ({ page }) => {
    await page.goto('/sell');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('input[name*="trade" i], input[placeholder*="trade" i]').first()).toBeVisible();
  });

  test('invalid trade link shows error', async ({ page }) => {
    await page.goto('/sell');
    const input = page.locator('input[name*="trade" i]').first();
    await input.fill('https://invalid-link.com');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.locator('text=/invalid|invalide|erreur|error/i').first()).toBeVisible();
  });

  test('empty form submit shows required error', async ({ page }) => {
    await page.goto('/sell');
    const btn = page.locator('button[type="submit"]').first();
    if (await btn.isEnabled()) {
      await btn.click();
      await expect(page.locator('text=/requis|required|obligatoire/i').first()).toBeVisible();
    } else {
      await expect(btn).toBeDisabled();
    }
  });

  test('valid trade link enables submit', async ({ page }) => {
    await page.goto('/sell');
    const input = page.locator('input[name*="trade" i]').first();
    await input.fill('https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=ABCDEFGH');
    await expect(page.locator('button[type="submit"]').first()).toBeEnabled();
  });

  test('sell confirmation modal appears', async ({ page }) => {
    await page.goto('/sell');
    const confirm = page.locator('button:has-text("confirmer"), button:has-text("confirm")').first();
    if (await confirm.count() > 0) {
      await confirm.click();
      await expect(page.locator('[role="dialog"], .modal').first()).toBeVisible();
    }
  });
});

test.describe('Sell - dashboard trade tracking', () => {
  test('dashboard loads for logged-in user', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('main')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
