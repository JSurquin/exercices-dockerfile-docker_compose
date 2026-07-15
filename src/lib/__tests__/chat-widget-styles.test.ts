import {
  chatWidgetAiTypingBubbleClass,
  chatWidgetCategoryButtonClass,
  chatWidgetFabButtonClass,
  chatWidgetHeaderClass,
  chatWidgetMessageAlignment,
  chatWidgetMessageBubbleClass,
  chatWidgetMessageEnterClass,
  chatWidgetMessageGroupClass,
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
  resolveWidgetSenderDisplayName,
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
  it('USER : bulle plate accent à droite', () => {
    expect(chatWidgetMessageBubbleClass('USER')).toContain('chat-widget-bubble-user');
    expect(chatWidgetMessageBubbleClass('USER')).not.toContain('border');
    expect(chatWidgetMessageBubbleClass('USER')).not.toContain('chat-widget-bubble-chrome');
  });

  it('MODERATOR : bulle plate staff', () => {
    expect(chatWidgetMessageBubbleClass('MODERATOR')).toContain('chat-widget-bubble-staff');
  });

  it('AI : bulle plate accent', () => {
    const cls = chatWidgetMessageBubbleClass('AI');
    expect(cls).toContain('chat-widget-bubble-ai');
    expect(cls).not.toContain('bg-neutral-100');
  });

  it('SYSTEM : bulle plate atténuée', () => {
    const cls = chatWidgetMessageBubbleClass('SYSTEM');
    expect(cls).toContain('chat-widget-bubble-staff');
    expect(cls).toContain('text-xs');
    expect(cls).toContain('opacity-90');
  });

  it('BOT : bulle plate staff', () => {
    expect(chatWidgetMessageBubbleClass('BOT')).toContain('chat-widget-bubble-staff');
  });

  it('fallback pour type inconnu', () => {
    expect(chatWidgetMessageBubbleClass('UNKNOWN')).toContain('chat-widget-bubble-staff');
  });
});

describe('chatWidgetSenderLabelClass', () => {
  it('aligne le label selon le viewer', () => {
    expect(chatWidgetSenderLabelClass(true)).toContain('text-right');
    expect(chatWidgetSenderLabelClass(false)).toContain('text-left');
    expect(chatWidgetSenderLabelClass(false)).toContain('text-theme-highlight');
  });
});

describe('resolveWidgetSenderDisplayName', () => {
  const labels = {
    aiAgentLabel: 'Moony IA agent',
    supportLabel: 'MoonSkin Support',
    moderatorLabel: 'Modérateur',
    guestUserLabel: 'Vous',
    adminLabel: 'L\'admin',
  };

  it('retourne Moony pour l\'IA', () => {
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'AI',
        isFromViewer: false,
        labels,
      }),
    ).toBe('Moony IA agent');
  });

  it('retourne le support pour BOT', () => {
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'BOT',
        isFromViewer: false,
        labels,
      }),
    ).toBe('MoonSkin Support');
  });

  it('retourne le nom du modérateur ou L\'admin', () => {
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'MODERATOR',
        isFromViewer: false,
        messageUser: { steamUsername: 'Nyouz', role: 'MODERATOR' },
        labels,
      }),
    ).toBe('Nyouz');
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'MODERATOR',
        isFromViewer: false,
        messageUser: { name: 'Admin', role: 'ADMIN' },
        labels,
      }),
    ).toBe('L\'admin');
  });

  it('retourne le pseudo utilisateur ou Vous', () => {
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'USER',
        isFromViewer: true,
        viewerUsername: 'Player42',
        labels,
      }),
    ).toBe('Player42');
    expect(
      resolveWidgetSenderDisplayName({
        senderType: 'USER',
        isFromViewer: true,
        labels,
      }),
    ).toBe('Vous');
  });
});

describe('chatWidgetTimestampClass', () => {
  it('utilise une couleur atténuée uniforme', () => {
    expect(chatWidgetTimestampClass('USER')).toContain('text-muted-foreground');
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
    expect(open).toContain('sm:h-[clamp(540px,82dvh,700px)]');
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
    expect(chatWidgetAiTypingBubbleClass()).toContain('chat-widget-bubble-ai');
    expect(chatWidgetAiTypingBubbleClass()).toContain('rounded-[22px]');
  });

  it('groupe message aligne label et bulle', () => {
    expect(chatWidgetMessageGroupClass(true)).toContain('items-end');
    expect(chatWidgetMessageGroupClass(false)).toContain('items-start');
  });

  it('barre d’onglets en ligne avec boutons de taille égale', () => {
    expect(chatWidgetTabBarClass()).toContain('flex');
    expect(chatWidgetTabBarClass()).toContain('flex-row');
    expect(chatWidgetTabButtonClass(true)).toContain('flex-1');
    expect(chatWidgetTabButtonClass(false)).toContain('min-h-[48px]');
  });

  it('ligne historique résolue : survol gris clair animé', () => {
    const cls = chatWidgetHistoryItemClass({ solved: true, isSelected: false });
    expect(cls).toContain('hover:bg-muted/50');
    expect(cls).toContain('transition-all');
    expect(cls).toContain('duration-200');
    expect(cls).not.toContain('opacity-60');
  });

  it('ligne historique active : sélection neutre + survol gris', () => {
    const selected = chatWidgetHistoryItemClass({ solved: false, isSelected: true });
    expect(selected).toContain('bg-muted/40');
    const idle = chatWidgetHistoryItemClass({ solved: false, isSelected: false });
    expect(idle).toContain('hover:bg-muted/50');
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
