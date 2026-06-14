import {
  assignConversationPostSchema,
  botSubcategoryPostSchema,
  chatConversationsQuerySchema,
  conversationMessagesQuerySchema,
  createChatMessageSchema,
  createConversationPostSchema,
  patchConversationSchema,
} from '@/lib/validation/schemas/chat-api';

describe('createConversationPostSchema — cas invalides', () => {
  it.each([
    {},
    { initialMessage: '' },
    { priority: 'INVALID' },
    { initialMessage: 'ok', priority: 'SUPER_URGENT' },
  ])('rejette %j', (payload) => {
    expect(createConversationPostSchema.safeParse(payload).success).toBe(false);
  });

  it.each([
    { initialMessage: 'Bonjour' },
    { initialMessage: 'Help', category: 'trade' },
    { initialMessage: 'Urgent', subject: 'Trade bloqué', priority: 'URGENT' },
    { initialMessage: 'x', priority: 'LOW' },
    { initialMessage: 'x', priority: 'NORMAL' },
    { initialMessage: 'x', priority: 'HIGH' },
  ])('accepte %j', (payload) => {
    expect(createConversationPostSchema.safeParse(payload).success).toBe(true);
  });
});

describe('createChatMessageSchema — cas invalides', () => {
  it.each([
    { conversationId: '', content: 'hi' },
    { conversationId: 'c1', content: '' },
    { conversationId: 'c1', content: 'hi', senderType: 'AI' },
    { conversationId: 'c1', content: 'hi', category: 'x'.repeat(65) },
  ])('rejette %j', (payload) => {
    expect(createChatMessageSchema.safeParse(payload).success).toBe(false);
  });

  it.each([
    { conversationId: 'c1', content: 'hello' },
    { content: 'hello', forceNew: true },
    { conversationId: 'c1', content: 'hello', senderType: 'USER' },
    { conversationId: 'c1', content: 'hello', senderType: 'BOT' },
    { conversationId: 'c1', content: 'hello', senderType: 'MODERATOR' },
    { conversationId: 'c1', content: 'hello', senderType: 'SYSTEM' },
    { conversationId: 'c1', content: 'hello', category: 'trade' },
  ])('accepte %j', (payload) => {
    expect(createChatMessageSchema.safeParse(payload).success).toBe(true);
  });
});

describe('patchConversationSchema', () => {
  it.each(['ACTIVE', 'CLOSED', 'ARCHIVED', 'DELETED'] as const)(
    'accepte status=%s',
    (status) => {
      expect(patchConversationSchema.safeParse({ status }).success).toBe(true);
    },
  );

  it.each([
    { status: 'OPEN' },
    { status: 'ACTIVE', subject: 'x'.repeat(201) },
  ])('rejette %j', (payload) => {
    expect(patchConversationSchema.safeParse(payload).success).toBe(false);
  });

  it('accepte subject optionnel valide', () => {
    expect(
      patchConversationSchema.safeParse({ status: 'ACTIVE', subject: 'Trade CS2' }).success,
    ).toBe(true);
  });
});

describe('assignConversationPostSchema', () => {
  it.each([
    {},
    { moderatorId: '' },
  ])('rejette %j', (payload) => {
    expect(assignConversationPostSchema.safeParse(payload).success).toBe(false);
  });

  it.each([
    { moderatorId: 'mod-1' },
    { moderatorId: 'mod-1', conversationId: 'c1' },
  ])('accepte %j', (payload) => {
    expect(assignConversationPostSchema.safeParse(payload).success).toBe(true);
  });
});

describe('botSubcategoryPostSchema', () => {
  it.each([{}, { subcategoryKey: '' }])(
    'rejette %j',
    (payload) => {
      expect(botSubcategoryPostSchema.safeParse(payload).success).toBe(false);
    },
  );

  it.each([
    { subcategoryKey: 'trade.pending' },
    { subcategoryKey: 'support.kyc' },
    { subcategoryKey: 'delay.crypto' },
  ])('accepte %j', (payload) => {
    expect(botSubcategoryPostSchema.safeParse(payload).success).toBe(true);
  });
});

describe('chatConversationsQuerySchema', () => {
  it('parse les défauts page=1 limit=20', () => {
    const parsed = chatConversationsQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(20);
    }
  });

  it.each([
    { page: '2', limit: '50' },
    { status: 'ACTIVE', category: 'trade', priority: 'HIGH' },
    { assignedTo: 'unassigned', search: 'steam' },
    { userId: 'u1', page: '1', limit: '100' },
  ])('accepte %j', (query) => {
    expect(chatConversationsQuerySchema.safeParse(query).success).toBe(true);
  });

  it.each([
    { page: '0' },
    { limit: '0' },
    { limit: '101' },
    { limit: '500' },
    { page: '-1' },
  ])('rejette %j', (query) => {
    expect(chatConversationsQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('conversationMessagesQuerySchema', () => {
  it('utilise limit=30 par défaut', () => {
    const parsed = conversationMessagesQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(30);
    }
  });

  it.each([
    { limit: '1' },
    { limit: '100' },
    { cursor: 'msg-cursor-1' },
    { cursor: 'abc', limit: '10' },
  ])('accepte %j', (query) => {
    expect(conversationMessagesQuerySchema.safeParse(query).success).toBe(true);
  });

  it.each([
    { limit: '0' },
    { limit: '101' },
    { limit: '-5' },
    { cursor: 'x'.repeat(129) },
  ])('rejette %j', (query) => {
    expect(conversationMessagesQuerySchema.safeParse(query).success).toBe(false);
  });

  it('interprète limit vide comme 30', () => {
    const parsed = conversationMessagesQuerySchema.safeParse({ limit: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(30);
    }
  });
});
