import { test, expect } from '@playwright/test';
import {
  CHAT_LABELS,
  openChatWidget,
  sendWidgetMessage,
} from './helpers/chat';

test.describe('Chat widget — utilisateur connecté', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('guest_conversation_id'));
  });

  test('crée une conversation liée au compte', async ({ page, request }) => {
    await openChatWidget(page);

    await page.getByRole('button', { name: CHAT_LABELS.tradeCategory }).click();
    await page.getByRole('button', { name: /Trade en attente/i }).click();

    await expect(page.getByTestId('chat-messages')).toBeVisible({ timeout: 20_000 });

    const tag = `E2E logged-in ${Date.now()}`;
    await sendWidgetMessage(page, `${tag} — question sur mon payout SEPA`);

    await expect(page.getByTestId('chat-messages').getByText(new RegExp(tag))).toBeVisible({
      timeout: 15_000,
    });

    const convId = await page.evaluate(() => localStorage.getItem('guest_conversation_id'));
    expect(convId).toBeTruthy();

    const convRes = await request.get(`/api/chat/conversations/${convId}`);
    expect(convRes.ok()).toBeTruthy();
    const conv = await convRes.json();
    expect(conv.userId).toBeTruthy();
  });

  test('liste les conversations via API (auth requis)', async ({ request, page }) => {
    await page.goto('/dashboard');

    const res = await request.get('/api/chat/conversations');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.conversations).toBeDefined();
    expect(Array.isArray(body.conversations)).toBe(true);
  });
});
