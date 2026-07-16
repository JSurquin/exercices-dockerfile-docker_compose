import {
  CONVERSATION_INACTIVITY_MS,
  deriveConversationTitle,
  detectSubjectShift,
  extractCategoryFromSubcategoryKey,
  formatConversationDisplayTitle,
  hasTopicChanged,
  isConversationAwaitingStaffReply,
  isConversationInactive,
  resolveConversationRouting,
  resolveConversationRoutingWithMessage,
} from '@/lib/chat-conversation-router';

describe('deriveConversationTitle', () => {
  it('tronque les titres longs', () => {
    const long = 'a'.repeat(80);
    expect(deriveConversationTitle(long)).toHaveLength(60);
    expect(deriveConversationTitle(long).endsWith('...')).toBe(true);
  });

  it('retourne Support si vide', () => {
    expect(deriveConversationTitle('   ')).toBe('Support');
  });
});

describe('resolveConversationRouting', () => {
  it('force un nouveau thread si forceNew', () => {
    expect(
      resolveConversationRouting({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'trade',
        forceNew: true,
      }),
    ).toBe('new');
  });

  it('nouveau thread après inactivité', () => {
    const old = new Date(Date.now() - CONVERSATION_INACTIVITY_MS - 1000);
    expect(
      resolveConversationRouting({
        lastMessageAt: old,
        currentCategory: 'trade',
        newCategory: 'trade',
      }),
    ).toBe('new');
  });

  it('nouveau thread si changement de catégorie', () => {
    expect(
      resolveConversationRouting({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'payment',
      }),
    ).toBe('new');
  });

  it('même thread sinon', () => {
    expect(
      resolveConversationRouting({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'trade',
      }),
    ).toBe('same');
  });
});

describe('detectSubjectShift', () => {
  it('détecte un changement trade → paiement', () => {
    expect(
      detectSubjectShift(['Mon trade est bloqué'], 'Où est mon virement SEPA ?'),
    ).toBe(true);
  });
});

describe('extractCategoryFromSubcategoryKey', () => {
  it('mappe delay.* vers payment', () => {
    expect(extractCategoryFromSubcategoryKey('delay.card')).toBe('payment');
  });

  it('mappe payment.* vers payment', () => {
    expect(extractCategoryFromSubcategoryKey('payment.sepa')).toBe('payment');
  });

  it('mappe support.* vers support', () => {
    expect(extractCategoryFromSubcategoryKey('support.account')).toBe('support');
  });
});

describe('formatConversationDisplayTitle', () => {
  it('priorise summary puis subject', () => {
    expect(
      formatConversationDisplayTitle({
        subject: 'Sujet',
        summary: 'Résumé IA',
      }),
    ).toBe('Résumé IA');
  });

  it('utilise le premier message sinon', () => {
    expect(
      formatConversationDisplayTitle({
        subject: null,
        summary: null,
        messages: [{ content: '  Mon trade bloqué  ' }],
      }),
    ).toBe('Mon trade bloqué');
  });

  it('fallback Support si subject/summary vides', () => {
    expect(
      formatConversationDisplayTitle({
        subject: '   ',
        summary: null,
        messages: [{ content: 'Premier msg' }],
      }),
    ).toBe('Premier msg');
  });
});

describe('extractCategoryFromSubcategoryKey — branches', () => {
  it('retourne null si absent', () => {
    expect(extractCategoryFromSubcategoryKey(null)).toBeNull();
  });

  it('utilise le prefixe avant le point si inconnu', () => {
    expect(extractCategoryFromSubcategoryKey('custom.topic')).toBe('custom');
  });
});

describe('detectSubjectShift — buckets support', () => {
  it('détecte support vs trade', () => {
    expect(
      detectSubjectShift(['J’ai un bug sur le site'], 'Mon trade est bloqué'),
    ).toBe(true);
  });

  it('false si bucket general', () => {
    expect(detectSubjectShift(['Bonjour'], 'Salut')).toBe(false);
  });
});

describe('resolveConversationRoutingWithMessage', () => {
  it('retourne new immédiatement si forceNew', () => {
    expect(
      resolveConversationRoutingWithMessage({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'trade',
        priorUserMessages: ['Mon trade'],
        newMessage: 'Toujours bloqué',
        forceNew: true,
      }),
    ).toBe('new');
  });

  it('reste sur le même fil si l’utilisateur attend une réponse', () => {
    expect(
      resolveConversationRoutingWithMessage({
        lastMessageAt: new Date(Date.now() - CONVERSATION_INACTIVITY_MS - 1000),
        currentCategory: 'trade',
        newCategory: 'payment',
        priorUserMessages: ['Mon trade est bloqué'],
        newMessage: 'Où est mon virement SEPA ?',
        existingMessages: [
          { senderType: 'USER' },
          { senderType: 'SYSTEM' },
        ],
      }),
    ).toBe('same');
  });

  it('nouveau thread si shift sujet détecté', () => {
    expect(
      resolveConversationRoutingWithMessage({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'trade',
        priorUserMessages: ['Problème de trade Steam'],
        newMessage: 'Mon virement SEPA n’est pas arrivé',
      }),
    ).toBe('new');
  });

  it('même thread si sujet stable', () => {
    expect(
      resolveConversationRoutingWithMessage({
        lastMessageAt: new Date(),
        currentCategory: 'trade',
        newCategory: 'trade',
        priorUserMessages: ['Mon trade est bloqué'],
        newMessage: 'Toujours bloqué',
      }),
    ).toBe('same');
  });

  it('reste sur le même fil après une sous-catégorie aide et la réponse bot', () => {
    expect(
      resolveConversationRoutingWithMessage({
        lastMessageAt: new Date(),
        currentCategory: 'support',
        newCategory: null,
        priorUserMessages: ['Bug'],
        newMessage: 'Mon trade ne fonctionne pas',
        existingMessages: [
          { senderType: 'USER' },
          { senderType: 'BOT' },
        ],
      }),
    ).toBe('same');
  });
});

describe('hasTopicChanged', () => {
  it('retourne false si catégorie absente', () => {
    expect(hasTopicChanged(null, 'trade')).toBe(false);
  });
});

describe('isConversationInactive', () => {
  it('retourne false sans date', () => {
    expect(isConversationInactive(null)).toBe(false);
  });
});

describe('isConversationAwaitingStaffReply', () => {
  it('true si le dernier message utilisateur n’a pas reçu de réponse staff', () => {
    expect(
      isConversationAwaitingStaffReply([
        { senderType: 'USER' },
        { senderType: 'SYSTEM' },
      ]),
    ).toBe(true);
  });

  it('false après une réponse modérateur', () => {
    expect(
      isConversationAwaitingStaffReply([
        { senderType: 'USER' },
        { senderType: 'MODERATOR' },
      ]),
    ).toBe(false);
  });

  it('false après une réponse IA', () => {
    expect(
      isConversationAwaitingStaffReply([
        { senderType: 'USER' },
        { senderType: 'AI' },
      ]),
    ).toBe(false);
  });

  it('true si l’utilisateur relance après une réponse bot', () => {
    expect(
      isConversationAwaitingStaffReply([
        { senderType: 'USER' },
        { senderType: 'BOT' },
        { senderType: 'USER' },
      ]),
    ).toBe(true);
  });
});
