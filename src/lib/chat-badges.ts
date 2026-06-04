/** Classes Tailwind partagées pour les badges chat (admin + modération). */

const badgeBase = 'text-[10px] sm:text-xs font-medium backdrop-blur-sm';

export function chatStatusBadgeClass(status: string): string {
  if (status === 'ACTIVE') {
    return `${badgeBase} admin-badge-status admin-badge-status--success`;
  }
  if (status === 'CLOSED') {
    return `${badgeBase} admin-badge-status`;
  }
  return `${badgeBase} admin-badge-status admin-badge-status--pending`;
}

export function chatPriorityBadgeClass(priority: string): string {
  if (priority === 'URGENT') {
    return `${badgeBase} admin-badge-status admin-badge-status--danger`;
  }
  if (priority === 'HIGH') {
    return `${badgeBase} admin-badge-status admin-badge-status--pending`;
  }
  if (priority === 'NORMAL') {
    return `${badgeBase} admin-badge-status`;
  }
  return `${badgeBase} admin-badge-status`;
}

export function chatSenderBadgeClass(senderType: string): string {
  if (senderType === 'USER') {
    return `${badgeBase} admin-badge-status`;
  }
  if (senderType === 'MODERATOR') {
    return `${badgeBase} admin-badge-status admin-badge-status--pending`;
  }
  if (senderType === 'BOT' || senderType === 'AI' || senderType === 'SYSTEM') {
    return `${badgeBase} admin-badge-status`;
  }
  return `${badgeBase} admin-badge-status`;
}

/** Bulles de message — modération / admin chat */
export function chatMessageBubbleClass(senderType: string): string {
  const base = 'rounded-xl px-3 py-2 break-words overflow-hidden';
  if (senderType === 'USER') {
    return `${base} bg-muted/80 border border-border/50 text-foreground rounded-tl-sm`;
  }
  if (senderType === 'MODERATOR') {
    return `${base} bg-primary text-primary-foreground rounded-tr-sm`;
  }
  if (senderType === 'BOT' || senderType === 'SYSTEM') {
    return `${base} bg-theme-accent/12 border border-theme-accent/20 text-foreground rounded-tr-sm`;
  }
  if (senderType === 'AI') {
    return `${base} bg-theme-highlight/10 border border-theme-highlight/25 text-foreground rounded-tr-sm`;
  }
  return `${base} bg-muted/50 text-muted-foreground rounded-tr-sm`;
}
