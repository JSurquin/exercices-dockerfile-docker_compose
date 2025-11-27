'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/providers/auth-provider';
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
  const { data: session, isPending } = useSession();

  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Conversation non trouvée');
          router.push('/moderation');
          return;
        }
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();
      setConversation(data);
    } catch (error) {
      toast.error('Erreur lors du chargement de la conversation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
      await fetchConversation();
      toast.success('Message envoyé');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
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
      
      await fetchConversation();
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
      
      await fetchConversation();
      toast.success('Conversation assignée');
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversation();
  }, [params.id]);

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
            <h2 className="text-2xl font-bold mb-2">Conversation non trouvée</h2>
            <Button onClick={() => router.push('/moderation')}>
              Retour à la modération
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
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/moderation')}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {conversation.subject || 'Conversation sans sujet'}
            </h1>
            <p className="text-muted-foreground">
              avec {conversation.user?.name || conversation.user?.email || 'Utilisateur anonyme'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {conversation.status}
          </Badge>
          <Badge className={`${conversation.priority === 'URGENT' ? 'bg-red-100 text-red-800' : conversation.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
            {conversation.priority}
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Informations de la conversation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Utilisateur */}
              <div>
                <h4 className="font-medium mb-2">Utilisateur</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversation.user?.steamAvatar || undefined} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {conversation.user?.name || 'Anonyme'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conversation.user?.email}
                    </p>
                    {conversation.user?.steamUsername && (
                      <p className="text-xs text-muted-foreground">
                        Steam: {conversation.user.steamUsername}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignation */}
              <div>
                <h4 className="font-medium mb-2">Assignation</h4>
                {conversation.assignedModerator ? (
                  <p className="text-sm">
                    {conversation.assignedModerator.name || conversation.assignedModerator.email}
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Non assignée</p>
                    <Button size="sm" onClick={assignToMe}>
                      M&apos;assigner
                    </Button>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-medium mb-2">Dates</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" />
                    <span>Créée: {formatDate(conversation.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-3 h-3" />
                    <span>Mise à jour: {formatDate(conversation.updatedAt)}</span>
                  </div>
                  {conversation.closedAt && (
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-3 h-3" />
                      <span>Fermée: {formatDate(conversation.closedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  {conversation.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatus('CLOSED')}
                    >
                      Fermer la conversation
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatus('ACTIVE')}
                    >
                      Rouvrir la conversation
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">
                Messages ({conversation.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Zone de messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversation.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.senderType === 'USER' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] ${msg.senderType === 'USER' ? 'order-1' : 'order-2'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={senderTypeColors[msg.senderType]} variant="secondary">
                            {senderTypeLabels[msg.senderType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
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
              </ScrollArea>

              {/* Zone de saisie */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tapez votre réponse..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 min-h-[80px] resize-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || sending}
                    className="self-end"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
