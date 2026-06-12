import type { SenderType } from '@prisma/client';

export type WidgetSenderType = SenderType | 'UNKNOWN';

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

/** Classes Tailwind des bulles de message (widget accueil). */
export function chatWidgetMessageBubbleClass(senderType: WidgetSenderType): string {
  const base = 'max-w-[85%] rounded-2xl px-4 py-2.5';
  switch (senderType) {
    case 'USER':
      return `${base} bg-cta-gradient text-white rounded-tr-sm`;
    case 'MODERATOR':
      return `${base} bg-blue-500 text-white rounded-tl-sm`;
    case 'AI':
      return `${base} bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-tl-sm`;
    case 'SYSTEM':
      return `${base} bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-tl-sm text-xs`;
    case 'BOT':
      return `${base} bg-muted border rounded-tl-sm`;
    default:
      return `${base} bg-muted border rounded-tl-sm`;
  }
}

export function chatWidgetSenderLabelClass(senderType: WidgetSenderType): string | null {
  switch (senderType) {
    case 'MODERATOR':
      return 'inline-flex items-center gap-1 text-[11px] font-semibold bg-white/20 rounded-full px-2 py-0.5';
    case 'BOT':
      return 'inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5';
    case 'AI':
      return 'inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 rounded-full px-2 py-0.5';
    default:
      return null;
  }
}

export function chatWidgetTimestampClass(senderType: WidgetSenderType): string {
  if (senderType === 'USER') return 'text-white/70';
  if (senderType === 'SYSTEM') return 'text-emerald-600';
  if (senderType === 'AI') return 'text-violet-500 dark:text-violet-400';
  return 'text-muted-foreground';
}

export function chatWidgetPopupContainerClass(isOpen: boolean): string {
  const base = `
    fixed bottom-24 right-3 left-3
    sm:left-auto sm:right-6 sm:w-[390px]
    chat-glass rounded-2xl shadow-2xl z-[9999]
    flex flex-col overflow-hidden
    transition-all duration-300 ease-out
    pointer-events-auto
  `;
  return isOpen
    ? `${base} opacity-100 translate-y-0 scale-100`
    : `${base} opacity-0 translate-y-4 scale-95 pointer-events-none`;
}

export function chatWidgetHeaderClass(): string {
  return 'flex items-center justify-between p-4 bg-cta-gradient text-white flex-shrink-0';
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
  return 'h-14 w-14 rounded-full bg-cta-gradient shadow-lg shadow-[var(--cta-shadow)] border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95';
}

export function chatWidgetUnreadBadgeClass(): string {
  return 'absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-500 text-white text-xs flex items-center justify-center animate-pulse z-10';
}

export function chatWidgetAiTypingBubbleClass(): string {
  return 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl rounded-tl-sm px-4 py-2.5';
}

export function chatWidgetInputAreaClass(): string {
  return 'flex-shrink-0 border-t bg-background px-3 py-2.5';
}

export function chatWidgetTextareaClass(): string {
  return 'flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-all min-h-[38px] max-h-[100px] leading-relaxed';
}

export function chatWidgetTabBarClass(): string {
  return 'flex flex-row items-stretch flex-shrink-0 border-t bg-background/95 backdrop-blur-sm px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))]';
}

export function chatWidgetTabButtonClass(isActive: boolean): string {
  const base =
    'flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] rounded-lg transition-colors relative';
  return isActive
    ? `${base} text-foreground font-medium`
    : `${base} text-muted-foreground hover:text-foreground`;
}

export function chatWidgetHomeCardClass(): string {
  return 'w-full rounded-xl border bg-card p-3.5 text-left transition-colors hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10 hover:border-theme-accent/30';
}

export function chatWidgetSendButtonClass(): string {
  return 'h-[38px] w-[38px] flex-shrink-0 bg-cta-gradient hover:brightness-110 rounded-xl';
}

export function shouldShowWidgetUnreadBadge(unreadCount: number, isOpen: boolean): boolean {
  return unreadCount > 0 && !isOpen;
}

export function shouldShowWidgetAiTyping(params: {
  isAiTyping: boolean;
  isLoading: boolean;
  messageCount: number;
  baseMessageCount: number;
}): boolean {
  return (
    params.isAiTyping &&
    !params.isLoading &&
    params.messageCount > params.baseMessageCount
  );
}
