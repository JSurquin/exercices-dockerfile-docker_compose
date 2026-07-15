import { test, expect } from '@playwright/test';
import {
  CHAT_LABELS,
  openChatWidget,
  sendWidgetMessage,
} from './helpers/chat';

test.describe('Chat widget — invité (page d\'accueil)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('guest_conversation_id'));
  });

  test('FAB ouvre le popup support avec le header', async ({ page }) => {
    await openChatWidget(page);

    await expect(page.getByTestId('chat-popup')).toBeVisible();
    await expect(page.getByText(CHAT_LABELS.support)).toBeVisible();
    await expect(page.getByText(/En ligne/i)).toBeVisible();
  });

  test('parcours catégories → sous-catégories → conversation', async ({ page }) => {
    await openChatWidget(page);

    await page.getByRole('button', { name: CHAT_LABELS.tradeCategory }).click();
    await expect(page.getByRole('button', { name: CHAT_LABELS.tradeBlocked })).toBeVisible();

    await page.getByRole('button', { name: CHAT_LABELS.tradeBlocked }).click();

    const messages = page.getByTestId('chat-messages');
    await expect(messages).toBeVisible({ timeout: 20_000 });
    await expect(messages.getByText(CHAT_LABELS.support)).toBeVisible({ timeout: 20_000 });
    await expect(messages.locator('text=/Steam Guard|Moonskin/i').first()).toBeVisible();
  });

  test('envoi message user + message système ticket transmis', async ({ page }) => {
    await openChatWidget(page);

    await page.getByRole('button', { name: CHAT_LABELS.supportCategory }).click();
    await page.getByRole('button', { name: CHAT_LABELS.supportOther }).click();

    await expect(page.getByTestId('chat-messages')).toBeVisible({ timeout: 20_000 });

    const userMsg = `E2E guest ${Date.now()} — mon trade Steam est bloqué`;
    await sendWidgetMessage(page, userMsg);

    const messages = page.getByTestId('chat-messages');
    await expect(messages.getByText(userMsg)).toBeVisible({ timeout: 15_000 });
    await expect(messages.getByText(new RegExp(CHAT_LABELS.ticketTransmitted, 'i'))).toBeVisible({
      timeout: 15_000,
    });
  });

  test('persiste guest_conversation_id en localStorage', async ({ page }) => {
    await openChatWidget(page);
    await page.getByRole('button', { name: CHAT_LABELS.paymentCategory }).click();
    await page.getByRole('button', { name: /Paiement crypto/i }).click();

    await expect(page.getByTestId('chat-messages')).toBeVisible({ timeout: 20_000 });

    const convId = await page.evaluate(() => localStorage.getItem('guest_conversation_id'));
    expect(convId).toBeTruthy();
    expect(convId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('design — bulles avec noms expéditeur au-dessus', async ({ page }) => {
    await openChatWidget(page);
    await page.getByRole('button', { name: CHAT_LABELS.supportCategory }).click();
    await page.getByRole('button', { name: CHAT_LABELS.supportOther }).click();

    await expect(page.getByTestId('chat-messages')).toBeVisible({ timeout: 20_000 });

    const supportLabel = page.getByText(CHAT_LABELS.support).first();
    await expect(supportLabel).toBeVisible();
    await expect(supportLabel).toHaveClass(/text-theme-highlight/);
  });

  test('API health IA signale disabled sans CHAT_AI_ENABLED', async ({ request }) => {
    const res = await request.get('/api/chat/ai/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });
});
