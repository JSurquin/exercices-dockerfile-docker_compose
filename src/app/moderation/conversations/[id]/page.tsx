'use client';

import { useState, useEffect, useRef } from 'react';
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

const senderTypeLabels = {
  USER: 'Utilisateur',
  BOT: 'Bot',
  MODERATOR: 'Modérateur',
  SYSTEM: 'Système',
};

const senderTypeColors = {
  USER: 'bg-blue-100 text-blue-800',
  BOT: 'bg-green-100 text-green-800',
  MODERATOR: 'bg-orange-100 text-orange-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
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
        body: JSON.stringify({ moderatorId: user?.id || '' }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'assignation');
      
      await refetchConversation();
      toast.success(messages.moderation.conversation.messages.assigned);
    } catch (error) {
      toast.error(messages.moderation.conversation.messages.assignError);
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

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


  // Vérifier les permissions
  if (!session?.user || session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">{messages.moderation.conversation.notFound.title}</h2>
            <Button onClick={() => router.push('/moderation')}>
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
            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
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
          <Badge
            className={`text-xs px-1.5 py-0.5 ${conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            {conversation.status}
          </Badge>
          <Badge
            className={`text-xs px-1.5 py-0.5 hidden sm:inline-flex ${
              conversation.priority === 'URGENT'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                : conversation.priority === 'HIGH'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
            }`}
          >
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
              <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-card text-sm font-medium hover:bg-muted/50 transition-colors">
                <span>{messages.moderation.conversation.info.title}</span>
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-lg border bg-card px-4 py-3 space-y-3">
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
          <div className="hidden lg:block rounded-lg border bg-card p-4 space-y-4">
            <p className="font-semibold text-sm">{messages.moderation.conversation.info.title}</p>
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
          {/*
           * Hauteur :
           *  - Mobile  : 60dvh (assez pour voir les messages sans occuper tout l'écran)
           *  - Tablette: 65dvh
           *  - Desktop : 72dvh plafonné à 760px
           * On utilise dvh (dynamic viewport height) pour tenir compte de la barre
           * d'adresse mobile qui s'escamote.
           */}
          <Card
            className="flex flex-col overflow-hidden"
            style={{ height: 'clamp(420px, 60dvh, 760px)' }}
          >
            {/* En-tête chat */}
            <CardHeader className="flex-shrink-0 py-3 px-4 border-b">
              <CardTitle className="text-sm sm:text-base">
                {messages.moderation.conversation.messages.title}{' '}
                <span className="text-muted-foreground font-normal">
                  ({conversation.messages.length})
                </span>
              </CardTitle>
            </CardHeader>

            {/* Messages — zone scrollable contrainte */}
            <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 py-3">
              {conversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Aucun message dans cette conversation.
                </div>
              ) : (
                <div className="space-y-3">
                  {conversation.messages.map((msg: ChatMessageWithUser) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${msg.senderType === 'USER' ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Bulle limitée à 85% sur mobile, 72% sur desktop */}
                      <div className="max-w-[85%] sm:max-w-[72%] min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${senderTypeColors[msg.senderType as keyof typeof senderTypeColors]}`}
                            variant="secondary"
                          >
                            {senderTypeLabels[msg.senderType as keyof typeof senderTypeLabels]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`rounded-xl px-3 py-2 break-words overflow-hidden ${
                            msg.senderType === 'USER'
                              ? 'bg-muted border rounded-tl-sm'
                              : msg.senderType === 'MODERATOR'
                              ? 'bg-orange-500 text-white rounded-tr-sm'
                              : msg.senderType === 'BOT'
                              ? 'bg-green-600 text-white rounded-tr-sm'
                              : 'bg-muted-foreground/20 rounded-tr-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Zone saisie — ancrée en bas, jamais couverte */}
            <div className="flex-shrink-0 border-t bg-card px-3 sm:px-4 py-2.5 sm:py-3">
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
                  className="flex-1 min-h-[60px] sm:min-h-[72px] max-h-[120px] resize-none text-sm"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  size="icon"
                  className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 self-end"
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
            <Button size="sm" onClick={assignToMe} className="w-full h-8 text-xs">
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
          <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => updateStatus('CLOSED')}>
            {messages.moderation.conversation.info.closeConversation}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => updateStatus('ACTIVE')}>
            {messages.moderation.conversation.info.reopenConversation}
          </Button>
        )}
      </div>
    </>
  );
}
