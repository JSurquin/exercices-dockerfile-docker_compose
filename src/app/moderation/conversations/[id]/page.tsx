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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConversationWithMessages, ChatMessageWithUser } from '@/lib/types/chat';
import { ConversationStatus, SenderType } from '@prisma/client';
import { useSession } from '~/lib/auth-client';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            onClick={() => router.push('/moderation')}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {conversation.subject || messages.moderation.conversation.header.noSubject}
            </h1>
            <p className="text-muted-foreground text-sm truncate">
              {messages.moderation.conversation.header.withUser}{' '}
              {conversation.user?.name || conversation.user?.email || messages.moderation.conversation.header.anonymousUser}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`${conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {conversation.status}
          </Badge>
          <Badge className={`${conversation.priority === 'URGENT' ? 'bg-red-100 text-red-800' : conversation.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
            {conversation.priority}
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Informations de la conversation */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{messages.moderation.conversation.info.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Utilisateur */}
              <div>
                <h4 className="font-medium mb-2 text-sm">{messages.moderation.conversation.info.userTitle}</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={conversation.user?.steamAvatar || undefined} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.user?.name || messages.moderation.conversation.info.anonymous}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.user?.email}
                    </p>
                    {conversation.user?.steamUsername && (
                      <p className="text-xs text-muted-foreground truncate">
                        {messages.moderation.conversation.info.steam} {conversation.user.steamUsername}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignation */}
              <div>
                <h4 className="font-medium mb-2 text-sm">{messages.moderation.conversation.info.assignmentTitle}</h4>
                {conversation.assignedModerator ? (
                  <p className="text-sm truncate">
                    {conversation.assignedModerator.name || conversation.assignedModerator.email}
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{messages.moderation.conversation.info.unassigned}</p>
                    <Button size="sm" onClick={assignToMe} className="w-full">
                      {messages.moderation.conversation.info.assignToMe}
                    </Button>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-medium mb-2 text-sm">{messages.moderation.conversation.info.datesTitle}</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{messages.moderation.conversation.info.created} {formatDate(conversation.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{messages.moderation.conversation.info.updated} {formatDate(conversation.updatedAt)}</span>
                  </div>
                  {conversation.closedAt && (
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-3 h-3 flex-shrink-0" />
                      <span>{messages.moderation.conversation.info.closed} {formatDate(conversation.closedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-medium mb-2 text-sm">{messages.moderation.conversation.info.actionsTitle}</h4>
                <div className="space-y-2">
                  {conversation.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatus('CLOSED')}
                    >
                      {messages.moderation.conversation.info.closeConversation}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatus('ACTIVE')}
                    >
                      {messages.moderation.conversation.info.reopenConversation}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/*
            Layout chat : la card occupe une hauteur fixe calculée pour rester dans le viewport.
            On utilise un div interne en flex-col avec une hauteur explicite plutôt que
            de dépendre de flex-1 sur ScrollArea (Radix ne propage pas correctement la hauteur).
          */}
          <Card className="flex flex-col overflow-hidden" style={{ height: 'clamp(480px, 70vh, 720px)' }}>
            <CardHeader className="flex-shrink-0 pb-3 border-b">
              <CardTitle className="text-base">
                {messages.moderation.conversation.messages.title} ({conversation.messages.length})
              </CardTitle>
            </CardHeader>

            {/* Zone messages scrollable — hauteur = total card - header - zone saisie */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              <div className="space-y-4">
                {conversation.messages.map((msg: ChatMessageWithUser) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderType === 'USER' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className="max-w-[80%] sm:max-w-[70%]">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={senderTypeColors[msg.senderType as keyof typeof senderTypeColors]}
                          variant="secondary"
                        >
                          {senderTypeLabels[msg.senderType as keyof typeof senderTypeLabels]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 sm:px-4 break-words ${
                          msg.senderType === 'USER'
                            ? 'bg-muted border'
                            : msg.senderType === 'MODERATOR'
                            ? 'bg-orange-500 text-white'
                            : msg.senderType === 'BOT'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Zone de saisie — toujours visible en bas, z-index explicite */}
            <div className="flex-shrink-0 border-t bg-background px-4 py-3 z-10">
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
                  className="flex-1 min-h-[72px] max-h-[140px] resize-none"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="flex-shrink-0 h-10 w-10 p-0"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Entrée pour envoyer · Shift+Entrée pour nouvelle ligne
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
