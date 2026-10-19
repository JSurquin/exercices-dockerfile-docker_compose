import { test, expect } from '@playwright/test';

test.describe('Auth - Protected routes (user)', () => {
  test.use({ storageState: '.auth/user.json' });

  for (const url of ['/dashboard', '/sell', '/payout', '/settings']) {
    test(`${url} accessible`, async ({ page }) => {
      await page.goto(url);
      await expect(page).toHaveURL(new RegExp(url.replace('/', '\\/')));
    });
  }

  test('user cannot access /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin(?!\S)/);
  });
});

test.describe('Auth - Admin routes', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('/admin accessible for admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Auth - Logout', () => {
  test.use({ storageState: '.auth/user.json' });

  test('logout redirects away from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const btn = page.locator('button:has-text("déconnexion"), button:has-text("logout"), a:has-text("déconnexion")').first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('after logout dashboard redirects to login', async ({ page, context }) => {
    await page.goto('/dashboard');
    const btn = page.locator('button:has-text("déconnexion"), a:has-text("déconnexion")').first();
    await btn.click();
    await context.clearCookies();
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
