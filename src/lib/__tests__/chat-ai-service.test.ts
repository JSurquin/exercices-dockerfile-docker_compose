import { shouldAiReplyToConversation } from '@/lib/chat-ai-guards';

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
