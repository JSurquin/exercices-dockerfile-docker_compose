'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { isValidModeratorRole } from '@/lib/chat-logic';
import {
  adminBtnOutline,
  adminGlassCard,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { PageLoading } from '@/components/ui/page-loading';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import {
  ClientFeedbackList,
  ClientFeedbackSummaryCards,
} from '@/components/chat/client-feedback-list';

export default function ModerationFeedbackPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { messages, locale } = useLocale();
  const t = messages.moderation.feedback;
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.moderationFeedback({ page }),
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: 'mine',
        page: String(page),
        limit: '20',
      });
      const response = await fetch(`/api/chat/feedback?${params}`);
      if (!response.ok) throw new Error(t.loadError);
      return response.json();
    },
    enabled: !!user && isValidModeratorRole(user.role ?? ''),
  });

  if (authLoading) {
    return (
      <PageLoading
        variant="compact"
        message={messages.moderation.loading}
        className="min-h-[60vh]"
      />
    );
  }

  if (!user || !isValidModeratorRole(user.role ?? '')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={adminGlassCard}>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-theme-accent" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              {messages.moderation.accessDenied.title}
            </h2>
            <p className="text-muted-foreground">
              {messages.moderation.accessDenied.description}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feedback = data?.feedback ?? [];
  const summary = data?.summary ?? { averageRating: 0, ratedCount: 0, feedbackCount: 0 };
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 text-foreground">
              <StarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-theme-accent shrink-0" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">{t.subtitle}</p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn('h-9 text-xs shrink-0', adminBtnOutline)}
          >
            <Link href="/moderation">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5" />
              {t.backToConversations}
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <ClientFeedbackSummaryCards
          averageRating={summary.averageRating}
          ratedCount={summary.ratedCount}
          feedbackCount={summary.feedbackCount}
          labels={{
            averageRating: t.summary.averageRating,
            ratedCount: t.summary.ratedCount,
            feedbackCount: t.summary.feedbackCount,
          }}
        />
      </motion.div>

      <Card className={adminGlassCard}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-foreground">
            {t.listTitle} ({pagination?.total ?? feedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading variant="compact" message={messages.moderation.loading} />
          ) : (
            <>
              <ClientFeedbackList
                items={feedback}
                messages={{
                  noSubject: messages.moderation.noSubject,
                  anonymousUser: messages.moderation.anonymousUser,
                  ratedOn: t.ratedOn,
                  noFeedback: t.noFeedback,
                  viewConversation: t.viewConversation,
                  assignedTo: messages.moderation.assignedTo,
                  noEntries: t.noEntries,
                }}
                locale={locale}
              />

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    className={adminBtnOutline}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t.prevPage}
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {page} / {pagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className={adminBtnOutline}
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t.nextPage}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
