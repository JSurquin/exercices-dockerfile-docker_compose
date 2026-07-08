import {
  assignConversationPostSchema,
  botSubcategoryPostSchema,
  chatConversationsQuerySchema,
  createChatMessageSchema,
  createConversationPostSchema,
  patchConversationSchema,
} from '@/lib/validation/schemas/chat-api';

describe('createConversationPostSchema', () => {
  it('exige initialMessage', () => {
    expect(createConversationPostSchema.safeParse({}).success).toBe(false);
    expect(
      createConversationPostSchema.safeParse({ initialMessage: 'Bonjour' }).success,
    ).toBe(true);
  });

  it('accepte priority optionnelle', () => {
    const parsed = createConversationPostSchema.safeParse({
      initialMessage: 'Help',
      priority: 'URGENT',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('createChatMessageSchema', () => {
  it('refuse senderType AI côté client', () => {
    expect(
      createChatMessageSchema.safeParse({
        conversationId: 'c1',
        content: 'hi',
        senderType: 'AI',
      }).success,
    ).toBe(false);
  });

  it('refuse contenu whitespace-only après trim', () => {
    expect(
      createChatMessageSchema.safeParse({
        conversationId: 'c1',
        content: '   ',
      }).success,
    ).toBe(false);
  });

  it('accepte USER/BOT/MODERATOR/SYSTEM', () => {
    for (const senderType of ['USER', 'BOT', 'MODERATOR', 'SYSTEM'] as const) {
      expect(
        createChatMessageSchema.safeParse({
          conversationId: 'c1',
          content: 'x',
          senderType,
        }).success,
      ).toBe(true);
    }
  });
});

describe('patchConversationSchema', () => {
  it('valide les transitions de statut', () => {
    for (const status of ['ACTIVE', 'CLOSED', 'ARCHIVED'] as const) {
      expect(patchConversationSchema.safeParse({ status }).success).toBe(true);
    }
  });
});

describe('assignConversationPostSchema', () => {
  it('exige moderatorId', () => {
    expect(assignConversationPostSchema.safeParse({}).success).toBe(false);
    expect(
      assignConversationPostSchema.safeParse({ moderatorId: 'mod-1' }).success,
    ).toBe(true);
  });
});

describe('botSubcategoryPostSchema', () => {
  it('exige subcategoryKey non vide', () => {
    expect(botSubcategoryPostSchema.safeParse({}).success).toBe(false);
    expect(
      botSubcategoryPostSchema.safeParse({ subcategoryKey: 'trade.pending' }).success,
    ).toBe(true);
  });
});

describe('chatConversationsQuerySchema', () => {
  it('parse page/limit avec défauts', () => {
    const parsed = chatConversationsQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(20);
    }
  });

  it('refuse limit > 100', () => {
    expect(
      chatConversationsQuerySchema.safeParse({ limit: '500' }).success,
    ).toBe(false);
  });
});
