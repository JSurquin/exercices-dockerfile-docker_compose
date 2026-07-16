import type { APIRequestContext, Page } from '@playwright/test';

export const CHAT_LABELS = {
  support: 'Moony',
  tradeCategory: 'Problème de trade',
  paymentCategory: 'Paiement',
  supportCategory: 'Support général',
  tradeBlocked: 'Trade bloqué',
  supportOther: 'Autre demande',
  placeholder: 'Tapez votre message...',
  moderatorReply: 'Tapez votre réponse...',
  assignToMe: "S'assigner",
  close: 'Fermer',
  open: 'Ouvrir',
  botLabel: 'Bot',
  ticketTransmitted: 'transmise à notre équipe',
} as const;

export async function openChatWidget(page: Page) {
  const fab = page.getByTestId('chat-fab');
  await fab.waitFor({ state: 'visible', timeout: 15_000 });
  await fab.click();
  await page.getByTestId('chat-popup').waitFor({ state: 'visible' });
}

export async function seedGuestConversation(
  request: APIRequestContext,
  tag: string,
): Promise<string> {
  const createRes = await request.post('/api/chat/conversations', {
    data: {
      initialMessage: `${tag} — message initial`,
      subject: 'E2E Support',
      category: 'support',
    },
  });

  if (!createRes.ok()) {
    throw new Error(`Création conversation échouée: ${createRes.status()}`);
  }

  const conversation = await createRes.json();

  const botRes = await request.post(
    `/api/chat/conversations/${conversation.id}/bot-message`,
    { data: { subcategoryKey: 'support.other' } },
  );

  if (!botRes.ok()) {
    throw new Error(`Message bot échoué: ${botRes.status()}`);
  }

  return conversation.id as string;
}

export async function sendWidgetMessage(page: Page, content: string) {
  const input = page.getByTestId('chat-message-input');
  await input.fill(content);
  await page.getByTestId('chat-send-button').click();
}
