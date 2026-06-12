import {
  redactEmailsForNonStaffViewer,
  redactEmailsInConversationForGuest,
} from '@/lib/chat-response-redact';

const sampleConversation = () => ({
  id: 'conv-1',
  user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
  assignedModerator: { id: 'm1', name: 'Mod', email: 'mod@test.com' },
  messages: [
    {
      id: 'msg-1',
      userId: 'u1',
      senderType: 'USER',
      user: { id: 'u1', email: 'alice@test.com' },
    },
    {
      id: 'msg-2',
      userId: 'm1',
      senderType: 'MODERATOR',
      user: { id: 'm1', email: 'mod@test.com' },
    },
  ],
});

describe('redactEmailsInConversationForGuest', () => {
  it('masque tous les emails (user, modérateur, auteurs de messages)', () => {
    const result = redactEmailsInConversationForGuest(sampleConversation());

    expect((result.user as { email: null }).email).toBeNull();
    expect((result.assignedModerator as { email: null }).email).toBeNull();
    const msgs = result.messages as Array<{ user?: { email: null } }>;
    expect(msgs[0].user?.email).toBeNull();
    expect(msgs[1].user?.email).toBeNull();
  });

  it('ne mute pas la conversation sans user', () => {
    const conv = { id: 'c', messages: [] };
    const result = redactEmailsInConversationForGuest(conv);
    expect(result.id).toBe('c');
  });

  it('conserve user non-objet tel quel', () => {
    const conv = { id: 'c', user: 'legacy-string' };
    const result = redactEmailsInConversationForGuest(conv);
    expect(result.user).toBe('legacy-string');
  });

  it('conserve les messages sans objet user', () => {
    const conv = {
      id: 'c',
      messages: [{ id: 'm1', content: 'hello' }, null],
    };
    const result = redactEmailsInConversationForGuest(conv);
    expect((result.messages as unknown[])[0]).toEqual({ id: 'm1', content: 'hello' });
    expect((result.messages as unknown[])[1]).toBeNull();
  });
});

describe('redactEmailsForNonStaffViewer', () => {
  it('masque le modérateur assigné et les messages staff', () => {
    const result = redactEmailsForNonStaffViewer(sampleConversation(), 'u1');

    expect((result.assignedModerator as { email: null }).email).toBeNull();
    const msgs = result.messages as Array<{ user?: { email: string | null } }>;
    expect(msgs[0].user?.email).toBe('alice@test.com');
    expect(msgs[1].user?.email).toBeNull();
  });

  it('masque les messages d’un autre utilisateur que le visiteur', () => {
    const conv = {
      messages: [
        {
          senderType: 'USER',
          userId: 'other',
          user: { email: 'other@test.com' },
        },
      ],
    };
    const result = redactEmailsForNonStaffViewer(conv, 'viewer');
    const msgs = result.messages as Array<{ user?: { email: null } }>;
    expect(msgs[0].user?.email).toBeNull();
  });

  it('ignore les entrées messages invalides', () => {
    const conv = { messages: [null, 'bad'] };
    const result = redactEmailsForNonStaffViewer(conv, 'viewer');
    expect(result.messages).toEqual([null, 'bad']);
  });
});
