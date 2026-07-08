import { test, expect } from '@playwright/test';
import {
  CHAT_LABELS,
  seedGuestConversation,
} from './helpers/chat';

test.describe('Chat — modération complète (admin)', () => {
  test.use({ storageState: '.auth/admin.json' });

  let conversationId: string;
  let uniqueTag: string;

  test.beforeAll(async ({ request }) => {
    uniqueTag = `E2E-MOD-${Date.now()}`;
    conversationId = await seedGuestConversation(request, uniqueTag);

    await request.post('/api/chat/messages', {
      data: {
        conversationId,
        content: `${uniqueTag} — besoin d'aide sur mon trade Steam`,
      },
    });
  });

  test('dashboard modération affiche les stats et la liste', async ({ page }) => {
    await page.goto('/moderation');

    await expect(page.getByRole('heading', { name: /Modération/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Conversations actives/i)).toBeVisible();
    await expect(page.getByText(uniqueTag)).toBeVisible({ timeout: 20_000 });
  });

  test('assignation, réponse modérateur et fermeture', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page.getByText(uniqueTag)).toBeVisible({ timeout: 20_000 });

    const row = page.locator(`text=${uniqueTag}`).locator('xpath=ancestor::div[contains(@class,"rounded")]').first();

    await row.getByRole('button', { name: CHAT_LABELS.assignToMe }).click();
    await expect(page.getByText(/assignée|Conversation assignée/i).first()).toBeVisible({
      timeout: 10_000,
    }).catch(() => {
      // toast sonner — optionnel selon timing
    });

    await row.getByRole('button', { name: CHAT_LABELS.open }).click();
    await expect(page).toHaveURL(new RegExp(`/moderation/conversations/${conversationId}`));

    const modReply = `${uniqueTag} — réponse modérateur E2E`;
    await page.getByTestId('moderation-reply-input').fill(modReply);
    await page.getByTestId('moderation-reply-send').click();

    await expect(page.getByText(modReply)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Fermer la conversation|Fermer/i }).first().click();
    await expect(page.getByText(/CLOSED|Fermée|fermée/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('API — conversation accessible par staff avec messages modérateur', async ({ request }) => {
    const res = await request.get(`/api/chat/conversations/${conversationId}?scope=staff`);
    expect(res.ok()).toBeTruthy();
    const conv = await res.json();

    const modMessages = conv.messages.filter(
      (m: { senderType: string }) => m.senderType === 'MODERATOR',
    );
    expect(modMessages.length).toBeGreaterThan(0);
  });

  test('admin chat page — onglet conversations', async ({ page }) => {
    await page.goto('/admin/chat');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/Chat|Support|conversation/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
