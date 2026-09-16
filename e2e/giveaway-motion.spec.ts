import { expect, test } from '@playwright/test';
import path from 'node:path';

const OUT_DIR = path.join('docs', 'giveaway-motion');

test.describe('Giveaway motion captures', () => {
  test.use({
    video: { mode: 'on', size: { width: 1440, height: 900 } },
  });

  test('responsive screenshots, hover, carousel and entry burst', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/giveaways/motion-preview');
    const featured = page.locator('.giveaway-showcase-card--featured').first();
    await expect(featured).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(700);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-1440.png'), fullPage: true });

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-1024.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-390.png'), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await featured.scrollIntoViewIfNeeded();
    const box = await featured.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 80, box.y + 90);
      await page.waitForTimeout(250);
      await page.mouse.move(box.x + box.width - 70, box.y + 130);
      await page.waitForTimeout(450);
    }
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-hover.png') });

    const next = page.getByRole('button', { name: /giveaway suivant|next giveaway|下一个/i });
    await next.first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-carousel.png') });

    const participate = page.getByRole('button', { name: /participer|enter ·|参与/i }).first();
    await participate.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /participer|enter ·|参与/i }).first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT_DIR, 'giveaways-entry-success.png') });
  });
});
