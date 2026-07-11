'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientFeedbackEntry } from '@/lib/types/chat';
import { CHAT_WIDGET_RATING_EMOJIS } from '@/lib/chat-widget-styles';
import { cn } from '@/lib/utils';
import { Locale } from '@/lib/i18n';
import { localeToBcp47 } from '@/lib/locale-date';
import { adminBtnOutline, panelListRow } from '@/lib/admin-ui';
import { StarIcon } from '@heroicons/react/24/outline';

export type ClientFeedbackListMessages = {
  noSubject: string;
  anonymousUser: string;
  ratedOn: string;
  noFeedback: string;
  viewConversation: string;
  assignedTo: string;
  noEntries: string;
};

type ClientFeedbackListProps = {
  items: ClientFeedbackEntry[];
  messages: ClientFeedbackListMessages;
  locale: Locale;
  /** Afficher le modérateur assigné (vue admin) */
  showModerator?: boolean;
  /** Lien vers la conversation modération */
  conversationHref?: (id: string) => string;
  variant?: 'moderation' | 'admin';
};

export function ClientFeedbackList({
  items,
  messages,
  locale,
  showModerator = false,
  conversationHref = (id) => `/moderation/conversations/${id}`,
  variant = 'moderation',
}: ClientFeedbackListProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(localeToBcp47(locale), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <StarIcon
          className={cn(
            'w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4',
            variant === 'admin' ? 'text-slate-600' : 'text-muted-foreground/40',
          )}
        />
        <p className={variant === 'admin' ? 'text-slate-400' : 'text-muted-foreground'}>
          {messages.noEntries}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            variant === 'admin'
              ? 'flex flex-col gap-3 p-4 rounded-lg bg-slate-900/40 border border-slate-700'
              : panelListRow,
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3
                  className={cn(
                    'font-semibold truncate max-w-full sm:max-w-md',
                    variant === 'admin' ? 'text-white' : 'text-foreground',
                  )}
                >
                  {entry.subject || messages.noSubject}
                </h3>
                {entry.clientRating != null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs gap-1',
                      variant === 'admin'
                        ? 'border-yellow-500/30 text-yellow-400'
                        : 'border-theme-accent/30 text-theme-accent',
                    )}
                  >
                    <span aria-hidden>{CHAT_WIDGET_RATING_EMOJIS[entry.clientRating - 1]}</span>
                    <span className="tabular-nums">{entry.clientRating}/5</span>
                  </Badge>
                )}
              </div>

              <div
                className={cn(
                  'text-sm mb-2',
                  variant === 'admin' ? 'text-slate-400' : 'text-muted-foreground',
                )}
              >
                <span className={variant === 'admin' ? 'text-slate-300' : 'text-foreground/80'}>
                  {entry.user?.name || entry.user?.email || messages.anonymousUser}
                </span>
                {entry.user?.steamUsername && (
                  <span className="ml-1">• Steam: {entry.user.steamUsername}</span>
                )}
              </div>

              {entry.clientFeedback ? (
                <p
                  className={cn(
                    'text-sm whitespace-pre-wrap rounded-md border px-3 py-2',
                    variant === 'admin'
                      ? 'border-slate-700 bg-slate-800/50 text-slate-200'
                      : 'border-border/50 bg-muted/30 text-foreground',
                  )}
                >
                  {entry.clientFeedback}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">{messages.noFeedback}</p>
              )}

              <div
                className={cn(
                  'flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs',
                  variant === 'admin' ? 'text-slate-500' : 'text-muted-foreground',
                )}
              >
                <span>
                  {messages.ratedOn} {formatDate(entry.clientRatedAt ?? entry.closedAt)}
                </span>
                {showModerator && entry.assignedModerator && (
                  <span>
                    {messages.assignedTo}{' '}
                    {entry.assignedModerator.name || entry.assignedModerator.email}
                  </span>
                )}
              </div>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn(
                'shrink-0 text-xs h-8',
                variant === 'admin'
                  ? 'border-slate-600 text-slate-300 hover:text-white'
                  : adminBtnOutline,
              )}
            >
              <Link href={conversationHref(entry.id)}>{messages.viewConversation}</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientFeedbackSummaryCards({
  averageRating,
  ratedCount,
  feedbackCount,
  labels,
  variant = 'moderation',
}: {
  averageRating: number;
  ratedCount: number;
  feedbackCount: number;
  labels: {
    averageRating: string;
    ratedCount: string;
    feedbackCount: string;
  };
  variant?: 'moderation' | 'admin';
}) {
  const cardClass =
    variant === 'admin'
      ? 'bg-slate-800/50 border-slate-700'
      : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <SummaryCard
        label={labels.averageRating}
        value={averageRating > 0 ? `${averageRating}/5` : '—'}
        cardClass={cardClass}
        variant={variant}
      />
      <SummaryCard
        label={labels.ratedCount}
        value={ratedCount}
        cardClass={cardClass}
        variant={variant}
      />
      <SummaryCard
        label={labels.feedbackCount}
        value={feedbackCount}
        cardClass={cardClass}
        variant={variant}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  cardClass,
  variant,
}: {
  label: string;
  value: string | number;
  cardClass?: string;
  variant: 'moderation' | 'admin';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        cardClass ?? 'border-border/50 bg-muted/20',
      )}
    >
      <p
        className={cn(
          'text-xs sm:text-sm mb-1',
          variant === 'admin' ? 'text-slate-400' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'text-xl sm:text-2xl font-bold tabular-nums',
          variant === 'admin' ? 'text-white' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
