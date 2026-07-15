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
  chatWidgetHistoryItemTitleClass,
  chatWidgetHistoryListClass,
  isWidgetMessageFromViewer,
  preserveChatLineBreaks,
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
  it('USER : bulle sombre à droite', () => {
    expect(chatWidgetMessageBubbleClass('USER')).toContain('bg-neutral-900');
    expect(chatWidgetMessageBubbleClass('USER')).toContain('text-white');
  });

  it('MODERATOR : gris clair', () => {
    expect(chatWidgetMessageBubbleClass('MODERATOR')).toContain('bg-muted/90');
  });

  it('AI : même style que staff (gris clair)', () => {
    const cls = chatWidgetMessageBubbleClass('AI');
    expect(cls).toContain('bg-muted/90');
    expect(cls).toContain('border-border/40');
  });

  it('SYSTEM : bandeau muted', () => {
    const cls = chatWidgetMessageBubbleClass('SYSTEM');
    expect(cls).toContain('bg-muted/70');
    expect(cls).toContain('text-muted-foreground');
  });

  it('BOT : gris clair neutre', () => {
    expect(chatWidgetMessageBubbleClass('BOT')).toContain('bg-muted/90');
  });

  it('fallback pour type inconnu', () => {
    expect(chatWidgetMessageBubbleClass('UNKNOWN')).toContain('bg-muted/90');
  });
});

describe('chatWidgetSenderLabelClass', () => {
  it('n’affiche plus de badges expéditeur (style Intercom)', () => {
    expect(chatWidgetSenderLabelClass('MODERATOR')).toBeNull();
    expect(chatWidgetSenderLabelClass('BOT')).toBeNull();
    expect(chatWidgetSenderLabelClass('AI')).toBeNull();
    expect(chatWidgetSenderLabelClass('USER')).toBeNull();
  });
});

describe('chatWidgetTimestampClass', () => {
  it('adapte la couleur au type d’expéditeur', () => {
    expect(chatWidgetTimestampClass('USER')).toContain('text-white/60');
    expect(chatWidgetTimestampClass('SYSTEM')).toContain('text-muted-foreground');
    expect(chatWidgetTimestampClass('AI')).toContain('text-muted-foreground');
    expect(chatWidgetTimestampClass('BOT')).toContain('text-muted-foreground');
  });
});

describe('chatWidgetPopupContainerClass', () => {
  it('ouvert : visible + chat-glass + pleine hauteur mobile', () => {
    const open = chatWidgetPopupContainerClass(true);
    expect(open).toContain('fixed');
    expect(open).not.toContain('absolute');
    expect(open).toContain('chat-glass');
    expect(open).toContain('opacity-100');
    expect(open).toContain('sm:w-[390px]');
    expect(open).toContain('top-[env(safe-area-inset-top,0px)]');
    expect(open).toContain('bottom-0');
    expect(open).toContain('sm:h-[clamp(480px,75dvh,640px)]');
  });

  it('fermé : invisible + pointer-events-none + marge FAB mobile', () => {
    const closed = chatWidgetPopupContainerClass(false);
    expect(closed).toContain('opacity-0');
    expect(closed).toContain('pointer-events-none');
    expect(closed).toContain('bottom-24');
    expect(closed).toContain('sm:bottom-24');
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

  it('badge unread rouge', () => {
    expect(chatWidgetUnreadBadgeClass()).toContain('bg-red-500');
  });

  it('textarea utilise text-base pour éviter le zoom iOS', () => {
    expect(chatWidgetTextareaClass()).toContain('text-base');
  });

  it('textarea masque la barre de défilement native', () => {
    expect(chatWidgetTextareaClass()).toContain('scrollbar-none');
    expect(chatWidgetTextareaClass()).toContain('overflow-y-auto');
  });

  it('zone saisie et bouton envoi', () => {
    expect(chatWidgetInputAreaClass()).toContain('border-t');
    expect(chatWidgetTextareaClass()).toContain('focus:ring-primary');
    expect(chatWidgetSendButtonClass()).toContain('bg-neutral-900');
  });

  it('bulle AI typing cohérente avec messages staff', () => {
    expect(chatWidgetAiTypingBubbleClass()).toContain('border-border/40');
  });

  it('barre d’onglets en ligne avec boutons de taille égale', () => {
    expect(chatWidgetTabBarClass()).toContain('flex');
    expect(chatWidgetTabBarClass()).toContain('flex-row');
    expect(chatWidgetTabButtonClass(true)).toContain('flex-1');
    expect(chatWidgetTabButtonClass(false)).toContain('min-h-[48px]');
  });

  it('ligne historique résolue : survol gris clair animé', () => {
    const cls = chatWidgetHistoryItemClass({ solved: true, isSelected: false });
    expect(cls).toContain('hover:bg-muted/55');
    expect(cls).toContain('transition-all');
    expect(cls).toContain('duration-200');
    expect(cls).not.toContain('opacity-60');
  });

  it('ligne historique active : sélection neutre + survol gris', () => {
    const selected = chatWidgetHistoryItemClass({ solved: false, isSelected: true });
    expect(selected).toContain('bg-muted/45');
    const idle = chatWidgetHistoryItemClass({ solved: false, isSelected: false });
    expect(idle).toContain('hover:bg-muted/55');
  });

  it('titre historique résolu s’éclaircit au survol', () => {
    expect(chatWidgetHistoryItemTitleClass(true)).toContain('group-hover:text-foreground/80');
    expect(chatWidgetHistoryItemTitleClass(false)).toContain('text-foreground');
  });

  it('liste historique plate avec séparateurs', () => {
    expect(chatWidgetHistoryListClass()).toContain('divide-y');
    expect(chatWidgetHistoryListClass()).toContain('overflow-y-auto');
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
  it('affiche l’indicateur dès que l’IA est en cours', () => {
    expect(
      shouldShowWidgetAiTyping({
        isAiTyping: true,
        isSending: false,
      }),
    ).toBe(true);
  });

  it('masque pendant l’envoi du message utilisateur', () => {
    expect(
      shouldShowWidgetAiTyping({
        isAiTyping: true,
        isSending: true,
      }),
    ).toBe(false);
    expect(
      shouldShowWidgetAiTyping({
        isAiTyping: false,
        isSending: false,
      }),
    ).toBe(false);
  });
});

describe('preserveChatLineBreaks', () => {
  it('convertit les sauts de ligne simples en hard breaks Markdown', () => {
    expect(preserveChatLineBreaks('ligne 1\nligne 2')).toBe('ligne 1  \nligne 2');
  });

  it('laisse les paragraphes (double saut de ligne) inchangés', () => {
    expect(preserveChatLineBreaks('para 1\n\npara 2')).toBe('para 1\n\npara 2');
  });
});

describe('chatWidgetMessageEnterClass', () => {
  it('anime uniquement les nouveaux messages', () => {
    expect(chatWidgetMessageEnterClass(true)).toBe('message-slide-in');
    expect(chatWidgetMessageEnterClass(false)).toBe('');
  });
});
