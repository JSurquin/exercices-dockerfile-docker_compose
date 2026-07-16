import {
  evaluateUserMessageForAi,
  OFF_TOPIC_REFUSAL_I18N_KEY,
  sanitizeAiGeneratedContent,
  shouldAiReplyToConversation,
  shouldTriggerAiForUserMessage,
} from '@/lib/chat-ai-guards';

describe('shouldTriggerAiForUserMessage', () => {
  it('autorise l’IA sur un message direct sans BOT', () => {
    expect(
      shouldTriggerAiForUserMessage([{ senderType: 'USER' }]),
    ).toBe(true);
  });

  it('bloque l’IA sur la sélection de fil (skipAi)', () => {
    expect(
      shouldTriggerAiForUserMessage([{ senderType: 'USER' }], { skipAi: true }),
    ).toBe(false);
  });

  it('bloque l’IA tant qu’aucun USER n’a décrit le problème après le BOT', () => {
    expect(
      shouldTriggerAiForUserMessage([
        { senderType: 'USER' },
        { senderType: 'BOT' },
      ]),
    ).toBe(false);
  });

  it('autorise l’IA après la description du problème post-BOT', () => {
    expect(
      shouldTriggerAiForUserMessage([
        { senderType: 'USER' },
        { senderType: 'BOT' },
        { senderType: 'USER' },
      ]),
    ).toBe(true);
  });

  it('autorise l’IA sur une relance après une réponse IA (sans BOT)', () => {
    expect(
      shouldTriggerAiForUserMessage([
        { senderType: 'USER' },
        { senderType: 'AI' },
        { senderType: 'USER' },
      ]),
    ).toBe(true);
  });
});

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

  it('refuse si l\'IA est désactivée sur la conversation', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage: false,
        aiEnabled: false,
      }),
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
  it('accepte une question sur le risque d\'arnaque', () => {
    const result = evaluateUserMessageForAi({
      message: 'et si je me fais scam?',
    });
    expect(result.allowed).toBe(true);
  });

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

  it('refuse une demande de recette même avec catégorie support', () => {
    const result = evaluateUserMessageForAi({
      message: 'Donne moi une recette de tarte aux pommes',
      category: 'support',
    });

    expect(result.allowed).toBe(false);
    expect(result.refusalMessage).toBe(OFF_TOPIC_REFUSAL_I18N_KEY);
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

describe('sanitizeAiGeneratedContent', () => {
  it('retourne la clé i18n si le modèle ajoute du contenu hors sujet après un refus', () => {
    const content =
      "Je suis l'assistant MoonSkin et je ne peux répondre qu'aux questions liées à la plateforme.\n\nSi tu cherches une recette, consulte un site de cuisine.";
    expect(sanitizeAiGeneratedContent(content)).toBe(OFF_TOPIC_REFUSAL_I18N_KEY);
  });

  it('conserve une réponse légitime sans refus', () => {
    const content = 'Le trade hold Steam dure 7 jours, puis le paiement part automatiquement.';
    expect(sanitizeAiGeneratedContent(content)).toBe(content);
  });
});
