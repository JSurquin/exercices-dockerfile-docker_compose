'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { useSession } from '~/lib/auth-client';
import { queryKeys } from '@/lib/query-keys';
import { playNotificationSound } from '@/lib/play-notification-sound';
import {
  collectChatEscalationNotificationIds,
  collectModeratorAttentionKeys,
  findNewChatEscalationNotificationIds,
  findNewModeratorAlertKeys,
} from '@/lib/chat-notification-logic';

const MODERATOR_ALERT_POLL_MS = 5_000;

export function ModeratorChatAlertListener() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const seenAttentionKeysRef = useRef<Set<string>>(new Set());
  const seenEscalationIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  const effectiveRole = user?.role ?? session?.user?.role;
  const isStaff = effectiveRole === 'MODERATOR' || effectiveRole === 'ADMIN';

  const activeConversationId =
    pathname?.match(/^\/moderation\/conversations\/([^/]+)/)?.[1] ?? null;

  const { data: staffConversations } = useQuery({
    queryKey: queryKeys.adminChatConversations({
      status: 'ACTIVE',
      scope: 'staff',
      limit: 50,
    }),
    queryFn: async () => {
      const params = new URLSearchParams({
        scope: 'staff',
        status: 'ACTIVE',
        limit: '50',
      });
      const response = await fetch(`/api/chat/conversations?${params}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isStaff,
    refetchInterval: MODERATOR_ALERT_POLL_MS,
    refetchIntervalInBackground: true,
  });

  const { data: notificationsData } = useQuery({
    queryKey: [...queryKeys.userNotifications, 'moderator-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/user/notifications?limit=20');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isStaff,
    refetchInterval: MODERATOR_ALERT_POLL_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!isStaff) {
      bootstrappedRef.current = false;
      seenAttentionKeysRef.current = new Set();
      seenEscalationIdsRef.current = new Set();
      return;
    }

    const attentionKeys = collectModeratorAttentionKeys(
      staffConversations?.conversations ?? [],
      activeConversationId,
    );
    const escalationIds = collectChatEscalationNotificationIds(
      notificationsData?.notifications ?? [],
    );

    if (!bootstrappedRef.current) {
      seenAttentionKeysRef.current = new Set(attentionKeys);
      seenEscalationIdsRef.current = new Set(escalationIds);
      bootstrappedRef.current = true;
      return;
    }

    const newAttentionKeys = findNewModeratorAlertKeys(
      seenAttentionKeysRef.current,
      attentionKeys,
    );
    const newEscalationIds = findNewChatEscalationNotificationIds(
      seenEscalationIdsRef.current,
      escalationIds,
    );

    if (newAttentionKeys.length > 0 || newEscalationIds.length > 0) {
      playNotificationSound(520, 350, 0.3);
      void queryClient.invalidateQueries({ queryKey: queryKeys.userNotifications });
    }

    seenAttentionKeysRef.current = new Set(attentionKeys);
    seenEscalationIdsRef.current = new Set(escalationIds);
  }, [
    isStaff,
    staffConversations,
    notificationsData,
    activeConversationId,
    queryClient,
  ]);

  return null;
}
