import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('page loads under 5s', async ({ page }) => {
    const t = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - t).toBeLessThan(5000);
  });

  test('header and footer present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header, nav').first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('footer')).toBeVisible();
  });

  test('at least one link on homepage', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('a[href]').count()).toBeGreaterThan(0);
  });

  test('meta tags present', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('meta[name], meta[property]').count()).toBeGreaterThan(0);
  });

  test('no uncaught JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('Extension'));
    expect(critical).toHaveLength(0);
  });

  for (const { path, name } of [
    { path: '/', name: 'Home' },
    { path: '/terms', name: 'Terms' },
    { path: '/privacy', name: 'Privacy' },
  ]) {
    test(`${name} returns 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }

  test('404 page handled', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyz123');
    expect([200, 404]).toContain(res?.status());
    await expect(page.locator('body')).toBeVisible();
  });

  test('GET /api/test/auth is removed', async ({ request }) => {
    const res = await request.get('/api/test/auth?role=admin');
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/test/auth is removed', async ({ request }) => {
    const res = await request.delete('/api/test/auth');
    expect(res.status()).toBe(404);
  });
});
