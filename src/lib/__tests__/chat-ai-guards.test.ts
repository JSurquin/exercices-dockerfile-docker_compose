import {
  evaluateUserMessageForAi,
  OFF_TOPIC_REFUSAL_I18N_KEY,
  shouldAiReplyToConversation,
} from '@/lib/chat-ai-guards';

describe('shouldAiReplyToConversation', () => {
  it('refuse si CHAT_AI_ENABLED est absent', () => {
    delete process.env.CHAT_AI_ENABLED;
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      })
    ).toBe(false);
  });

  it('accepte une conversation active sans modérateur', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      })
    ).toBe(true);
  });

  it('refuse si un modérateur est assigné', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: 'mod-123',
        status: 'ACTIVE',
        hasModeratorMessage: false,
      })
    ).toBe(false);
  });

  it('refuse si un modérateur a déjà répondu', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: true,
      })
    ).toBe(false);
  });

  it('refuse si la conversation est fermée', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'CLOSED',
        hasModeratorMessage: false,
      })
    ).toBe(false);
  });
});

describe('evaluateUserMessageForAi', () => {
  it('refuse une demande de recette hors sujet', () => {
    const result = evaluateUserMessageForAi({
      message: 'Fais-moi une recette de tarte à la pomme',
    });

    expect(result.allowed).toBe(false);
    expect(result.refusalMessage).toBe(OFF_TOPIC_REFUSAL_I18N_KEY);
  });

  it('accepte une question sur un trade MoonSkin', () => {
    const result = evaluateUserMessageForAi({
      message: 'Mon trade Steam est bloqué depuis 2 jours',
    });

    expect(result.allowed).toBe(true);
  });

  it('accepte un simple bonjour', () => {
    const result = evaluateUserMessageForAi({
      message: 'Bonjour',
    });

    expect(result.allowed).toBe(true);
  });

  it('accepte un message ambigu si la catégorie support est définie', () => {
    const result = evaluateUserMessageForAi({
      message: 'J\'ai un souci',
      category: 'support',
    });

    expect(result.allowed).toBe(true);
  });

  it('accepte un suivi si le contexte précédent est MoonSkin', () => {
    const result = evaluateUserMessageForAi({
      message: 'Et après ?',
      priorUserMessages: ['Mon paiement SEPA n\'est pas arrivé'],
    });

    expect(result.allowed).toBe(true);
  });

  it('refuse une blague sans contexte MoonSkin', () => {
    const result = evaluateUserMessageForAi({
      message: 'Raconte-moi une blague',
    });

    expect(result.allowed).toBe(false);
  });

  it('refuse un message vide', () => {
    const result = evaluateUserMessageForAi({ message: '   ' });
    expect(result.allowed).toBe(false);
  });

  it('refuse si CHAT_AI_ENABLED=false via shouldAiReply', () => {
    process.env.CHAT_AI_ENABLED = 'false';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      }),
    ).toBe(false);
  });

  it('refuse une conversation ARCHIVED', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ARCHIVED',
        hasModeratorMessage: false,
      }),
    ).toBe(false);
  });

  it('accepte une question courte ambiguë avec point d’interrogation', () => {
    const result = evaluateUserMessageForAi({
      message: 'Comment ça marche ?',
    });
    expect(result.allowed).toBe(true);
  });

  it('refuse une demande de code sans contexte MoonSkin', () => {
    const result = evaluateUserMessageForAi({
      message: 'Écris-moi un script Python',
    });
    expect(result.allowed).toBe(false);
  });

  it('refuse un message ambigu sans contexte ni mot-clé MoonSkin', () => {
    const result = evaluateUserMessageForAi({
      message: 'Parle-moi de philosophie antique',
    });
    expect(result.allowed).toBe(false);
    expect(result.refusalMessage).toBe(OFF_TOPIC_REFUSAL_I18N_KEY);
  });

  it('accepte les catégories payment et trade', () => {
    expect(
      evaluateUserMessageForAi({ message: 'J\'ai un souci', category: 'payment' }).allowed,
    ).toBe(true);
    expect(
      evaluateUserMessageForAi({ message: 'J\'ai un souci', category: 'trade' }).allowed,
    ).toBe(true);
  });

  it('normalise les espaces dans le message', () => {
    const result = evaluateUserMessageForAi({
      message: '  Mon   trade   Steam   bloqué  ',
    });
    expect(result.allowed).toBe(true);
  });
});
