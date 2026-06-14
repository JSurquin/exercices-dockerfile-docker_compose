import {
  buildConversationWhereClause,
  isTerminalConversationStatus,
  shouldInsertTicketTransmittedMessage,
} from '@/lib/chat-logic';

describe('isTerminalConversationStatus', () => {
  it.each([
    ['CLOSED', true],
    ['ARCHIVED', true],
    ['DELETED', true],
    ['ACTIVE', false],
    ['UNKNOWN', false],
  ])('statut %s → %s', (status, expected) => {
    expect(isTerminalConversationStatus(status)).toBe(expected);
  });
});

describe('buildConversationWhereClause — rôle AFFILIATE', () => {
  it('restreint aux conversations du user comme USER', () => {
    expect(
      buildConversationWhereClause({
        role: 'AFFILIATE',
        userId: 'aff-1',
        filters: {},
      }),
    ).toEqual({ userId: 'aff-1', status: { not: 'DELETED' } });
  });

  it('n expose pas userId filter aux affiliés', () => {
    expect(
      buildConversationWhereClause({
        role: 'AFFILIATE',
        userId: 'aff-1',
        filters: { userId: 'other' },
      }),
    ).toEqual({ userId: 'aff-1', status: { not: 'DELETED' } });
  });
});

describe('buildConversationWhereClause — combinaisons filtres admin', () => {
  it.each([
    [{ status: 'CLOSED' as const }, { status: 'CLOSED' }],
    [{ priority: 'URGENT' as const }, { status: { not: 'DELETED' }, priority: 'URGENT' }],
    [
      { category: 'payment', assignedTo: 'mod-1' },
      { status: { not: 'DELETED' }, category: 'payment', assignedTo: 'mod-1' },
    ],
  ])('admin filters=%j', (filters, expected) => {
    expect(
      buildConversationWhereClause({
        role: 'ADMIN',
        userId: 'admin',
        filters,
      }),
    ).toEqual(expected);
  });
});

describe('shouldInsertTicketTransmittedMessage — matrice', () => {
  const botMsg = { id: 'bot-1', senderType: 'BOT' };
  const userMsg = (id: string) => ({ id, senderType: 'USER' });

  it.each([
    [[botMsg, userMsg('u1')], 'u1', 'USER', true],
    [[botMsg, userMsg('u1'), userMsg('u2')], 'u2', 'USER', false],
    [[botMsg], 'u1', 'USER', true],
    [[userMsg('u1')], 'u1', 'USER', false],
    [[botMsg, userMsg('u1')], 'u1', 'BOT', false],
    [[botMsg, userMsg('u1')], 'u1', 'MODERATOR', false],
  ])(
    'messages=%j new=%s sender=%s → %s',
    (messages, newId, senderType, expected) => {
      expect(
        shouldInsertTicketTransmittedMessage(messages, newId, senderType),
      ).toBe(expected);
    },
  );
});

describe('buildConversationWhereClause — statut explicite modérateur', () => {
  it('remplace status not DELETED quand status filter présent', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { status: 'ACTIVE' },
      }),
    ).toEqual({ status: 'ACTIVE' });
  });

  it('assignedTo=me prime sur status par défaut', () => {
    expect(
      buildConversationWhereClause({
        role: 'MODERATOR',
        userId: 'mod-1',
        filters: { assignedTo: 'me', status: 'CLOSED' },
      }),
    ).toEqual({ assignedTo: 'mod-1', status: 'CLOSED' });
  });
});
