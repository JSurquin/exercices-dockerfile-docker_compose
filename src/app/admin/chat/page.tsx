'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSession } from '~/lib/auth-client';
import { ConversationWithMessages, ChatStats, ModeratorStats } from '@/lib/types/chat';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Moderator {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  steamUsername: string | null;
  steamAvatar: string | null;
  _count: {
    assignedConversations: number;
    chatMessages: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  steamUsername: string | null;
  steamAvatar: string | null;
}

export default function AdminChatPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [moderatorStats, setModeratorStats] = useState<ModeratorStats[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [promotingUser, setPromotingUser] = useState(false);

  const fetchData = async () => {
    try {
      const [conversationsRes, moderatorsRes, statsRes, moderatorStatsRes] = await Promise.all([
        fetch('/api/chat/conversations?limit=50'),
        fetch('/api/admin/moderators'),
        fetch('/api/chat/stats'),
        fetch('/api/chat/stats/moderators', { method: 'POST' }),
      ]);

      if (conversationsRes.ok) {
        const convData = await conversationsRes.json();
        setConversations(convData.conversations);
      }

      if (moderatorsRes.ok) {
        const modData = await moderatorsRes.json();
        setModerators(modData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setChatStats(statsData);
      }

      if (moderatorStatsRes.ok) {
        const modStatsData = await moderatorStatsRes.json();
        setModeratorStats(modStatsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchUser.trim()) return;

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchUser)}&role=USER`);
      if (!response.ok) throw new Error('Erreur de recherche');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
      console.error(error);
    }
  };

  const promoteToModerator = async (userId: string) => {
    setPromotingUser(true);
    try {
      const response = await fetch('/api/admin/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la promotion');
      }

      toast.success('Utilisateur promu modérateur avec succès');
      setSelectedUser(null);
      setUsers([]);
      setSearchUser('');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setPromotingUser(false);
    }
  };

  const demoteModerator = async (moderatorId: string) => {
    try {
      const response = await fetch(`/api/admin/moderators/${moderatorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la rétrogradation');
      }

      toast.success('Modérateur rétrogradé avec succès');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Vérifier les permissions admin
  if (!user || (user as any).role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">
              Vous devez être administrateur pour accéder à cette page.
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
            Gestion du Chat
          </h1>
          <p className="text-muted-foreground">
            Gérez les conversations, modérateurs et statistiques du système de chat
          </p>
        </motion.div>

        {/* Statistiques générales */}
        {chatStats && (
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
                    <p className="text-sm text-muted-foreground">Total conversations</p>
                    <p className="text-2xl font-bold">{chatStats.totalConversations}</p>
                  </div>
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversations actives</p>
                    <p className="text-2xl font-bold">{chatStats.activeConversations}</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Non assignées</p>
                    <p className="text-2xl font-bold">{chatStats.unassignedConversations}</p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Temps de réponse</p>
                    <p className="text-2xl font-bold">{chatStats.averageResponseTime}min</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="moderators">Modérateurs</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          {/* Onglet Conversations */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Conversations récentes ({conversations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Chargement...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune conversation trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.slice(0, 10).map((conversation) => (
                      <div
                        key={conversation.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {conversation.subject || 'Sans sujet'}
                              </h3>
                              <Badge className={`${conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {conversation.status}
                              </Badge>
                              <Badge className={`${conversation.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {conversation.priority}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">
                                {conversation.user?.name || conversation.user?.email || 'Utilisateur anonyme'}
                              </span>
                              {conversation.assignedModerator && (
                                <span> • Assignée à {conversation.assignedModerator.name || conversation.assignedModerator.email}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Créée le {formatDate(conversation.createdAt)}</span>
                              <span>{conversation._count?.messages || 0} messages</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => window.open(`/moderation/conversations/${conversation.id}`, '_blank')}
                          >
                            Voir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Modérateurs */}
          <TabsContent value="moderators">
            <div className="space-y-6">
              {/* Ajouter un modérateur */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Gestion des modérateurs</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Ajouter un modérateur
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Promouvoir un utilisateur</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Rechercher un utilisateur par email..."
                              value={searchUser}
                              onChange={(e) => setSearchUser(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                            />
                            <Button onClick={searchUsers}>
                              <MagnifyingGlassIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          {users.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {users.map((u) => (
                                <div
                                  key={u.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={u.steamAvatar || undefined} />
                                      <AvatarFallback>{u.name?.[0] || u.email[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{u.name || 'Sans nom'}</p>
                                      <p className="text-sm text-muted-foreground">{u.email}</p>
                                      {u.steamUsername && (
                                        <p className="text-xs text-muted-foreground">Steam: {u.steamUsername}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => promoteToModerator(u.id)}
                                    disabled={promotingUser}
                                  >
                                    {promotingUser ? 'Promotion...' : 'Promouvoir'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {moderators.length === 0 ? (
                    <div className="text-center py-8">
                      <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun modérateur trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moderators.map((moderator) => (
                        <div
                          key={moderator.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={moderator.steamAvatar || undefined} />
                              <AvatarFallback>{moderator.name?.[0] || moderator.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{moderator.name || 'Sans nom'}</h3>
                              <p className="text-sm text-muted-foreground">{moderator.email}</p>
                              {moderator.steamUsername && (
                                <p className="text-xs text-muted-foreground">Steam: {moderator.steamUsername}</p>
                              )}
                            </div>
                            <Badge className={moderator.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                              {moderator.role}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <p className="font-medium">{moderator._count.assignedConversations} conversations</p>
                              <p className="text-muted-foreground">{moderator._count.chatMessages} messages</p>
                            </div>
                            {moderator.role === 'MODERATOR' && moderator.id !== user.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => demoteModerator(moderator.id)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Statistiques */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Statistiques des modérateurs */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance des modérateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  {moderatorStats.length === 0 ? (
                    <div className="text-center py-8">
                      <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune statistique disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moderatorStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h3 className="font-semibold">{stat.name || 'Sans nom'}</h3>
                            <p className="text-sm text-muted-foreground">{stat.email}</p>
                          </div>
                          <div className="grid grid-cols-4 gap-8 text-center">
                            <div>
                              <p className="text-2xl font-bold">{stat.assignedConversations}</p>
                              <p className="text-xs text-muted-foreground">Assignées</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stat.closedConversations}</p>
                              <p className="text-xs text-muted-foreground">Fermées</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stat.totalMessages}</p>
                              <p className="text-xs text-muted-foreground">Messages</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stat.averageResponseTime}min</p>
                              <p className="text-xs text-muted-foreground">Temps moyen</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques par catégorie et priorité */}
              {chatStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversations par priorité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(chatStats.conversationsByPriority).map(([priority, count]) => (
                          <div key={priority} className="flex items-center justify-between">
                            <Badge className={
                              priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              priority === 'NORMAL' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {priority}
                            </Badge>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversations par catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(chatStats.conversationsByCategory).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <Badge variant="outline">{category}</Badge>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
