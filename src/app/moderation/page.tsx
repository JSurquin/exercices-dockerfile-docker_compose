'use client';

import { useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConversationWithMessages, ConversationFilters } from '@/lib/types/chat';
import { ConversationStatus, ConversationPriority } from '@prisma/client';
import { useSession } from '~/lib/auth-client';
import { chatPriorityBadgeClass, chatSenderBadgeClass, chatStatusBadgeClass } from '@/lib/chat-badges';
import {
  adminBadgeStatus,
  adminBtnOutline,
  adminBtnPrimary,
  adminGlassCard,
  adminIconAccent,
  adminStatCard,
  panelGlassField,
  panelListRow,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { PageLoading } from '@/components/ui/page-loading';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ChevronDownIcon,
  FunnelIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { localeToBcp47 } from '@/lib/locale-date';
import {
  chatCategoryLabel,
  chatPriorityLabel,
  chatStatusLabel,
} from '@/lib/chat-moderation-labels';
import { isValidModeratorRole } from '@/lib/chat-logic';
import { resolveI18nContent } from '@/lib/resolve-i18n-content';

export default function ModerationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { messages, locale } = useLocale();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ConversationFilters>({
    status: 'ACTIVE',
    page: 1,
    limit: 20,
  });

  const { data: conversationsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.adminChatConversations(filters as Record<string, unknown>),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('scope', 'staff');
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      const response = await fetch(`/api/chat/conversations?${params}`);
      if (!response.ok) throw new Error(messages.moderation.errors.loadError);
      return response.json();
    },
  });

  const conversations = conversationsData?.conversations ?? [];

  const { data: stats } = useQuery({
    queryKey: queryKeys.adminChatStats,
    queryFn: async () => {
      const response = await fetch('/api/chat/stats');
      if (!response.ok) throw new Error(messages.moderation.errors.statsLoadError);
      return response.json();
    },
  });

  const assignConversation = async (conversationId: string, moderatorId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId }),
      });

      if (!response.ok) throw new Error(messages.moderation.errors.assignError);
      
      toast.success(messages.moderation.success.assigned);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChatStats });
    } catch (error) {
      toast.error(messages.moderation.errors.assignError);
      console.error(error);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: ConversationStatus) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error(messages.moderation.errors.updateError);
      
      toast.success(messages.moderation.success.statusUpdated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChatStats });
    } catch (error) {
      toast.error(messages.moderation.errors.updateError);
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(localeToBcp47(locale), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Attendre le chargement de la session
  if (isPending || authLoading) {
    return (
      <PageLoading
        variant="compact"
        message={messages.moderation.loading}
        className="min-h-[60vh]"
      />
    );
  }

  // Vérifier les permissions
  if (!user || !isValidModeratorRole(user.role ?? '')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={adminGlassCard}>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-theme-accent" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">{messages.moderation.accessDenied.title}</h2>
            <p className="text-muted-foreground">
              {messages.moderation.accessDenied.description}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 text-foreground">
          <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-7 sm:h-7 text-theme-accent shrink-0" />
          {messages.moderation.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {messages.moderation.subtitle}
        </p>
      </motion.div>

      {/* Statistiques */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
        >
          <ModStatCard
            label={messages.moderation.stats.activeConversations}
            value={stats.activeConversations}
            icon={ChatBubbleLeftRightIcon}
          />
          <ModStatCard
            label={messages.moderation.stats.unassigned}
            value={stats.unassignedConversations}
            icon={UserIcon}
          />
          <ModStatCard
            label={messages.moderation.stats.responseTime}
            value={`${stats.averageResponseTime}${messages.moderation.stats.minutesShort}`}
            icon={ClockIcon}
          />
          <ModStatCard
            label={messages.moderation.stats.closed}
            value={stats.closedConversations}
            icon={CheckCircleIcon}
          />
        </motion.div>
      )}

      {/* Filtres, collapsible sur mobile */}
      <Card className={cn(adminGlassCard, 'mb-4 sm:mb-6')}>
        <Collapsible defaultOpen={false} className="sm:hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
              <span className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-theme-accent" />
                {messages.moderation.filtersTitle}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <FiltersGrid filters={filters} setFilters={setFilters} messages={messages} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>

        <div className="hidden sm:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">{messages.moderation.filtersTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersGrid filters={filters} setFilters={setFilters} messages={messages} />
          </CardContent>
        </div>
      </Card>

      {/* Liste des conversations */}
      <Card className={adminGlassCard}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-foreground">
            {messages.moderation.conversationsCount} ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PageLoading variant="compact" message={messages.moderation.loading} />
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">{messages.moderation.noConversations}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation: ConversationWithMessages) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={panelListRow}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate max-w-full sm:max-w-xs">
                          {conversation.subject || messages.moderation.noSubject}
                        </h3>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${chatPriorityBadgeClass(conversation.priority)}`}>
                          {chatPriorityLabel(conversation.priority, messages)}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${chatStatusBadgeClass(conversation.status)}`}>
                          {chatStatusLabel(conversation.status, messages)}
                        </Badge>
                        {conversation.category && (
                          <Badge variant="outline" className={cn('text-[10px] sm:text-xs', adminBadgeStatus)}>
                            {chatCategoryLabel(conversation.category, messages)}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground mb-2 min-w-0">
                        <span className="font-medium text-foreground/80 break-all">
                          {conversation.user?.name || conversation.user?.email || messages.moderation.anonymousUser}
                        </span>
                        {conversation.user?.steamUsername && (
                          <span className="break-all"> • {messages.moderation.conversation.info.steam} {conversation.user.steamUsername}</span>
                        )}
                      </div>

                      {conversation.messages.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {conversation.messages[0].senderType === 'AI' && (
                            <Badge
                              variant="outline"
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0 ${chatSenderBadgeClass('AI')}`}
                            >
                              <SparklesIcon className="w-3 h-3 shrink-0" aria-hidden />
                              {messages.chatWidget.aiLabel}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground/80 line-clamp-2 break-words min-w-0 flex-1">
                            {resolveI18nContent(conversation.messages[0].content, messages)}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span className="whitespace-nowrap">{messages.moderation.createdOn} {formatDate(conversation.createdAt)}</span>
                        <span className="whitespace-nowrap">{conversation._count?.messages || 0} {messages.moderation.messages}</span>
                        {conversation.assignedModerator && (
                          <span className="break-all">
                            {messages.moderation.assignedTo} {conversation.assignedModerator.name || conversation.assignedModerator.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row flex-wrap sm:flex-col lg:flex-row items-stretch gap-2 shrink-0">
                      {!conversation.assignedTo && session?.user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn('flex-1 sm:flex-none text-xs h-8', adminBtnOutline)}
                          onClick={() => assignConversation(conversation.id, session.user!.id)}
                        >
                          {messages.moderation.actions.assignToMe}
                        </Button>
                      )}

                      {conversation.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn('flex-1 sm:flex-none text-xs h-8', adminBtnOutline)}
                          onClick={() => updateConversationStatus(conversation.id, 'CLOSED')}
                        >
                          {messages.moderation.actions.close}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="cta"
                        className={cn('flex-1 sm:flex-none text-xs h-8', adminBtnPrimary)}
                        onClick={() => router.push(`/moderation/conversations/${conversation.id}`)}
                      >
                        {messages.moderation.actions.open}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ModStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className={adminStatCard}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Icon className={cn(adminIconAccent, 'w-6 h-6 sm:w-8 sm:h-8')} />
        </div>
      </CardContent>
    </Card>
  );
}

function FiltersGrid({
  filters,
  setFilters,
  messages,
}: {
  filters: ConversationFilters;
  setFilters: React.Dispatch<React.SetStateAction<ConversationFilters>>;
  messages: ReturnType<typeof useLocale>['messages'];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Select
        value={filters.status || 'ALL'}
        onValueChange={(value) => setFilters(prev => ({
          ...prev,
          page: 1,
          status: value === 'ALL' ? undefined : value as ConversationStatus,
        }))}
      >
        <SelectTrigger className={cn(panelGlassField, 'h-9')}>
          <SelectValue placeholder={messages.moderation.filters.statusPlaceholder} />
        </SelectTrigger>
        <SelectContent className={cn(adminGlassCard, 'border')}>
          <SelectItem value="ALL">{messages.moderation.filters.allStatuses}</SelectItem>
          <SelectItem value="ACTIVE">{messages.moderation.filters.active}</SelectItem>
          <SelectItem value="CLOSED">{messages.moderation.filters.closed}</SelectItem>
          <SelectItem value="ARCHIVED">{messages.moderation.filters.archived}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || 'ALL'}
        onValueChange={(value) => setFilters(prev => ({
          ...prev,
          page: 1,
          priority: value === 'ALL' ? undefined : value as ConversationPriority,
        }))}
      >
        <SelectTrigger className={cn(panelGlassField, 'h-9')}>
          <SelectValue placeholder={messages.moderation.filters.priorityPlaceholder} />
        </SelectTrigger>
        <SelectContent className={cn(adminGlassCard, 'border')}>
          <SelectItem value="ALL">{messages.moderation.filters.allPriorities}</SelectItem>
          <SelectItem value="LOW">{messages.moderation.filters.low}</SelectItem>
          <SelectItem value="NORMAL">{messages.moderation.filters.normal}</SelectItem>
          <SelectItem value="HIGH">{messages.moderation.filters.high}</SelectItem>
          <SelectItem value="URGENT">{messages.moderation.filters.urgent}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assignedTo || 'ALL'}
        onValueChange={(value) => setFilters(prev => ({
          ...prev,
          page: 1,
          assignedTo: value === 'ALL' ? undefined : value,
        }))}
      >
        <SelectTrigger className={cn(panelGlassField, 'h-9')}>
          <SelectValue placeholder={messages.moderation.filters.assignmentPlaceholder} />
        </SelectTrigger>
        <SelectContent className={cn(adminGlassCard, 'border')}>
          <SelectItem value="ALL">{messages.moderation.filters.all}</SelectItem>
          <SelectItem value="me">{messages.moderation.filters.myConversations}</SelectItem>
          <SelectItem value="unassigned">{messages.moderation.filters.unassigned}</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={messages.moderation.filters.searchPlaceholder}
          className={cn('pl-9 h-9', panelGlassField)}
          value={filters.search || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, page: 1, search: e.target.value }))}
        />
      </div>
    </div>
  );
}
