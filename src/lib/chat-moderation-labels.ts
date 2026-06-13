import type { Messages } from '~/utils/types';

export function chatStatusLabel(status: string, messages: Messages): string {
  const filters = messages.moderation?.filters;
  const labels: Record<string, string | undefined> = {
    ACTIVE: filters?.active,
    CLOSED: filters?.closed,
    ARCHIVED: filters?.archived,
  };
  return labels[status] ?? status;
}

export function chatPriorityLabel(priority: string, messages: Messages): string {
  const filters = messages.moderation?.filters;
  const labels: Record<string, string | undefined> = {
    LOW: filters?.low,
    NORMAL: filters?.normal,
    HIGH: filters?.high,
    URGENT: filters?.urgent,
  };
  return labels[priority] ?? priority;
}

export function chatCategoryLabel(category: string, messages: Messages): string {
  const categories = messages.chatWidget?.categories;
  const labels: Record<string, string | undefined> = {
    trade: categories?.trade?.label,
    payment: categories?.payment?.label,
    support: categories?.support?.label,
  };
  return labels[category] ?? category;
}
