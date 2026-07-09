import {
  collectChatEscalationNotificationIds,
  collectModeratorAttentionKeys,
  countClientNotifyMessages,
  countUserMessagesForModerator,
  findNewChatEscalationNotificationIds,
  findNewModeratorAlertKeys,
  getModeratorAttentionKey,
  shouldPlayClientNotificationSound,
  shouldPlayModeratorNotificationSound,
  CLIENT_NOTIFY_SENDER_TYPES,
} from '@/lib/chat-notification-logic';

describe('CLIENT_NOTIFY_SENDER_TYPES', () => {
  it('inclut MODERATOR, BOT, AI et SYSTEM pour le client', () => {
    expect(CLIENT_NOTIFY_SENDER_TYPES).toEqual(['MODERATOR', 'BOT', 'AI', 'SYSTEM']);
  });
});

describe('countClientNotifyMessages', () => {
  it('compte staff + IA, pas USER', () => {
    expect(
      countClientNotifyMessages([
        { senderType: 'USER' },
        { senderType: 'MODERATOR' },
        { senderType: 'AI' },
        { senderType: 'BOT' },
        { senderType: 'SYSTEM' },
      ]),
    ).toBe(4);
  });
});

describe('countUserMessagesForModerator', () => {
  it('compte uniquement USER', () => {
    expect(
      countUserMessagesForModerator([
        { senderType: 'USER' },
        { senderType: 'MODERATOR' },
        { senderType: 'USER' },
      ]),
    ).toBe(2);
  });
});

describe('shouldPlayClientNotificationSound', () => {
  it('true si nouveau message staff/IA', () => {
    expect(
      shouldPlayClientNotificationSound({ previousCount: 1, currentCount: 2 }),
    ).toBe(true);
  });

  it('false au premier chargement', () => {
    expect(
      shouldPlayClientNotificationSound({ previousCount: null, currentCount: 3 }),
    ).toBe(false);
  });

  it('false si count staff inchangé', () => {
    expect(
      shouldPlayClientNotificationSound({ previousCount: 2, currentCount: 2 }),
    ).toBe(false);
  });
});

describe('shouldPlayModeratorNotificationSound', () => {
  it('true si nouveau message USER', () => {
    expect(
      shouldPlayModeratorNotificationSound({ previousUserCount: 1, currentUserCount: 2 }),
    ).toBe(true);
  });

  it('false quand le modérateur répond lui-même', () => {
    expect(
      shouldPlayModeratorNotificationSound({ previousUserCount: 2, currentUserCount: 2 }),
    ).toBe(false);
  });

  it('false au premier chargement', () => {
    expect(
      shouldPlayModeratorNotificationSound({ previousUserCount: null, currentUserCount: 3 }),
    ).toBe(false);
  });

  it('false si le nombre de messages user diminue', () => {
    expect(
      shouldPlayModeratorNotificationSound({ previousUserCount: 3, currentUserCount: 2 }),
    ).toBe(false);
  });
});

describe('flux notification client ↔ modérateur', () => {
  it('client notifié par MODERATOR, BOT, AI et SYSTEM — pas par USER', () => {
    const thread = [
      { senderType: 'USER' },
      { senderType: 'BOT' },
      { senderType: 'MODERATOR' },
      { senderType: 'AI' },
    ];
    expect(countClientNotifyMessages(thread)).toBe(3);
    expect(countUserMessagesForModerator(thread)).toBe(1);
  });

  it('son client uniquement si staff/IA augmente', () => {
    const thread = [
      { senderType: 'USER' },
      { senderType: 'BOT' },
      { senderType: 'MODERATOR' },
    ];
    const prev = countClientNotifyMessages(thread.slice(0, 2));
    const next = countClientNotifyMessages(thread);
    expect(shouldPlayClientNotificationSound({ previousCount: prev, currentCount: next })).toBe(
      true,
    );
    expect(
      shouldPlayModeratorNotificationSound({
        previousUserCount: countUserMessagesForModerator(thread.slice(0, 2)),
        currentUserCount: countUserMessagesForModerator(thread),
      }),
    ).toBe(false);
  });

  it('son modérateur uniquement si USER augmente', () => {
    const prevThread = [{ senderType: 'USER' }];
    const nextThread = [{ senderType: 'USER' }, { senderType: 'USER' }];
    expect(
      shouldPlayModeratorNotificationSound({
        previousUserCount: countUserMessagesForModerator(prevThread),
        currentUserCount: countUserMessagesForModerator(nextThread),
      }),
    ).toBe(true);
    expect(
      shouldPlayClientNotificationSound({
        previousCount: countClientNotifyMessages(prevThread),
        currentCount: countClientNotifyMessages(nextThread),
      }),
    ).toBe(false);
  });
});

describe('getModeratorAttentionKey', () => {
  it('retourne une clé pour une conversation escaladée avec dernier message USER', () => {
    expect(
      getModeratorAttentionKey({
        id: 'c1',
        aiEnabled: false,
        messages: [{ id: 'm1', senderType: 'USER' }],
      }),
    ).toBe('c1:m1');
  });

  it('ignore les conversations encore gérées par l’IA', () => {
    expect(
      getModeratorAttentionKey({
        id: 'c1',
        aiEnabled: true,
        messages: [{ id: 'm1', senderType: 'USER' }],
      }),
    ).toBeNull();
  });
});

describe('collectModeratorAttentionKeys', () => {
  it('exclut la conversation ouverte par le modérateur', () => {
    expect(
      collectModeratorAttentionKeys(
        [
          {
            id: 'open',
            aiEnabled: false,
            messages: [{ id: 'm-open', senderType: 'USER' }],
          },
          {
            id: 'other',
            aiEnabled: false,
            messages: [{ id: 'm-other', senderType: 'USER' }],
          },
        ],
        'open',
      ),
    ).toEqual(['other:m-other']);
  });
});

describe('findNewModeratorAlertKeys', () => {
  it('repère les nouvelles alertes', () => {
    expect(findNewModeratorAlertKeys(new Set(['c1:m1']), ['c1:m1', 'c2:m2'])).toEqual(['c2:m2']);
  });
});

describe('collectChatEscalationNotificationIds', () => {
  it('filtre les notifications d’escalade chat', () => {
    expect(
      collectChatEscalationNotificationIds([
        { id: 'n1', metadata: { event: 'chat_escalation' } },
        { id: 'n2', metadata: { event: 'other' } },
      ]),
    ).toEqual(['n1']);
  });
});

describe('findNewChatEscalationNotificationIds', () => {
  it('repère les nouvelles notifications d’escalade', () => {
    expect(findNewChatEscalationNotificationIds(new Set(['n1']), ['n1', 'n2'])).toEqual(['n2']);
  });
});
