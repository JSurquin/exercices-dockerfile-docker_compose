import {
  buildConversationWhereClause,
  canGuestAccessConversation,
  canUserAccessConversation,
  canClientRateConversation,
  canClientSubmitFeedback,
  computeAverageClientRating,
  computeAverageResponseTimeMinutes,
  countStaffMessagesForNotification,
  getUnreadMessageCount,
  getConversationListUnreadTotal,
  markStaffMessagesReadForClientViewer,
  patchConversationListPreviewAsReadForClient,
  resolveConversationUnreadForClient,
  isConversationWriteBlockedForIdentity,
  isConversationHiddenFromClientViewer,
  isStaffRole,
  isValidModeratorRole,
  resolveOutgoingSenderType,
  resolveStatusAfterMessage,
  selectInitialConversationId,
  shouldClearAiTypingIndicator,
  shouldClearAwaitingStaffReply,
  shouldInsertTicketTransmittedMessage,
  shouldInsertFollowUpAwaitingAcknowledgment,
  shouldRedactEmailsForViewer,
  STAFF_SENDER_TYPES_FOR_NOTIFICATION,
} from '@/lib/chat-logic';

describe('canGuestAccessConversation', () => {
  it('autorise les conversations sans userId', () => {
    expect(canGuestAccessConversation(null)).toBe(true);
  });

  it('refuse les conversations liées à un compte', () => {
    expect(canGuestAccessConversation('user-1')).toBe(false);
  });
});

describe('canUserAccessConversation', () => {
  it('autorise admin et modérateur sur toute conversation en scope staff', () => {
    expect(
      canUserAccessConversation({
        role: 'ADMIN',
        userId: 'a',
        conversationUserId: 'b',
        assignedTo: null,
        scope: 'staff',
      }),
    ).toBe(true);
    expect(
      canUserAccessConversation({
        role: 'MODERATOR',
        userId: 'm',
        conversationUserId: 'b',
        assignedTo: null,
        scope: 'staff',
      }),
    ).toBe(true);
  });

  it('restreint admin et modérateur à leurs propres conversations en scope widget', () => {
    expect(
      canUserAccessConversation({
        role: 'ADMIN',
        userId: 'a',
        conversationUserId: 'b',
        assignedTo: null,
      }),
    ).toBe(false);
    expect(
      canUserAccessConversation({
        role: 'MODERATOR',
        userId: 'm',
        conversationUserId: 'm',
        assignedTo: null,
      }),
    ).toBe(true);
  });

  it('autorise le propriétaire', () => {
    expect(
      canUserAccessConversation({
        role: 'USER',
        userId: 'u1',
        conversationUserId: 'u1',
        assignedTo: null,
      }),
    ).toBe(true);
  });

  it('refuse un utilisateur tiers', () => {
    expect(
      canUserAccessConversation({
        role: 'USER',
        userId: 'u1',
        conversationUserId: 'u2',
        assignedTo: 'u1',
      }),
    ).toBe(false);
  });
});

describe('resolveOutgoingSenderType', () => {
  it('force USER pour invité', () => {
    expect(resolveOutgoingSenderType({ identityKind: 'guest' })).toBe('USER');
  });

  it('force USER pour staff via widget (support client)', () => {
    expect(
      resolveOutgoingSenderType({ identityKind: 'user', role: 'MODERATOR' }),
    ).toBe('USER');
    expect(
      resolveOutgoingSenderType({ identityKind: 'user', role: 'ADMIN' }),
    ).toBe('USER');
    expect(
      resolveOutgoingSenderType({
        identityKind: 'user',
        role: 'MODERATOR',
        replyContext: 'widget',
      }),
    ).toBe('USER');
  });

  it('force MODERATOR pour staff depuis le panneau modération', () => {
    expect(
      resolveOutgoingSenderType({
        identityKind: 'user',
        role: 'MODERATOR',
        replyContext: 'moderation',
      }),
    ).toBe('MODERATOR');
    expect(
      resolveOutgoingSenderType({
        identityKind: 'user',
        role: 'ADMIN',
        replyContext: 'moderation',
      }),
    ).toBe('MODERATOR');
  });

  it('force USER pour utilisateur standard', () => {
    expect(
      resolveOutgoingSenderType({ identityKind: 'user', role: 'USER' }),
    ).toBe('USER');
  });
});

describe('isConversationHiddenFromClientViewer', () => {
  it('masque DELETED côté widget', () => {
    expect(
      isConversationHiddenFromClientViewer({ status: 'DELETED', scope: 'widget', role: 'USER' }),
    ).toBe(true);
    expect(
      isConversationHiddenFromClientViewer({ status: 'DELETED', scope: 'widget' }),
    ).toBe(true);
  });

  it('conserve DELETED visible pour le staff', () => {
    expect(
      isConversationHiddenFromClientViewer({
        status: 'DELETED',
        scope: 'staff',
        role: 'MODERATOR',
      }),
    ).toBe(false);
  });

  it('laisse ACTIVE visible', () => {
    expect(
      isConversationHiddenFromClientViewer({ status: 'ACTIVE', scope: 'widget', role: 'USER' }),
    ).toBe(false);
  });
});

describe('isConversationWriteBlockedForIdentity', () => {
  it('ne bloque pas une conversation active', () => {
    expect(
      isConversationWriteBlockedForIdentity('ACTIVE', 'guest'),
    ).toBe(false);
  });

  it('bloque invité sur conversation fermée', () => {
    expect(
      isConversationWriteBlockedForIdentity('CLOSED', 'guest'),
    ).toBe(true);
    expect(
      isConversationWriteBlockedForIdentity('ARCHIVED', 'guest'),
    ).toBe(true);
    expect(
      isConversationWriteBlockedForIdentity('DELETED', 'guest'),
    ).toBe(true);
  });

  it('bloque user standard sur conversation DELETED', () => {
    expect(
      isConversationWriteBlockedForIdentity('DELETED', 'user', 'USER'),
    ).toBe(true);
  });

  it('autorise staff sur conversation fermée ou supprimée', () => {
    expect(
      isConversationWriteBlockedForIdentity('CLOSED', 'user', 'MODERATOR'),
    ).toBe(false);
    expect(
      isConversationWriteBlockedForIdentity('DELETED', 'user', 'ADMIN'),
    ).toBe(false);
  });
});

describe('resolveStatusAfterMessage', () => {
  it('réouvre un ticket fermé quand un user répond', () => {
    expect(resolveStatusAfterMessage('CLOSED', 'USER')).toBe('ACTIVE');
  });

  it('conserve le statut pour un modérateur', () => {
    expect(resolveStatusAfterMessage('CLOSED', 'MODERATOR')).toBe('CLOSED');
  });
});

describe('shouldInsertTicketTransmittedMessage', () => {
  it('insère le message système après le premier user post-BOT (widget flow)', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'BOT' },
          { id: '3', senderType: 'USER' },
        ],
        '3',
        'USER',
      ),
    ).toBe(true);
  });

  it('ne répète pas si un user a déjà répondu après le BOT', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'BOT' },
          { id: '3', senderType: 'USER' },
          { id: '4', senderType: 'USER' },
        ],
        '4',
        'USER',
      ),
    ).toBe(false);
  });

  it('ignore les messages modérateur', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [{ id: '1', senderType: 'BOT' }],
        '2',
        'MODERATOR',
      ),
    ).toBe(false);
  });

  it('false sans message BOT précédent', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [{ id: '1', senderType: 'USER' }],
        '2',
        'USER',
      ),
    ).toBe(false);
  });

  it('ne répète pas le ticket vert après un accusé de relance BOT', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'AI' },
          { id: '3', senderType: 'USER' },
          { id: '4', senderType: 'SYSTEM', content: '__i18n:chatWidget.responses.ticketTransmitted__' },
          { id: '5', senderType: 'USER' },
          { id: '6', senderType: 'BOT' },
        ],
        '7',
        'USER',
      ),
    ).toBe(false);
  });

  it('ne répète pas si le ticket vert a déjà été transmis', () => {
    expect(
      shouldInsertTicketTransmittedMessage(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'BOT' },
          { id: '3', senderType: 'USER' },
          {
            id: '4',
            senderType: 'SYSTEM',
            content: '__i18n:chatWidget.responses.ticketTransmitted__',
          },
        ],
        '5',
        'USER',
      ),
    ).toBe(false);
  });
});

describe('shouldInsertFollowUpAwaitingAcknowledgment', () => {
  it('accuse réception BOT sur une relance en attente de modérateur', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'BOT' },
          { id: '3', senderType: 'USER' },
          { id: '4', senderType: 'SYSTEM' },
        ],
        '5',
        'USER',
      ),
    ).toBe(true);
  });

  it('accuse réception après assignation modérateur sans réponse humaine', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'AI' },
          { id: '3', senderType: 'SYSTEM' },
        ],
        '4',
        'USER',
        'mod-123',
      ),
    ).toBe(true);
  });

  it('ne remplace pas le message ticket transmis initial', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'BOT' },
        ],
        '3',
        'USER',
      ),
    ).toBe(false);
  });

  it('ignore si un modérateur a déjà répondu', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'MODERATOR' },
        ],
        '3',
        'USER',
      ),
    ).toBe(false);
  });

  it('ne déclenche pas tant que l’IA gère encore la conversation', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'AI' },
          { id: '3', senderType: 'USER' },
        ],
        '4',
        'USER',
        null,
        true,
      ),
    ).toBe(false);
  });

  it('ne déclenche pas sur la première relance avant réponse IA', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [{ id: '1', senderType: 'USER' }],
        '2',
        'USER',
        null,
        true,
      ),
    ).toBe(false);
  });

  it('déclenche après escalade humaine sans assignation', () => {
    expect(
      shouldInsertFollowUpAwaitingAcknowledgment(
        [
          { id: '1', senderType: 'USER' },
          { id: '2', senderType: 'AI' },
          { id: '3', senderType: 'SYSTEM', content: '__i18n:chatWidget.responses.ticketTransmitted__' },
        ],
        '4',
        'USER',
        null,
        false,
      ),
    ).toBe(true);
  });
});

describe('buildConversationWhereClause', () => {
  it('restreint les users à leurs propres conversations', () => {
    expect(
      buildConversationWhereClause({
        role: 'USER',
        userId: 'u1',
        filters: {},
      }),
    ).toEqual({ userId: 'u1', status: { not: 'DELETED' } });
  });

  it('restreint admin/modérateur à leurs propres conversations en scope widget', () => {
    expect(
      buildConversationWhereClause({
        role: 'ADMIN',
        userId: 'admin-1',
        filters: { category: 'trade', assignedTo: 'mod-2' },
      }),
    ).toEqual({ userId: 'admin-1', status: { not: 'DELETED' } });
  });

  it('filtre assignedTo=me pour modérateur en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { assignedTo: 'me' },
        scope: 'staff',
      }),
    ).toEqual({ assignedTo: 'mod-1' });
  });

  it('filtre assignedTo par id modérateur cible en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { assignedTo: 'mod-2' },
        scope: 'staff',
      }),
    ).toEqual({ status: { not: 'DELETED' }, assignedTo: 'mod-2' });
  });

  it('filtre assignedTo=unassigned avec assignedTo null en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { assignedTo: 'unassigned' },
        scope: 'staff',
      }),
    ).toEqual({ status: { not: 'DELETED' }, assignedTo: null });
  });

  it('applique category et priority en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'ADMIN',
        userId: 'admin',
        filters: { category: 'trade', priority: 'HIGH' },
        scope: 'staff',
      }),
    ).toEqual({
      status: { not: 'DELETED' },
      category: 'trade',
      priority: 'HIGH',
    });
  });

  it('n’expose pas userId aux modérateurs en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { userId: 'victim' },
        scope: 'staff',
      }),
    ).toEqual({ status: { not: 'DELETED' } });
  });

  it('permet le filtre userId aux admins en scope staff', () => {
    expect(
      buildConversationWhereClause({
        role: 'ADMIN',
        userId: 'admin',
        filters: { userId: 'target', status: 'ACTIVE', search: 'steam' },
        scope: 'staff',
      }),
    ).toEqual({
      status: 'ACTIVE',
      userId: 'target',
      OR: [
        { subject: { contains: 'steam', mode: 'insensitive' } },
        { user: { name: { contains: 'steam', mode: 'insensitive' } } },
        { user: { email: { contains: 'steam', mode: 'insensitive' } } },
      ],
    });
  });
});

describe('computeAverageResponseTimeMinutes', () => {
  const t0 = new Date('2025-01-01T10:00:00Z');
  const t5 = new Date('2025-01-01T10:05:00Z');
  const t10 = new Date('2025-01-01T10:10:00Z');

  it('calcule le temps moyen staff (BOT/MODERATOR)', () => {
    const avg = computeAverageResponseTimeMinutes([
      {
        messages: [
          { senderType: 'USER', createdAt: t0 },
          { senderType: 'BOT', createdAt: t5 },
        ],
      },
      {
        messages: [
          { senderType: 'USER', createdAt: t0 },
          { senderType: 'MODERATOR', createdAt: t10 },
        ],
      },
    ]);
    expect(avg).toBe(8);
  });

  it('retourne 0 si staff répond avant le user', () => {
    expect(
      computeAverageResponseTimeMinutes([
        {
          messages: [
            { senderType: 'BOT', createdAt: t0 },
            { senderType: 'USER', createdAt: t5 },
          ],
        },
      ]),
    ).toBe(0);
  });

  it('retourne 0 sans réponse staff', () => {
    expect(
      computeAverageResponseTimeMinutes([
        { messages: [{ senderType: 'USER', createdAt: t0 }] },
      ]),
    ).toBe(0);
  });

  it('calcule par modérateur assigné', () => {
    const avg = computeAverageResponseTimeMinutes(
      [
        {
          messages: [
            { senderType: 'USER', createdAt: t0, userId: null },
            { senderType: 'MODERATOR', createdAt: t5, userId: 'mod-1' },
            { senderType: 'USER', createdAt: t5, userId: null },
            { senderType: 'MODERATOR', createdAt: t10, userId: 'mod-1' },
          ],
        },
      ],
      { moderatorId: 'mod-1' },
    );
    expect(avg).toBe(5);
  });
});

describe('getUnreadMessageCount', () => {
  it('compte les messages non lus hors USER', () => {
    expect(
      getUnreadMessageCount([
        { isRead: false, senderType: 'BOT' },
        { isRead: true, senderType: 'AI' },
        { isRead: false, senderType: 'USER' },
        { isRead: false, senderType: 'MODERATOR' },
      ]),
    ).toBe(2);
  });
});

describe('resolveConversationUnreadForClient', () => {
  it('retourne 0 pour un ticket clôturé même avec messages non lus', () => {
    expect(
      resolveConversationUnreadForClient({
        conversationStatus: 'CLOSED',
        previewMessages: [{ isRead: false, senderType: 'BOT' }],
        isViewingThisConversation: false,
      }),
    ).toBe(0);
  });

  it('retourne 0 quand la conversation est consultée', () => {
    expect(
      resolveConversationUnreadForClient({
        conversationStatus: 'ACTIVE',
        previewMessages: [{ isRead: false, senderType: 'MODERATOR' }],
        isViewingThisConversation: true,
      }),
    ).toBe(0);
  });

  it('compte les non-lus actifs hors consultation', () => {
    expect(
      resolveConversationUnreadForClient({
        conversationStatus: 'ACTIVE',
        previewMessages: [
          { isRead: false, senderType: 'BOT' },
          { isRead: false, senderType: 'MODERATOR' },
        ],
        isViewingThisConversation: false,
      }),
    ).toBe(2);
  });
});

describe('markStaffMessagesReadForClientViewer', () => {
  it('marque BOT/MODERATOR/AI/SYSTEM comme lus sans toucher USER', () => {
    const input = [
      { isRead: false, senderType: 'USER' },
      { isRead: false, senderType: 'BOT' },
      { isRead: false, senderType: 'MODERATOR' },
    ];
    const result = markStaffMessagesReadForClientViewer(input);
    expect(result[0].isRead).toBe(false);
    expect(result[1].isRead).toBe(true);
    expect(result[2].isRead).toBe(true);
  });
});

describe('getConversationListUnreadTotal', () => {
  it('ignore la conversation consultée', () => {
    expect(
      getConversationListUnreadTotal(
        [
          { id: 'c1', unread: 2 },
          { id: 'c2', unread: 1 },
        ],
        'c1',
        true,
      ),
    ).toBe(1);
  });
});

describe('patchConversationListPreviewAsReadForClient', () => {
  it('marque lu les messages staff de l aperçu consulté', () => {
    const conversations = [
      {
        id: 'c1',
        messages: [{ isRead: false, senderType: 'BOT' }],
      },
      {
        id: 'c2',
        messages: [{ isRead: false, senderType: 'MODERATOR' }],
      },
    ];
    const patched = patchConversationListPreviewAsReadForClient(conversations, 'c1');
    expect(patched[0].messages?.[0]?.isRead).toBe(true);
    expect(patched[1].messages?.[0]?.isRead).toBe(false);
  });
});

describe('countStaffMessagesForNotification', () => {
  it('inclut MODERATOR, BOT, SYSTEM mais pas AI', () => {
    expect(STAFF_SENDER_TYPES_FOR_NOTIFICATION).not.toContain('AI');
    expect(
      countStaffMessagesForNotification([
        { senderType: 'USER' },
        { senderType: 'BOT' },
        { senderType: 'AI' },
        { senderType: 'SYSTEM' },
        { senderType: 'MODERATOR' },
      ]),
    ).toBe(3);
  });
});

describe('shouldClearAwaitingStaffReply', () => {
  it('ignore le message SYSTEM ticket transmis', () => {
    expect(
      shouldClearAwaitingStaffReply({
        senderType: 'SYSTEM',
        content: '__i18n:chatWidget.responses.ticketTransmitted__',
      }),
    ).toBe(false);
  });

  it('accepte le message SYSTEM de fermeture de conversation', () => {
    expect(
      shouldClearAwaitingStaffReply({
        senderType: 'SYSTEM',
        content: '__i18n:moderation.conversation.system.closed__',
      }),
    ).toBe(true);
    expect(
      shouldClearAwaitingStaffReply({
        senderType: 'SYSTEM',
        content: '__i18n:moderation.conversation.system.autoClosed__',
      }),
    ).toBe(true);
  });

  it('accepte AI, BOT et MODERATOR', () => {
    expect(shouldClearAwaitingStaffReply({ senderType: 'AI' })).toBe(true);
    expect(shouldClearAwaitingStaffReply({ senderType: 'BOT' })).toBe(true);
    expect(shouldClearAwaitingStaffReply({ senderType: 'MODERATOR' })).toBe(true);
  });

  it('ignore USER et messages absents', () => {
    expect(shouldClearAwaitingStaffReply({ senderType: 'USER' })).toBe(false);
    expect(shouldClearAwaitingStaffReply(null)).toBe(false);
  });
});

describe('shouldClearAiTypingIndicator', () => {
  it('désactive quand une réponse non-user arrive après le message user', () => {
    expect(
      shouldClearAiTypingIndicator({
        isAiTyping: true,
        baseMessageCount: 2,
        messages: [
          { senderType: 'USER' },
          { senderType: 'BOT' },
          { senderType: 'USER' },
          { senderType: 'AI' },
        ],
      }),
    ).toBe(true);
  });

  it('reste actif si seul le message user est ajouté', () => {
    expect(
      shouldClearAiTypingIndicator({
        isAiTyping: true,
        baseMessageCount: 2,
        messages: [
          { senderType: 'USER' },
          { senderType: 'BOT' },
          { senderType: 'USER' },
        ],
      }),
    ).toBe(false);
  });

  it('ignore le message SYSTEM ticket transmis avant la réponse IA', () => {
    expect(
      shouldClearAiTypingIndicator({
        isAiTyping: true,
        baseMessageCount: 2,
        messages: [
          { senderType: 'USER' },
          { senderType: 'BOT' },
          { senderType: 'USER' },
          { senderType: 'SYSTEM' },
        ],
      }),
    ).toBe(false);
  });

  it('false si isAiTyping off ou messages vides', () => {
    expect(
      shouldClearAiTypingIndicator({
        isAiTyping: false,
        baseMessageCount: 1,
        messages: [{ senderType: 'AI' }],
      }),
    ).toBe(false);
    expect(
      shouldClearAiTypingIndicator({
        isAiTyping: true,
        baseMessageCount: 0,
        messages: [],
      }),
    ).toBe(false);
  });
});

describe('selectInitialConversationId', () => {
  it('préfère une conversation ACTIVE', () => {
    expect(
      selectInitialConversationId([
        { id: 'c1', status: 'CLOSED' },
        { id: 'c2', status: 'ACTIVE' },
      ]),
    ).toBe('c2');
  });

  it('retourne null si liste vide', () => {
    expect(selectInitialConversationId([])).toBeNull();
  });

  it('restaure storedId si valide', () => {
    expect(
      selectInitialConversationId(
        [{ id: 'c1', status: 'ACTIVE', lastMessageAt: '2026-01-01' }],
        'c1',
      ),
    ).toBe('c1');
  });

  it('trie par lastMessageAt si pas de ACTIVE', () => {
    expect(
      selectInitialConversationId([
        { id: 'c-old', status: 'CLOSED', lastMessageAt: '2026-01-01' },
        { id: 'c-new', status: 'CLOSED', lastMessageAt: '2026-06-01' },
      ]),
    ).toBe('c-new');
  });

  it('ignore storedId si DELETED', () => {
    expect(
      selectInitialConversationId(
        [{ id: 'c1', status: 'DELETED', lastMessageAt: '2026-01-01' }],
        'c1',
      ),
    ).toBeNull();
  });

  it('ignore storedId fermé si une conversation active existe', () => {
    expect(
      selectInitialConversationId(
        [
          { id: 'c-closed', status: 'CLOSED', lastMessageAt: '2026-06-01' },
          { id: 'c-active', status: 'ACTIVE', lastMessageAt: '2026-01-01' },
        ],
        'c-closed',
      ),
    ).toBe('c-active');
  });
});

describe('isValidModeratorRole / isStaffRole', () => {
  it('valide MODERATOR et ADMIN uniquement', () => {
    expect(isValidModeratorRole('MODERATOR')).toBe(true);
    expect(isValidModeratorRole('ADMIN')).toBe(true);
    expect(isValidModeratorRole('USER')).toBe(false);
    expect(isStaffRole('MODERATOR')).toBe(true);
    expect(isStaffRole('AFFILIATE')).toBe(false);
  });
});

describe('shouldRedactEmailsForViewer', () => {
  it('masque pour invité et user non-staff', () => {
    expect(shouldRedactEmailsForViewer({ identityKind: 'guest' })).toBe('guest');
    expect(
      shouldRedactEmailsForViewer({ identityKind: 'user', role: 'USER' }),
    ).toBe('non-staff-user');
    expect(
      shouldRedactEmailsForViewer({ identityKind: 'user', role: 'MODERATOR' }),
    ).toBe('staff');
  });
});

describe('canClientRateConversation', () => {
  it('autorise une note unique sur conversation clôturée ou archivée', () => {
    expect(canClientRateConversation('CLOSED', null)).toBe(true);
    expect(canClientRateConversation('ARCHIVED', null)).toBe(true);
    expect(canClientRateConversation('ACTIVE', null)).toBe(false);
    expect(canClientRateConversation('CLOSED', 4)).toBe(false);
  });
});

describe('canClientSubmitFeedback', () => {
  it('autorise un commentaire unique après notation sur conversation terminée', () => {
    expect(canClientSubmitFeedback('CLOSED', 3, null)).toBe(true);
    expect(canClientSubmitFeedback('ARCHIVED', 5, '')).toBe(true);
    expect(canClientSubmitFeedback('ACTIVE', 3, null)).toBe(false);
    expect(canClientSubmitFeedback('CLOSED', null, null)).toBe(false);
    expect(canClientSubmitFeedback('CLOSED', 4, 'Déjà commenté')).toBe(false);
  });
});

describe('computeAverageClientRating', () => {
  it('calcule la moyenne des notes valides', () => {
    expect(computeAverageClientRating([5, 4, null, 3])).toBe(4);
    expect(computeAverageClientRating([])).toBe(0);
  });
});
