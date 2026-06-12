import {
  chatWidgetAiTypingBubbleClass,
  chatWidgetCategoryButtonClass,
  chatWidgetFabButtonClass,
  chatWidgetHeaderClass,
  chatWidgetMessageAlignment,
  chatWidgetMessageBubbleClass,
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
  isWidgetMessageFromViewer,
  shouldShowWidgetAiTyping,
  shouldShowWidgetUnreadBadge,
} from '@/lib/chat-widget-styles';

describe('isWidgetMessageFromViewer', () => {
  it('identifie un message USER du viewer connecté', () => {
    expect(isWidgetMessageFromViewer('USER', 'u1', 'u1')).toBe(true);
  });

  it('exclut les messages USER des autres et les invités (userId null)', () => {
    expect(isWidgetMessageFromViewer('USER', 'u2', 'u1')).toBe(false);
    expect(isWidgetMessageFromViewer('USER', null, undefined)).toBe(false);
  });

  it('exclut les messages non-USER', () => {
    expect(isWidgetMessageFromViewer('BOT', 'u1', 'u1')).toBe(false);
  });
});

describe('chatWidgetMessageBubbleClass — design tokens', () => {
  it('USER : gradient CTA à droite', () => {
    expect(chatWidgetMessageBubbleClass('USER')).toContain('bg-cta-gradient');
    expect(chatWidgetMessageBubbleClass('USER')).toContain('rounded-tr-sm');
  });

  it('MODERATOR : bleu', () => {
    expect(chatWidgetMessageBubbleClass('MODERATOR')).toContain('bg-blue-500');
  });

  it('AI : thème violet (dark mode inclus)', () => {
    const cls = chatWidgetMessageBubbleClass('AI');
    expect(cls).toContain('bg-violet-50');
    expect(cls).toContain('dark:bg-violet-950/40');
    expect(cls).toContain('border-violet-200');
  });

  it('SYSTEM : thème emerald', () => {
    const cls = chatWidgetMessageBubbleClass('SYSTEM');
    expect(cls).toContain('bg-emerald-50');
    expect(cls).toContain('text-emerald-800');
  });

  it('BOT : muted neutre', () => {
    expect(chatWidgetMessageBubbleClass('BOT')).toContain('bg-muted');
  });

  it('fallback pour type inconnu', () => {
    expect(chatWidgetMessageBubbleClass('UNKNOWN')).toContain('bg-muted');
  });
});

describe('chatWidgetSenderLabelClass', () => {
  it('retourne des badges pour MODERATOR, BOT, AI uniquement', () => {
    expect(chatWidgetSenderLabelClass('MODERATOR')).toContain('bg-white/20');
    expect(chatWidgetSenderLabelClass('BOT')).toContain('text-muted-foreground');
    expect(chatWidgetSenderLabelClass('AI')).toContain('text-violet-600');
    expect(chatWidgetSenderLabelClass('USER')).toBeNull();
    expect(chatWidgetSenderLabelClass('SYSTEM')).toBeNull();
  });
});

describe('chatWidgetTimestampClass', () => {
  it('adapte la couleur au type d’expéditeur', () => {
    expect(chatWidgetTimestampClass('USER')).toContain('text-white/70');
    expect(chatWidgetTimestampClass('SYSTEM')).toContain('text-emerald-600');
    expect(chatWidgetTimestampClass('AI')).toContain('text-violet-500');
    expect(chatWidgetTimestampClass('BOT')).toContain('text-muted-foreground');
  });
});

describe('chatWidgetPopupContainerClass', () => {
  it('ouvert : visible + chat-glass', () => {
    const open = chatWidgetPopupContainerClass(true);
    expect(open).toContain('chat-glass');
    expect(open).toContain('opacity-100');
    expect(open).toContain('sm:w-[390px]');
  });

  it('fermé : invisible + pointer-events-none', () => {
    const closed = chatWidgetPopupContainerClass(false);
    expect(closed).toContain('opacity-0');
    expect(closed).toContain('pointer-events-none');
  });
});

describe('layout & interaction classes', () => {
  it('header gradient CTA', () => {
    expect(chatWidgetHeaderClass()).toContain('bg-cta-gradient');
  });

  it('boutons catégorie avec hover theme-accent', () => {
    expect(chatWidgetCategoryButtonClass()).toContain('hover:border-theme-accent/30');
  });

  it('sous-catégorie disabled atténue l’opacité', () => {
    expect(chatWidgetSubcategoryButtonClass(true)).toContain('disabled:opacity-60');
    expect(chatWidgetSubcategoryButtonClass(false)).not.toContain('disabled:opacity-60');
  });

  it('FAB rond avec scale hover', () => {
    expect(chatWidgetFabButtonClass()).toContain('rounded-full');
    expect(chatWidgetFabButtonClass()).toContain('hover:scale-110');
  });

  it('badge unread rouge pulsant', () => {
    expect(chatWidgetUnreadBadgeClass()).toContain('bg-red-500');
    expect(chatWidgetUnreadBadgeClass()).toContain('animate-pulse');
  });

  it('textarea utilise text-base pour éviter le zoom iOS', () => {
    expect(chatWidgetTextareaClass()).toContain('text-base');
  });

  it('zone saisie et bouton envoi', () => {
    expect(chatWidgetInputAreaClass()).toContain('border-t');
    expect(chatWidgetTextareaClass()).toContain('focus:ring-primary');
    expect(chatWidgetSendButtonClass()).toContain('bg-cta-gradient');
  });

  it('bulle AI typing cohérente avec messages AI', () => {
    expect(chatWidgetAiTypingBubbleClass()).toContain('border-violet-200');
  });

  it('barre d’onglets en ligne avec boutons de taille égale', () => {
    expect(chatWidgetTabBarClass()).toContain('flex');
    expect(chatWidgetTabBarClass()).toContain('flex-row');
    expect(chatWidgetTabButtonClass(true)).toContain('flex-1');
    expect(chatWidgetTabButtonClass(false)).toContain('min-h-[48px]');
  });
});

describe('chatWidgetMessageAlignment', () => {
  it('viewer à droite, staff à gauche', () => {
    expect(chatWidgetMessageAlignment(true)).toBe('justify-end');
    expect(chatWidgetMessageAlignment(false)).toBe('justify-start');
  });
});

describe('shouldShowWidgetUnreadBadge', () => {
  it('affiche le badge si unread et fermé', () => {
    expect(shouldShowWidgetUnreadBadge(3, false)).toBe(true);
    expect(shouldShowWidgetUnreadBadge(3, true)).toBe(false);
    expect(shouldShowWidgetUnreadBadge(0, false)).toBe(false);
  });
});

describe('shouldShowWidgetAiTyping', () => {
  it('affiche l’indicateur IA après envoi user', () => {
    expect(
      shouldShowWidgetAiTyping({
        isAiTyping: true,
        isLoading: false,
        messageCount: 4,
        baseMessageCount: 3,
      }),
    ).toBe(true);
  });

  it('masque pendant loading ou si pas de nouveau message', () => {
    expect(
      shouldShowWidgetAiTyping({
        isAiTyping: true,
        isLoading: true,
        messageCount: 4,
        baseMessageCount: 3,
      }),
    ).toBe(false);
  });
});
