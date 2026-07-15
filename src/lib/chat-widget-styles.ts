import type { SenderType } from '@prisma/client';
import {
  CONVERSATION_AUTO_CLOSED_I18N_KEY,
  CONVERSATION_CLOSED_I18N_KEY,
  TICKET_TRANSMITTED_I18N_KEY,
} from '@/lib/chat-logic';

export type WidgetSenderType = SenderType | 'UNKNOWN';

export type WidgetSystemMessageVariant = 'banner' | 'join' | 'closed' | 'default';

/** Bulle utilisateur connecté vs invité (userId null). */
export function isWidgetMessageFromViewer(
  senderType: string,
  messageUserId: string | null | undefined,
  viewerUserId: string | undefined,
): boolean {
  return senderType === 'USER' && messageUserId === viewerUserId;
}

export function chatWidgetMessageAlignment(isFromViewer: boolean): string {
  return isFromViewer ? 'justify-end' : 'justify-start';
}

/** Variante d’affichage pour les messages SYSTEM (style messagerie type Intercom). */
export function resolveWidgetSystemMessageVariant(content: string): WidgetSystemMessageVariant {
  if (content === TICKET_TRANSMITTED_I18N_KEY) return 'banner';
  if (content === CONVERSATION_CLOSED_I18N_KEY) return 'closed';
  if (content === CONVERSATION_AUTO_CLOSED_I18N_KEY) return 'closed';
  if (/^__i18n:moderation\.conversation\.system\.assigned/.test(content)) return 'join';
  return 'default';
}

const CHAT_WIDGET_BUBBLE_CHROME_BASE =
  'w-full rounded-[22px] px-4 py-2.5 text-sm leading-relaxed border chat-widget-bubble-chrome';

/** Classes Tailwind des bulles de message — bleu chromé (lisible sur fond sombre). */
export function chatWidgetMessageBubbleClass(senderType: WidgetSenderType): string {
  switch (senderType) {
    case 'USER':
      return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-user text-foreground`;
    case 'AI':
      return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-ai text-foreground`;
    case 'MODERATOR':
    case 'BOT':
      return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-staff text-foreground`;
    case 'SYSTEM':
      return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-staff text-muted-foreground rounded-2xl text-xs`;
    default:
      return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-staff text-foreground`;
  }
}

export function chatWidgetMessageGroupClass(isFromViewer: boolean): string {
  const align = isFromViewer ? 'items-end' : 'items-start';
  return `flex flex-col max-w-[85%] ${align}`;
}

export function chatWidgetSystemBannerClass(): string {
  return 'w-full rounded-[22px] bg-neutral-100 dark:bg-neutral-800 px-4 py-3 text-sm text-foreground leading-relaxed';
}

export function chatWidgetSystemJoinClass(): string {
  return 'flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground';
}

export function chatWidgetRatingBoxClass(): string {
  return 'mx-auto w-full max-w-[300px] rounded-2xl border border-border/50 bg-background px-5 py-5 text-center';
}

export function chatWidgetRatingEmojiClass(isSelected: boolean, isHovered: boolean): string {
  const base =
    'text-2xl sm:text-3xl p-1.5 rounded-full transition-transform duration-150 cursor-pointer select-none';
  if (isSelected) return `${base} scale-110 bg-theme-accent/15 ring-2 ring-theme-accent/40`;
  if (isHovered) return `${base} scale-105 bg-muted/80`;
  return `${base} hover:scale-105 hover:bg-muted/60`;
}

export function chatWidgetConversationEndedClass(): string {
  return 'flex-shrink-0 border-t bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground';
}

export function chatWidgetConversationHeaderClass(): string {
  return 'flex items-center justify-between p-3 border-b bg-background flex-shrink-0';
}

export function chatWidgetSenderLabelClass(isFromViewer: boolean): string {
  const align = isFromViewer ? 'text-right' : 'text-left';
  return `text-[11px] font-semibold mb-1 px-0.5 text-theme-highlight/90 ${align}`;
}

export interface WidgetSenderNameLabels {
  aiAgentLabel: string;
  supportLabel: string;
  moderatorLabel: string;
  guestUserLabel: string;
  adminLabel: string;
}

export interface WidgetSenderNameContext {
  senderType: WidgetSenderType;
  isFromViewer: boolean;
  messageUser?: {
    name?: string | null;
    steamUsername?: string | null;
    role?: string | null;
  } | null;
  assignedModerator?: {
    name?: string | null;
    steamUsername?: string | null;
  } | null;
  viewerUsername?: string;
  labels: WidgetSenderNameLabels;
}

/** Nom affiché au-dessus de chaque bulle (Moony, modérateur, utilisateur, etc.). */
export function resolveWidgetSenderDisplayName(ctx: WidgetSenderNameContext): string | null {
  const { senderType, isFromViewer, messageUser, assignedModerator, viewerUsername, labels } = ctx;

  switch (senderType) {
    case 'AI':
      return labels.aiAgentLabel;
    case 'BOT':
      return labels.supportLabel;
    case 'MODERATOR': {
      if (messageUser?.role === 'ADMIN') return labels.adminLabel;
      return (
        messageUser?.steamUsername ??
        messageUser?.name ??
        assignedModerator?.steamUsername ??
        assignedModerator?.name ??
        labels.moderatorLabel
      );
    }
    case 'USER':
      if (isFromViewer) return viewerUsername ?? labels.guestUserLabel;
      return messageUser?.steamUsername ?? messageUser?.name ?? labels.guestUserLabel;
    default:
      return null;
  }
}

export function chatWidgetTimestampClass(_senderType: WidgetSenderType): string {
  return 'text-muted-foreground/70';
}

/** Horodatage affiché dans les bulles du widget (style Intercom : masqué). */
export function shouldShowWidgetMessageTimestamp(): boolean {
  return false;
}

/** Durée de fermeture du popup (alignée sur transition CSS + démontage React). */
export const CHAT_WIDGET_POPUP_CLOSE_MS = 150;

/** Classe appliquée sur body quand le popup chat est ouvert (bloque le scroll page). */
export const CHAT_WIDGET_BODY_SCROLL_LOCK_CLASS = 'chat-widget-scroll-lock';

/** Bloque le scroll de la page via overflow hidden sur body. */
export function setChatWidgetBodyScrollLock(locked: boolean): void {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(CHAT_WIDGET_BODY_SCROLL_LOCK_CLASS, locked);
}

export function chatWidgetScrollAreaClass(extra = ''): string {
  return `flex-1 min-h-0 overflow-y-auto overscroll-y-contain ${extra}`.trim();
}

export function chatWidgetPopupContainerClass(isOpen: boolean): string {
  const mobileBottom = isOpen ? 'bottom-0' : 'bottom-24';
  const desktopBottom = isOpen ? 'sm:bottom-6' : 'sm:bottom-24';
  const base = `
    fixed top-[env(safe-area-inset-top,0px)] ${mobileBottom} ${desktopBottom} left-0 right-0
    max-sm:h-[calc(100dvh-env(safe-area-inset-top,0px))]
    sm:top-auto sm:left-auto sm:right-6 sm:w-[390px] sm:h-[clamp(480px,75dvh,640px)]
    chat-glass rounded-none sm:rounded-2xl shadow-2xl z-[9999]
    flex flex-col overflow-hidden overscroll-contain
    transition-opacity duration-150 ease-out
    pointer-events-auto
  `;
  return isOpen
    ? `${base} opacity-100`
    : `${base} opacity-0 pointer-events-none`;
}

export function chatWidgetHeaderClass(): string {
  return 'flex items-center justify-between p-4 bg-cta-gradient text-white flex-shrink-0';
}

/** En-tête sombre de l’onglet Accueil (style Intercom / CSGO Empire). */
export function chatWidgetHomeHeaderClass(): string {
  return 'relative flex-shrink-0 overflow-hidden bg-neutral-950 text-white px-4 pt-4 pb-6';
}

export function chatWidgetHomeBodyClass(): string {
  return 'flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pt-2 pb-4 space-y-3';
}

export function chatWidgetHomeCardClass(): string {
  return 'w-full rounded-2xl border-0 bg-white dark:bg-neutral-900/80 shadow-sm p-4 text-left';
}

export function chatWidgetHomeCardInnerButtonClass(): string {
  return 'w-full text-left rounded-xl transition-colors duration-150 hover:bg-muted/50 dark:hover:bg-white/5 px-1 -mx-1 py-0.5';
}

export function chatWidgetHomeCardSectionTitleClass(): string {
  return 'text-xs font-semibold text-foreground mb-3';
}

export function chatWidgetHomeHelpLinkClass(): string {
  return 'w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg text-left text-sm text-foreground/90 hover:text-foreground hover:bg-muted/55 dark:hover:bg-white/10 active:bg-muted/70 dark:active:bg-white/15 transition-all duration-150 cursor-pointer group border-b border-border/40 last:border-b-0';
}

export function chatWidgetHomeSearchHeaderClass(): string {
  return 'flex items-center justify-between pb-3 mb-1 border-b border-border/40 rounded-lg px-2 -mx-2 transition-all duration-150 hover:bg-muted/55 dark:hover:bg-white/10 active:bg-muted/70 dark:active:bg-white/15 cursor-pointer';
}

/** En-tête compact pour onglet Aide. */
export function chatWidgetPanelHeaderClass(): string {
  return 'relative flex-shrink-0 overflow-hidden bg-neutral-950 text-white px-4 py-3';
}

/** En-tête léger pour la liste Messages (sans bandeau sombre). */
export function chatWidgetListHeaderClass(): string {
  return 'flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40 bg-background flex-shrink-0';
}

export function chatWidgetPanelHeaderTitleClass(): string {
  return 'text-lg font-bold leading-tight';
}

export function chatWidgetPanelHeaderSubtitleClass(): string {
  return 'text-sm text-white/75 mt-0.5';
}

/** Icône catégorie Aide avec lueur bleue theme-accent. */
export function chatWidgetHelpCategoryIconClass(): string {
  return 'h-5 w-5 shrink-0 text-theme-accent chat-widget-help-icon-glow';
}

export function chatWidgetHelpCategoryRowClass(): string {
  return 'w-full flex items-center justify-between gap-3 py-3 px-2 -mx-2 rounded-lg text-left transition-all duration-150 hover:bg-muted/55 dark:hover:bg-white/10 active:bg-muted/70 dark:active:bg-white/15 cursor-pointer group border-b border-border/40 last:border-b-0';
}

export function chatWidgetHelpSubcategoryRowClass(disabled: boolean): string {
  const base = chatWidgetHelpCategoryRowClass();
  return disabled ? `${base} disabled:opacity-60 cursor-not-allowed` : base;
}

export function chatWidgetConversationScrollClass(extra = ''): string {
  return chatWidgetScrollAreaClass(
    `bg-background px-4 py-4 space-y-2.5 ${extra}`.trim(),
  );
}

export function chatWidgetMessagesListBodyClass(): string {
  return 'flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pt-1 pb-2';
}

export function chatWidgetMessagesListContainerClass(): string {
  return 'flex-1 min-h-0 flex flex-col';
}

export function chatWidgetMessagesListFooterClass(): string {
  return 'flex-shrink-0 px-4 pt-2 pb-3 border-t border-border/30 bg-background';
}

export function chatWidgetAskQuestionButtonClass(): string {
  return 'w-full flex items-center justify-center gap-2.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-950 py-3 px-5 text-sm font-semibold shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-900 active:scale-[0.98] transition-all duration-150';
}

export function chatWidgetAskQuestionIconClass(): string {
  return 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold';
}

export function chatWidgetHistoryItemPreviewClass(solved: boolean): string {
  const tone = solved ? 'text-muted-foreground/75' : 'text-muted-foreground';
  return `text-xs ${tone} line-clamp-1 mt-0.5 leading-snug`;
}

export function chatWidgetHistoryUnreadDotClass(): string {
  return 'h-2 w-2 shrink-0 rounded-full bg-red-500';
}

export function chatWidgetHistoryCardClass(): string {
  return `${chatWidgetHomeCardClass()} overflow-hidden p-0`;
}

export function chatWidgetHistorySectionTitleClass(): string {
  return 'text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-1 pb-0.5';
}

export function chatWidgetStaffAvatarStackClass(): string {
  return 'flex items-center -space-x-2.5';
}

export function chatWidgetStaffAvatarClass(borderClass = 'border-neutral-950'): string {
  return `h-8 w-8 shrink-0 border-2 ${borderClass} ring-0`;
}

export function chatWidgetStaffAvatarLargeClass(borderClass = 'border-white'): string {
  return `h-9 w-9 shrink-0 border-2 ${borderClass} ring-0`;
}

export function chatWidgetCategoryButtonClass(): string {
  return 'w-full flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10 hover:border-theme-accent/30 transition-all duration-150 group text-left';
}

export function chatWidgetSubcategoryButtonClass(disabled: boolean): string {
  const base =
    'w-full flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10 hover:border-theme-accent/30 transition-all duration-150 group text-left';
  return disabled ? `${base} disabled:opacity-60` : base;
}

export function chatWidgetFabButtonClass(): string {
  return 'relative h-14 w-14 rounded-full bg-cta-gradient shadow-lg shadow-[var(--cta-shadow)] border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95';
}

export function chatWidgetUnreadBadgeClass(): string {
  return 'pointer-events-none absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center z-10 shadow-sm';
}

/** Animation d’entrée uniquement pour les messages pas encore affichés. */
export function chatWidgetMessageEnterClass(isNew: boolean): string {
  return isNew ? 'message-slide-in' : '';
}

export function chatWidgetAiTypingBubbleClass(): string {
  return `${CHAT_WIDGET_BUBBLE_CHROME_BASE} chat-widget-bubble-ai`;
}

export function chatWidgetInputAreaClass(): string {
  return 'flex-shrink-0 border-t bg-background px-3 py-2.5';
}

export function chatWidgetTextareaClass(): string {
  return 'flex-1 resize-none overflow-y-auto scrollbar-none rounded-xl border bg-muted/50 px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all min-h-[38px] max-h-[160px] leading-relaxed';
}

export function chatWidgetTabBarClass(): string {
  return 'flex flex-row items-stretch flex-shrink-0 border-t bg-background/95 backdrop-blur-sm px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))]';
}

export function chatWidgetTabButtonClass(isActive: boolean): string {
  const base =
    'group flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] rounded-lg transition-colors duration-150 relative cursor-pointer';
  return isActive
    ? `${base} text-foreground font-medium`
    : `${base} text-muted-foreground hover:text-foreground`;
}

export function chatWidgetTabIconClass(isActive: boolean): string {
  const base = 'h-5 w-5 shrink-0 transition-[filter,color] duration-150';
  return isActive
    ? `${base} text-theme-accent chat-widget-tab-icon-glow-active`
    : `${base} chat-widget-tab-icon-glow-hover`;
}

/** Ligne d’historique (liste Messages) — style plat type Empire / Intercom. */
export function chatWidgetHistoryItemClass(params: {
  solved: boolean;
  isSelected: boolean;
}): string {
  const base =
    'w-full text-left px-4 py-3.5 border-b border-border/25 last:border-b-0 transition-all duration-200 ease-out group';
  if (params.solved) {
    return `${base} bg-transparent hover:bg-muted/50 dark:hover:bg-muted/30 active:bg-muted/65`;
  }
  const selected = params.isSelected
    ? 'bg-muted/40 dark:bg-muted/25'
    : 'bg-transparent';
  return `${base} ${selected} hover:bg-muted/50 dark:hover:bg-muted/30 active:bg-muted/65`;
}

export function chatWidgetHistoryItemTitleClass(solved: boolean): string {
  const base = 'text-sm font-semibold line-clamp-2 transition-colors duration-200';
  return solved
    ? `${base} text-muted-foreground group-hover:text-foreground/80`
    : `${base} text-foreground`;
}

export function chatWidgetHistoryListClass(): string {
  return 'flex-1 min-h-0 overflow-y-auto overscroll-y-contain divide-y divide-border/30';
}

export function chatWidgetSendButtonClass(): string {
  return 'h-[38px] w-[38px] flex-shrink-0 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 rounded-xl text-white';
}

export function shouldShowWidgetUnreadBadge(unreadCount: number, isOpen: boolean): boolean {
  return unreadCount > 0 && !isOpen;
}

/** Convertit les sauts de ligne simples en retours à la ligne Markdown (hard breaks). */
export function preserveChatLineBreaks(content: string): string {
  return content.replace(/(?<!\n)\n(?!\n)/g, '  \n');
}

export function shouldShowWidgetAiTyping(params: {
  isAiTyping: boolean;
  isSending: boolean;
}): boolean {
  return params.isAiTyping && !params.isSending;
}

export const CHAT_WIDGET_RATING_EMOJIS = ['😡', '😕', '😐', '🙂', '🤩'] as const;
