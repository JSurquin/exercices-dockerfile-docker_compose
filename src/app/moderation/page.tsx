'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConversationWithMessages, ConversationFilters, ChatStats } from '@/lib/types/chat';
import { ConversationStatus, ConversationPriority } from '@prisma/client';
import { useSession } from '~/lib/auth-client';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-purple-100 text-purple-800',
};

export default function ModerationPage() {
  const { user } = useAuth();

  const { data: session, isPending } = useSession();

  console.log("mon user sur cette page : ", user);
  const { messages } = useLocale();
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ConversationFilters>({
    status: 'ACTIVE',
    page: 1,
    limit: 20,
  });

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/chat/conversations?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      toast.error('Erreur lors du chargement des conversations');
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/chat/stats');
      if (!response.ok) throw new Error('Erreur lors du chargement des stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const assignConversation = async (conversationId: string, moderatorId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'assignation');
      
      toast.success('Conversation assignée avec succès');
      fetchConversations();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
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

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      toast.success('Statut mis à jour avec succès');
      fetchConversations();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [filters]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Vérifier les permissions
  if (!session?.user || session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">{messages.moderation.accessDenied.title}</h2>
            <p className="text-muted-foreground">
              {messages.moderation.accessDenied.description}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3 text-orange-600" />
            {messages.moderation.title}
          </h1>
          <p className="text-muted-foreground">
            {messages.moderation.subtitle}
          </p>
        </motion.div>

        {/* Statistiques */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{messages.moderation.stats.activeConversations}</p>
                    <p className="text-2xl font-bold">{stats.activeConversations}</p>
                  </div>
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{messages.moderation.stats.unassigned}</p>
                    <p className="text-2xl font-bold">{stats.unassignedConversations}</p>
                  </div>
                  <UserIcon className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{messages.moderation.stats.responseTime}</p>
                    <p className="text-2xl font-bold">{stats.averageResponseTime}min</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{messages.moderation.stats.closed}</p>
                    <p className="text-2xl font-bold">{stats.closedConversations}</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{messages.moderation.filtersTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select
                  value={filters.status || 'ALL'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'ALL' ? undefined : value as ConversationStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={messages.moderation.filters.statusPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.moderation.filters.allStatuses}</SelectItem>
                    <SelectItem value="ACTIVE">{messages.moderation.filters.active}</SelectItem>
                    <SelectItem value="CLOSED">{messages.moderation.filters.closed}</SelectItem>
                    <SelectItem value="ARCHIVED">{messages.moderation.filters.archived}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.priority || 'ALL'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'ALL' ? undefined : value as ConversationPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={messages.moderation.filters.priorityPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.moderation.filters.allPriorities}</SelectItem>
                    <SelectItem value="LOW">{messages.moderation.filters.low}</SelectItem>
                    <SelectItem value="NORMAL">{messages.moderation.filters.normal}</SelectItem>
                    <SelectItem value="HIGH">{messages.moderation.filters.high}</SelectItem>
                    <SelectItem value="URGENT">{messages.moderation.filters.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.assignedTo || 'ALL'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value === 'ALL' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={messages.moderation.filters.assignmentPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.moderation.filters.all}</SelectItem>
                    <SelectItem value="me">{messages.moderation.filters.myConversations}</SelectItem>
                    <SelectItem value="unassigned">{messages.moderation.filters.unassigned}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={messages.moderation.filters.searchPlaceholder}
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des conversations */}
        <Card>
          <CardHeader>
            <CardTitle>{messages.moderation.conversationsCount} ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">{messages.moderation.loading}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{messages.moderation.noConversations}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {conversation.subject || 'Sans sujet'}
                          </h3>
                          <Badge className={priorityColors[conversation.priority]}>
                            {conversation.priority}
                          </Badge>
                          <Badge className={statusColors[conversation.status]}>
                            {conversation.status}
                          </Badge>
                          {conversation.category && (
                            <Badge variant="outline">{conversation.category}</Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">
                            {conversation.user?.name || conversation.user?.email || 'Utilisateur anonyme'}
                          </span>
                          {conversation.user?.steamUsername && (
                            <span> • Steam: {conversation.user.steamUsername}</span>
                          )}
                        </div>

                        {conversation.messages.length > 0 && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conversation.messages[0].content}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Créée le {formatDate(conversation.createdAt)}</span>
                          <span>Mise à jour le {formatDate(conversation.updatedAt)}</span>
                          <span>{conversation._count?.messages || 0} messages</span>
                          {conversation.assignedModerator && (
                            <span>Assignée à {conversation.assignedModerator.name || conversation.assignedModerator.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!conversation.assignedTo && user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignConversation(conversation.id, user.id)}
                          >
                            S&apos;assigner
                          </Button>
                        )}

                        {conversation.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateConversationStatus(conversation.id, 'CLOSED')}
                          >
                            Fermer
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => window.open(`/moderation/conversations/${conversation.id}`, '_blank')}
                        >
                          Ouvrir
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
    </div>
  );
}
