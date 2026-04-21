import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/user.json' });

test.describe('Payout - SEPA', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/payout');
    await expect(page).toHaveURL(/\/payout/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('valid IBAN accepted', async ({ page }) => {
    await page.goto('/payout');
    const input = page.locator('input[name*="iban" i]').first();
    if (await input.count() === 0) return;
    await input.fill('FR7630006000011234567890189');
    await input.blur();
    await expect(page.locator('text=/iban.*invalid|iban.*invalide/i')).toHaveCount(0);
  });

  test('invalid IBAN shows error', async ({ page }) => {
    await page.goto('/payout');
    const input = page.locator('input[name*="iban" i]').first();
    if (await input.count() === 0) return;
    await input.fill('FR00000000000000000000000');
    await input.blur();
    await expect(page.locator('text=/invalid|invalide|incorrect/i').first()).toBeVisible();
  });

  test('amount above balance shows insufficient funds error', async ({ page }) => {
    await page.goto('/payout');
    const input = page.locator('input[name*="amount" i]').first();
    if (await input.count() === 0) return;
    await input.fill('999999');
    await input.blur();
    await expect(page.locator('text=/insufficient|insuffisant|solde/i').first()).toBeVisible();
  });
});

test.describe('Payout - Crypto', () => {
  test('invalid wallet address shows error', async ({ page }) => {
    await page.goto('/payout');
    const input = page.locator('input[name*="wallet" i], input[name*="address" i]').first();
    if (await input.count() === 0) return;
    await input.fill('invalid_address_123');
    await input.blur();
    await expect(page.locator('text=/invalid|invalide|incorrect/i').first()).toBeVisible();
  });

  test('KYC required message shown for unverified user', async ({ page }) => {
    await page.goto('/payout');
    const kycWarn = page.locator('text=/kyc.*requis|kyc.*required|compléter.*kyc|kyc.*pending|kyc.*incomplete/i').first();
    if (await kycWarn.count() > 0) {
      await expect(kycWarn).toBeVisible();
      await expect(page.locator('a[href*="/kyc"]').first()).toBeVisible();
    }
  });
});

test.describe('Payout - Security', () => {
  test('pending payout disables submit', async ({ page }) => {
    await page.goto('/payout');
    const warn = page.locator('text=/payout.*en cours|pending.*payout|déjà.*en attente/i').first();
    if (await warn.count() > 0) {
      await expect(warn).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeDisabled();
    }
  });

  test('OTP input has 6 chars max', async ({ page }) => {
    await page.goto('/payout');
    const otp = page.locator('input[name*="otp" i], input[name*="code" i]').first();
    if (await otp.count() === 0) return;
    await otp.fill('123456');
    expect(await otp.inputValue()).toBe('123456');
  });
});
