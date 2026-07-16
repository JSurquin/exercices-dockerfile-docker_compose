import {
  buildSystemPrompt,
  getChatAiQueueHint,
  mapSenderToRole,
  maybeGenerateAiReply,
  stripI18nPlaceholder,
} from '@/lib/chat-ai-service';
import { OFF_TOPIC_REFUSAL_I18N_KEY } from '@/lib/chat-ai-guards';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/ollama', () => ({
  isOllamaConfigured: jest.fn(),
  ollamaChat: jest.fn(),
}));

jest.mock('@/lib/ollama-embed', () => ({
  generateEmbedding: jest.fn(),
}));

jest.mock('@/lib/rag-client', () => ({
  searchSimilarChunks: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import { prisma } from '~/prisma/prisma';
import { isOllamaConfigured, ollamaChat } from '@/lib/ollama';
import { generateEmbedding } from '@/lib/ollama-embed';
import { searchSimilarChunks } from '@/lib/rag-client';

const mockFindUnique = prisma.conversation.findUnique as jest.Mock;
const mockUpdate = prisma.conversation.update as jest.Mock;
const mockCreate = prisma.chatMessage.create as jest.Mock;
const mockFindFirst = prisma.chatMessage.findFirst as jest.Mock;
const mockIsOllamaConfigured = isOllamaConfigured as jest.Mock;
const mockOllamaChat = ollamaChat as jest.Mock;
const mockGenerateEmbedding = generateEmbedding as jest.Mock;
const mockSearchSimilarChunks = searchSimilarChunks as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.CHAT_AI_ENABLED;
  delete process.env.RAG_DATABASE_URL;
  mockIsOllamaConfigured.mockReturnValue(true);
  mockUpdate.mockResolvedValue({});
  mockCreate.mockResolvedValue({ id: 'ai-msg' });
  mockFindFirst.mockResolvedValue(null);
});

describe('stripI18nPlaceholder', () => {
  it('remplace les clés i18n par un libellé générique', () => {
    expect(stripI18nPlaceholder('__i18n:chatWidget.responses.thankYou__')).toBe(
      '[Message automatique MoonSkin]',
    );
    expect(stripI18nPlaceholder('Texte normal')).toBe('Texte normal');
  });
});

describe('mapSenderToRole', () => {
  it('mappe USER → user, staff → assistant, SYSTEM → null', () => {
    expect(mapSenderToRole('USER')).toBe('user');
    expect(mapSenderToRole('BOT')).toBe('assistant');
    expect(mapSenderToRole('AI')).toBe('assistant');
    expect(mapSenderToRole('MODERATOR')).toBe('assistant');
    expect(mapSenderToRole('SYSTEM')).toBeNull();
  });

  it('retourne null pour un type inconnu', () => {
    expect(mapSenderToRole('UNKNOWN' as 'USER')).toBeNull();
  });
});

describe('buildSystemPrompt', () => {
  it('inclut le pseudo et le message de refus hors sujet', () => {
    const prompt = buildSystemPrompt('Player1');
    expect(prompt).toContain('Player1');
    expect(prompt).toContain(OFF_TOPIC_REFUSAL_I18N_KEY);
  });

  it('injecte le contexte RAG quand fourni', () => {
    const prompt = buildSystemPrompt('Player1', '[1] FAQ trade hold 7 jours');
    expect(prompt).toContain('SOURCE DE VÉRITÉ');
    expect(prompt).toContain('trade hold 7 jours');
  });
});

describe('getChatAiQueueHint', () => {
  it('retourne null si l IA est désactivée', () => {
    mockIsOllamaConfigured.mockReturnValue(false);
    expect(
      getChatAiQueueHint({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      }),
    ).toBeNull();
  });

  it('indique une attente quand tous les créneaux sont pris', async () => {
    process.env.CHAT_AI_ENABLED = 'true';
    process.env.OLLAMA_MAX_CONCURRENT = '1';
    mockIsOllamaConfigured.mockReturnValue(true);

    const { enqueueChatAiReply } = await import('@/lib/chat-ai-queue');
    let release: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      release = resolve;
    });

    const running = enqueueChatAiReply('conv-block', async () => {
      await started;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      getChatAiQueueHint({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      }),
    ).toEqual({ waiting: true, ahead: 1 });

    release?.();
    await running;
  });
});

describe('maybeGenerateAiReply', () => {
  const baseConversation = {
    id: 'conv-1',
    assignedTo: null,
    status: 'ACTIVE',
    category: 'support',
    user: { steamUsername: 'SteamPlayer', name: null },
    messages: [
      { content: 'Bonjour', senderType: 'USER', createdAt: new Date() },
    ],
  };

  it('ne fait rien si conversation absente', async () => {
    mockFindUnique.mockResolvedValue(null);
    await maybeGenerateAiReply('missing');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('ne fait rien si CHAT_AI_ENABLED est off', async () => {
    mockIsOllamaConfigured.mockReturnValue(false);
    mockFindUnique.mockResolvedValue(baseConversation);
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).not.toHaveBeenCalled();
  });

  it('ne fait rien si un modérateur est assigné', async () => {
    mockFindUnique.mockResolvedValue({ ...baseConversation, assignedTo: 'mod-1' });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).not.toHaveBeenCalled();
  });

  it('ne fait rien si un modérateur a déjà répondu', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Help', senderType: 'USER', createdAt: new Date() },
        { content: 'Réponse humaine', senderType: 'MODERATOR', createdAt: new Date() },
      ],
    });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).not.toHaveBeenCalled();
  });

  it('stocke un refus IA pour message hors sujet', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      category: null,
      messages: [
        {
          content: 'Fais-moi une recette de tarte',
          senderType: 'USER',
          createdAt: new Date(),
        },
      ],
    });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'AI',
          content: OFF_TOPIC_REFUSAL_I18N_KEY,
        }),
      }),
    );
  });

  it('répond via trusted-answer sans appeler Ollama pour une crainte d\'arnaque', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'et si je me fais scam?', senderType: 'USER', createdAt: new Date() },
      ],
    });

    await maybeGenerateAiReply('conv-1', { locale: 'fr' });

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'AI',
          content: expect.stringContaining('légitime'),
          metadata: expect.objectContaining({ source: 'trusted-answer' }),
        }),
      }),
    );
  });

  it('répond via trusted-answer pour une question délai crypto', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        {
          content: 'Les virements crypto sont instantanés ?',
          senderType: 'USER',
          createdAt: new Date(),
        },
      ],
    });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: expect.stringContaining('10 minutes'),
        }),
      }),
    );
  });

  it('appelle Ollama et stocke la réponse IA', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Mon trade Steam est bloqué', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockOllamaChat.mockResolvedValue({ content: 'Vérifiez Steam Guard.', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'AI',
          content: 'Vérifiez Steam Guard.',
        }),
      }),
    );
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('impose l anglais dans le prompt quand la locale UI est en', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'hey how moonskin work', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockOllamaChat.mockResolvedValue({
      content: 'MoonSkin lets you sell CS2 skins.',
      model: 'llama3.2',
      done: true,
    });

    await maybeGenerateAiReply('conv-1', { locale: 'en' });

    const ollamaCall = mockOllamaChat.mock.calls[0][0];
    expect(ollamaCall.messages[0].content).toContain('Respond ONLY in English');
  });

  it('continue sans RAG si l’embedding échoue', async () => {
    process.env.RAG_DATABASE_URL = 'postgresql://rag';
    mockIsOllamaConfigured.mockReturnValue(true);
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Comment vendre mes skins ?', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockGenerateEmbedding.mockRejectedValue(new Error('embed down'));
    mockOllamaChat.mockResolvedValue({ content: 'Réponse sans RAG', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    expect(mockSearchSimilarChunks).not.toHaveBeenCalled();
    expect(mockOllamaChat).toHaveBeenCalled();
  });

  it('enrichit le prompt avec RAG quand disponible', async () => {
    process.env.RAG_DATABASE_URL = 'postgresql://rag';
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Délai paiement SEPA ?', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockSearchSimilarChunks.mockResolvedValue([
      { id: '1', source: 'faq', chunkIndex: 0, content: 'SEPA France vers 18h', metadata: {} },
    ]);
    mockOllamaChat.mockResolvedValue({ content: 'Vers 18h', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    const ollamaCall = mockOllamaChat.mock.calls[0][0];
    expect(ollamaCall.messages[0].content).toContain('SEPA France vers 18h');
  });

  it('ne fait rien sans dernier message USER', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [{ content: 'Welcome', senderType: 'BOT', createdAt: new Date() }],
    });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).not.toHaveBeenCalled();
  });

  it('utilise le fallback Utilisateur sans pseudo Steam', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      user: { steamUsername: null, name: null },
      messages: [
        { content: 'Mon trade Steam bloqué', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockOllamaChat.mockResolvedValue({ content: 'OK', model: 'llama3.2', done: true });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat.mock.calls[0][0].messages[0].content).toContain('Utilisateur');
  });

  it('continue sans RAG si aucun chunk pertinent', async () => {
    process.env.RAG_DATABASE_URL = 'postgresql://rag';
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Délai paiement SEPA ?', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    mockSearchSimilarChunks.mockResolvedValue([]);
    mockOllamaChat.mockResolvedValue({ content: 'Réponse', model: 'llama3.2', done: true });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).toHaveBeenCalled();
  });

  it('insère un fallback BOT si Ollama échoue', async () => {
    const userAt = new Date('2026-01-01T10:00:00Z');
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Mon trade Steam est bloqué', senderType: 'USER', createdAt: userAt },
      ],
    });
    mockOllamaChat.mockRejectedValue(new Error('ollama down'));
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ createdAt: userAt })
      .mockResolvedValueOnce(null);

    await expect(maybeGenerateAiReply('conv-1')).resolves.toBeUndefined();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'BOT',
          content: '__i18n:chatWidget.responses.aiUnavailable__',
        }),
      }),
    );
  });

  it('utilise les messages user antérieurs pour le contexte guards', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      category: null,
      messages: [
        { content: 'Mon paiement SEPA', senderType: 'USER', createdAt: new Date('2026-01-01') },
        { content: 'Et après ?', senderType: 'USER', createdAt: new Date('2026-01-02') },
      ],
    });
    mockOllamaChat.mockResolvedValue({ content: 'Réponse', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).toHaveBeenCalled();
  });

  it('ignore les messages SYSTEM dans le contexte Ollama', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      user: { steamUsername: 'PlayerX', name: null },
      messages: [
        { content: 'Mon trade Steam bloqué', senderType: 'USER', createdAt: new Date('2026-01-01T10:00:00Z') },
        { content: 'Ticket transmis', senderType: 'SYSTEM', createdAt: new Date('2026-01-01T10:00:01Z') },
      ],
    });
    mockOllamaChat.mockResolvedValue({ content: 'Réponse', model: 'llama3.2', done: true });
    await maybeGenerateAiReply('conv-1');
    expect(mockOllamaChat).toHaveBeenCalled();
    const roles = mockOllamaChat.mock.calls[0][0].messages.map((m: { role: string }) => m.role);
    expect(roles.filter((r: string) => r === 'system')).toHaveLength(1);
  });

  it('répond quand le message « ticket transmis » SYSTEM est inséré avant Ollama', async () => {
    const userAt = new Date('2026-01-01T10:00:00Z');
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Trade en attente', senderType: 'USER', createdAt: new Date('2026-01-01T09:59:00Z') },
        { content: 'Guide bot', senderType: 'BOT', createdAt: new Date('2026-01-01T09:59:30Z') },
        {
          content: 'Hello, mon trade est en attente depuis quelques heures',
          senderType: 'USER',
          createdAt: userAt,
        },
        {
          content: '__i18n:chatWidget.responses.ticketTransmitted__',
          senderType: 'SYSTEM',
          createdAt: new Date('2026-01-01T10:00:01Z'),
        },
      ],
    });
    mockFindFirst.mockResolvedValue(null);
    mockOllamaChat.mockResolvedValue({ content: 'Vérifiez Steam Guard.', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ senderType: 'AI' }),
      }),
    );
  });

  it('abandonne si un message staff arrive entre-temps (race)', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Mon trade Steam bloqué', senderType: 'USER', createdAt: new Date() },
      ],
    });
    mockFindFirst.mockResolvedValue({ id: 'mod-1', senderType: 'MODERATOR' });
    mockOllamaChat.mockResolvedValue({ content: 'Réponse', model: 'llama3.2', done: true });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('n’intervient pas tant que le BOT attend la description du problème', async () => {
    mockFindUnique.mockResolvedValue({
      ...baseConversation,
      messages: [
        { content: 'Trade en attente', senderType: 'USER', createdAt: new Date() },
        { content: 'Réponse bot fil', senderType: 'BOT', createdAt: new Date() },
      ],
    });

    await maybeGenerateAiReply('conv-1');

    expect(mockOllamaChat).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
