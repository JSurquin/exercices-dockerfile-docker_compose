'use client';

import { useState } from 'react';
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
import { chatPriorityBadgeClass, chatStatusBadgeClass } from '@/lib/chat-badges';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { messages } = useLocale();
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
    } catch (error) {
      toast.error(messages.moderation.errors.updateError);
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Attendre le chargement de la session
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
      </div>
    );
  }

  // Vérifier les permissions
  if (!session?.user || (session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">{messages.moderation.accessDenied.title}</h2>
            <p className="text-slate-400">
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 text-white">
          <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 shrink-0" />
          {messages.moderation.title}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{messages.moderation.stats.activeConversations}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeConversations}</p>
                </div>
                <ChatBubbleLeftRightIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{messages.moderation.stats.unassigned}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.unassignedConversations}</p>
                </div>
                <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{messages.moderation.stats.responseTime}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.averageResponseTime}min</p>
                </div>
                <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 truncate">{messages.moderation.stats.closed}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.closedConversations}</p>
                </div>
                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtres — collapsible sur mobile */}
      <Card className="mb-4 sm:mb-6 bg-slate-800/50 border-slate-700">
        <Collapsible defaultOpen={false} className="sm:hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white">
              <span className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-orange-500" />
                {messages.moderation.filtersTitle}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-slate-400 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
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
            <CardTitle className="text-base text-white">{messages.moderation.filtersTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersGrid filters={filters} setFilters={setFilters} messages={messages} />
          </CardContent>
        </div>
      </Card>

      {/* Liste des conversations */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg text-white">
            {messages.moderation.conversationsCount} ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
              <p className="mt-2 text-slate-400">{messages.moderation.loading}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">{messages.moderation.noConversations}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation: ConversationWithMessages) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 sm:p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <h3 className="font-semibold text-white truncate max-w-full sm:max-w-xs">
                          {conversation.subject || messages.moderation.noSubject}
                        </h3>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${chatPriorityBadgeClass(conversation.priority)}`}>
                          {conversation.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs ${chatStatusBadgeClass(conversation.status)}`}>
                          {conversation.status}
                        </Badge>
                        {conversation.category && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-600 text-slate-300">
                            {conversation.category}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-slate-400 mb-2 min-w-0">
                        <span className="font-medium text-slate-300 break-all">
                          {conversation.user?.name || conversation.user?.email || messages.moderation.anonymousUser}
                        </span>
                        {conversation.user?.steamUsername && (
                          <span className="break-all"> • Steam: {conversation.user.steamUsername}</span>
                        )}
                      </div>

                      {conversation.messages.length > 0 && (
                        <p className="text-sm text-slate-500 line-clamp-2 break-words">
                          {conversation.messages[0].content}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                        <span className="whitespace-nowrap">{messages.moderation.createdOn} {formatDate(conversation.createdAt)}</span>
                        <span className="whitespace-nowrap">{conversation._count?.messages || 0} {messages.moderation.messages}</span>
                        {conversation.assignedModerator && (
                          <span className="break-all text-slate-400">
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
                          className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:text-white text-xs h-8"
                          onClick={() => assignConversation(conversation.id, session.user!.id)}
                        >
                          {messages.moderation.actions.assignToMe}
                        </Button>
                      )}

                      {conversation.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:text-white text-xs h-8"
                          onClick={() => updateConversationStatus(conversation.id, 'CLOSED')}
                        >
                          {messages.moderation.actions.close}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
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
        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'ALL' ? undefined : value as ConversationStatus }))}
      >
        <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-9">
          <SelectValue placeholder={messages.moderation.filters.statusPlaceholder} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem value="ALL">{messages.moderation.filters.allStatuses}</SelectItem>
          <SelectItem value="ACTIVE">{messages.moderation.filters.active}</SelectItem>
          <SelectItem value="CLOSED">{messages.moderation.filters.closed}</SelectItem>
          <SelectItem value="ARCHIVED">{messages.moderation.filters.archived}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || 'ALL'}
        onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'ALL' ? undefined : value as ConversationPriority }))}
      >
        <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-9">
          <SelectValue placeholder={messages.moderation.filters.priorityPlaceholder} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem value="ALL">{messages.moderation.filters.allPriorities}</SelectItem>
          <SelectItem value="LOW">{messages.moderation.filters.low}</SelectItem>
          <SelectItem value="NORMAL">{messages.moderation.filters.normal}</SelectItem>
          <SelectItem value="HIGH">{messages.moderation.filters.high}</SelectItem>
          <SelectItem value="URGENT">{messages.moderation.filters.urgent}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assignedTo || 'ALL'}
        onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value === 'ALL' ? undefined : value }))}
      >
        <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-9">
          <SelectValue placeholder={messages.moderation.filters.assignmentPlaceholder} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          <SelectItem value="ALL">{messages.moderation.filters.all}</SelectItem>
          <SelectItem value="me">{messages.moderation.filters.myConversations}</SelectItem>
          <SelectItem value="unassigned">{messages.moderation.filters.unassigned}</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={messages.moderation.filters.searchPlaceholder}
          className="pl-9 bg-slate-900 border-slate-600 text-white h-9"
          value={filters.search || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>
    </div>
  );
}
