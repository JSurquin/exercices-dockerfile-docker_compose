'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConversationWithMessages, ChatMessageWithUser } from '@/lib/types/chat';
import { ConversationStatus } from '@prisma/client';
import { useSession } from '~/lib/auth-client';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { chatMessageBubbleClass, chatPriorityBadgeClass, chatSenderBadgeClass, chatStatusBadgeClass } from '@/lib/chat-badges';
import {
  adminBtnOutline,
  adminBtnPrimary,
  adminGlassCard,
  panelGlassField,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { resolveI18nContent } from '@/lib/resolve-i18n-content';

const senderTypeLabels: Record<string, string> = {
  USER: 'Utilisateur',
  BOT: 'Bot',
  AI: '✨ IA',
  MODERATOR: 'Modérateur',
  SYSTEM: 'Système',
};

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { messages } = useLocale();
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: loading, refetch: refetchConversation } = useQuery({
    queryKey: queryKeys.moderationConversation(params.id as string),
    queryFn: async () => {
      const response = await fetch(`/api/chat/conversations/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error(messages.moderation.conversation.notFound.title);
          router.push('/moderation');
          return null;
        }
        throw new Error('Erreur lors du chargement');
      }
      return response.json();
    },
    enabled: !!params.id,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: params.id,
          content: message.trim(),
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi');
      
      setMessage('');
      await refetchConversation();
      toast.success(messages.moderation.conversation.messages.messageSent);
    } catch (error) {
      toast.error(messages.moderation.conversation.messages.sendError);
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: ConversationStatus) => {
    try {
      const response = await fetch(`/api/chat/conversations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      await refetchConversation();
      toast.success(messages.moderation.conversation.messages.statusUpdated);
    } catch (error) {
      toast.error(messages.moderation.conversation.messages.updateError);
      console.error(error);
    }
  };

  const assignToMe = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId: session?.user?.id || user?.id || '' }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'assignation');
      
      await refetchConversation();
      toast.success(messages.moderation.conversation.messages.assigned);
    } catch (error) {
      toast.error(messages.moderation.conversation.messages.assignError);
      console.error(error);
    }
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = smooth
        ? messagesContainerRef.current.scrollHeight
        : messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Scroll au bas uniquement lors du premier chargement ou quand un NOUVEAU message arrive
  useEffect(() => {
    const count = conversation?.messages?.length ?? 0;
    const prevCount = prevMessageCountRef.current;

    if (count > 0 && (prevCount === 0 || count > prevCount)) {
      // Premier chargement → scroll instantané; nouveau message → scroll fluide
      setTimeout(() => scrollToBottom(), 50);
    }
    prevMessageCountRef.current = count;
  }, [conversation?.messages?.length, scrollToBottom]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };


  // Attendre le chargement de la session
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  // Vérifier les permissions
  if (!session?.user || (session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={adminGlassCard}>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-theme-accent" />
            <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">
              Vous devez être modérateur ou administrateur pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={adminGlassCard}>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-theme-accent" />
            <h2 className="text-2xl font-bold mb-2">{messages.moderation.conversation.notFound.title}</h2>
            <Button variant="cta" className={adminBtnPrimary} onClick={() => router.push('/moderation')}>
              {messages.moderation.conversation.notFound.backButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    /*
     * Sur mobile/tablette : layout vertical — sidebar collapsible en haut,
     *   chat en dessous avec hauteur contrainte par dvh.
     * Sur desktop (lg+) : grid 4 colonnes côte à côte, sidebar sticky.
     * Le wrapper principal n'a pas de overflow caché pour laisser la page
     * défiler normalement sur mobile.
     */
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className={cn('flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9', adminBtnOutline)}
            onClick={() => router.push('/moderation')}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate leading-tight">
              {conversation.subject || messages.moderation.conversation.header.noSubject}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              {messages.moderation.conversation.header.withUser}{' '}
              {conversation.user?.name || conversation.user?.email || messages.moderation.conversation.header.anonymousUser}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${chatStatusBadgeClass(conversation.status)}`}>
            {conversation.status}
          </Badge>
          <Badge variant="outline" className={`text-xs px-1.5 py-0.5 hidden sm:inline-flex ${chatPriorityBadgeClass(conversation.priority)}`}>
            {conversation.priority}
          </Badge>
        </div>
      </motion.div>

      {/* ── Layout principal ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 lg:items-start">

        {/* ── Sidebar infos — collapsible sur mobile, toujours visible sur lg ── */}
        <div className="lg:col-span-1 lg:sticky lg:top-4">

          {/* Version mobile : accordéon */}
          <Collapsible className="lg:hidden">
            <CollapsibleTrigger asChild>
              <button className={cn('w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-theme-accent/8 transition-colors', adminGlassCard)}>
                <span>{messages.moderation.conversation.info.title}</span>
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={cn('mt-2 px-4 py-3 space-y-3', adminGlassCard)}>
                <SidebarContent
                  conversation={conversation}
                  messages={messages}
                  assignToMe={assignToMe}
                  updateStatus={updateStatus}
                  formatDate={formatDate}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Version desktop : toujours visible */}
          <div className={cn('hidden lg:block p-4 space-y-4', adminGlassCard)}>
            <p className="font-semibold text-sm text-foreground">{messages.moderation.conversation.info.title}</p>
            <SidebarContent
              conversation={conversation}
              messages={messages}
              assignToMe={assignToMe}
              updateStatus={updateStatus}
              formatDate={formatDate}
            />
          </div>
        </div>

        {/* ── Zone chat ── */}
        <div className="lg:col-span-3">
          <Card
            className={cn('flex flex-col overflow-hidden', adminGlassCard)}
            style={{ height: 'clamp(480px, calc(100dvh - 180px), 860px)' }}
          >
            {/* En-tête chat */}
            <CardHeader className="flex-shrink-0 py-3 px-4 border-b border-border/50">
              <CardTitle className="text-sm sm:text-base text-foreground">
                {messages.moderation.conversation.messages.title}{' '}
                <span className="text-muted-foreground font-normal">
                  ({conversation.messages.length})
                </span>
              </CardTitle>
            </CardHeader>

            {/* Messages — zone scrollable, ordre chronologique (le plus récent en bas) */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 space-y-3"
            >
              {conversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Aucun message dans cette conversation.
                </div>
              ) : (
                conversation.messages.map((msg: ChatMessageWithUser) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${msg.senderType === 'USER' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className="max-w-[85%] sm:max-w-[72%] min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${chatSenderBadgeClass(msg.senderType)}`}
                        >
                          {senderTypeLabels[msg.senderType] ?? msg.senderType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className={chatMessageBubbleClass(msg.senderType)}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {resolveI18nContent(msg.content, messages)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone saisie — ancrée en bas, jamais couverte */}
            <div className="flex-shrink-0 border-t border-border/50 bg-background/30 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder={messages.moderation.conversation.typeYourReply}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className={cn('flex-1 min-h-[52px] sm:min-h-[60px] max-h-[120px] resize-none text-sm', panelGlassField)}
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  size="icon"
                  variant="cta"
                  className={cn('flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 self-end', adminBtnPrimary)}
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 select-none">
                Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Contenu de la sidebar — partagé entre mobile
 * (Collapsible) et desktop (div fixe).
 * ───────────────────────────────────────────── */
function SidebarContent({
  conversation,
  messages,
  assignToMe,
  updateStatus,
  formatDate,
}: {
  conversation: ConversationWithMessages;
  messages: any;
  assignToMe: () => void;
  updateStatus: (status: ConversationStatus) => void;
  formatDate: (d: Date) => string;
}) {
  return (
    <>
      {/* Utilisateur */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {messages.moderation.conversation.info.userTitle}
        </p>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={(conversation as any).user?.steamAvatar || undefined} />
            <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {(conversation as any).user?.name || messages.moderation.conversation.info.anonymous}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(conversation as any).user?.email}
            </p>
            {(conversation as any).user?.steamUsername && (
              <p className="text-xs text-muted-foreground truncate">
                Steam: {(conversation as any).user.steamUsername}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Assignation */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {messages.moderation.conversation.info.assignmentTitle}
        </p>
        {(conversation as any).assignedModerator ? (
          <p className="text-sm truncate">
            {(conversation as any).assignedModerator.name || (conversation as any).assignedModerator.email}
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{messages.moderation.conversation.info.unassigned}</p>
            <Button size="sm" variant="cta" onClick={assignToMe} className={cn('w-full h-8 text-xs', adminBtnPrimary)}>
              {messages.moderation.conversation.info.assignToMe}
            </Button>
          </div>
        )}
      </div>

      {/* Dates */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {messages.moderation.conversation.info.datesTitle}
        </p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3 h-3 flex-shrink-0" />
            <span>{messages.moderation.conversation.info.created} {formatDate((conversation as any).createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3 h-3 flex-shrink-0" />
            <span>{messages.moderation.conversation.info.updated} {formatDate((conversation as any).updatedAt)}</span>
          </div>
          {(conversation as any).closedAt && (
            <div className="flex items-center gap-1.5">
              <CheckIcon className="w-3 h-3 flex-shrink-0" />
              <span>{messages.moderation.conversation.info.closed} {formatDate((conversation as any).closedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {messages.moderation.conversation.info.actionsTitle}
        </p>
        {(conversation as any).status === 'ACTIVE' ? (
          <Button size="sm" variant="outline" className={cn('w-full h-8 text-xs', adminBtnOutline)} onClick={() => updateStatus('CLOSED')}>
            {messages.moderation.conversation.info.closeConversation}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className={cn('w-full h-8 text-xs', adminBtnOutline)} onClick={() => updateStatus('ACTIVE')}>
            {messages.moderation.conversation.info.reopenConversation}
          </Button>
        )}
      </div>
    </>
  );
}
