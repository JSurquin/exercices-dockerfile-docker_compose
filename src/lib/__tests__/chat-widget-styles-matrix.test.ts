import {
  chatWidgetAiTypingBubbleClass,
  chatWidgetCategoryButtonClass,
  chatWidgetFabButtonClass,
  chatWidgetHeaderClass,
  chatWidgetMessageAlignment,
  chatWidgetMessageBubbleClass,
  chatWidgetMessageEnterClass,
  chatWidgetPopupContainerClass,
  chatWidgetSendButtonClass,
  chatWidgetSenderLabelClass,
  chatWidgetSubcategoryButtonClass,
  chatWidgetTabBarClass,
  chatWidgetTabButtonClass,
  chatWidgetTextareaClass,
  chatWidgetTimestampClass,
  chatWidgetUnreadBadgeClass,
  chatWidgetInputAreaClass,
  chatWidgetHistoryItemClass,
  chatWidgetHistoryListClass,
} from '@/lib/chat-widget-styles';

const SENDER_TYPES = ['USER', 'BOT', 'MODERATOR', 'AI', 'SYSTEM', 'UNKNOWN'] as const;

describe('chatWidgetMessageBubbleClass — tous les types', () => {
  it.each(SENDER_TYPES)('retourne des classes pour %s', (type) => {
    const cls = chatWidgetMessageBubbleClass(type);
    expect(cls.length).toBeGreaterThan(10);
    expect(cls).toContain('rounded');
  });
});

describe('chatWidgetMessageAlignment — viewer vs staff', () => {
  it('viewer aligné à droite', () => {
    expect(chatWidgetMessageAlignment(true)).toContain('justify-end');
  });

  it('staff aligné à gauche', () => {
    expect(chatWidgetMessageAlignment(false)).toContain('justify-start');
  });
});

describe('chatWidgetSenderLabelClass — tous les types', () => {
  it.each(SENDER_TYPES)('gère %s', (type) => {
    expect(chatWidgetSenderLabelClass(type)).toBeNull();
  });
});

describe('chatWidgetMessageEnterClass', () => {
  it('anime les nouveaux messages', () => {
    expect(chatWidgetMessageEnterClass(true)).toBe('message-slide-in');
  });

  it('n anime pas les messages existants', () => {
    expect(chatWidgetMessageEnterClass(false)).toBe('');
  });
});

describe('Design tokens widget — classes non vides', () => {
  it.each([
    ['header', chatWidgetHeaderClass()],
    ['fab', chatWidgetFabButtonClass()],
    ['popup', chatWidgetPopupContainerClass(true)],
    ['tabBar', chatWidgetTabBarClass()],
    ['tabButton active', chatWidgetTabButtonClass(true)],
    ['tabButton inactive', chatWidgetTabButtonClass(false)],
    ['category', chatWidgetCategoryButtonClass()],
    ['subcategory', chatWidgetSubcategoryButtonClass(false)],
    ['textarea', chatWidgetTextareaClass()],
    ['send', chatWidgetSendButtonClass()],
    ['timestamp', chatWidgetTimestampClass('USER')],
    ['unreadBadge', chatWidgetUnreadBadgeClass()],
    ['aiTyping', chatWidgetAiTypingBubbleClass()],
    ['inputArea', chatWidgetInputAreaClass()],
    ['historyItem solved', chatWidgetHistoryItemClass({ solved: true, isSelected: false })],
    ['historyItem active', chatWidgetHistoryItemClass({ solved: false, isSelected: true })],
    ['historyList', chatWidgetHistoryListClass()],
  ] as const)('%s a des classes tailwind', (_name, cls) => {
    expect(cls.length).toBeGreaterThan(5);
  });
});

describe('chatWidgetTabButtonClass — états', () => {
  it('diffère actif vs inactif', () => {
    expect(chatWidgetTabButtonClass(true)).not.toBe(chatWidgetTabButtonClass(false));
  });
});
