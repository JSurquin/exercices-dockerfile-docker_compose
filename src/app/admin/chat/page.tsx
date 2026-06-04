'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  EnvelopeIcon,
  UserIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { chatPriorityBadgeClass, chatStatusBadgeClass } from '@/lib/chat-badges';
import { PageLoading } from '@/components/ui/page-loading';

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
  const { data: session } = useSession();
  const user = session?.user;
  const { messages } = useLocale();
  const t = messages.admin.chat.moderators;
  const queryClient = useQueryClient();

  // State — promotion utilisateur existant
  const [users, setUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [promotingUser, setPromotingUser] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State — invitation par email
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: convData, isLoading: loading } = useQuery({
    queryKey: queryKeys.adminChatConversations({ limit: 50 }),
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations?limit=50');
      if (!res.ok) return { conversations: [] };
      return res.json();
    },
  });
  const conversations: ConversationWithMessages[] = convData?.conversations ?? [];

  const { data: moderators = [] } = useQuery({
    queryKey: queryKeys.adminModerators,
    queryFn: async () => {
      const res = await fetch('/api/admin/moderators');
      if (!res.ok) return [];
      const data = await res.json();
      return data.moderators ?? [];
    },
  });

  const { data: chatStats } = useQuery({
    queryKey: queryKeys.adminChatStats,
    queryFn: async () => {
      const res = await fetch('/api/chat/stats');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: moderatorStats = [] } = useQuery({
    queryKey: queryKeys.adminChatModeratorStats,
    queryFn: async () => {
      const res = await fetch('/api/chat/stats/moderators');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.moderatorStats ?? [];
    },
  });

  const invalidateChat = () => queryClient.invalidateQueries({ queryKey: ['admin', 'chat'] });

  const doSearch = async (query: string) => {
    if (!query.trim()) { setUsers([]); return; }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/moderators/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUsers(data.users || []);
    } catch {
      toast.error(t.errorSearch);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce auto-search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(searchUser), 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchUser]);

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
        throw new Error(error.error || t.errorPromote);
      }
      toast.success(t.successPromote);
      setUsers([]);
      setSearchUser('');
      setAddDialogOpen(false);
      invalidateChat();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPromotingUser(false);
    }
  };

  const inviteModerator = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error(t.invalidEmail);
      return;
    }
    setInviting(true);
    try {
      const response = await fetch('/api/admin/moderators/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName || undefined }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.errorInvite);
      }
      const data = await response.json();
      if (data.emailError) {
        toast.warning(t.accountCreatedEmailFailed);
      } else {
        toast.success(data.invited ? t.successInvite : t.successInviteExisting);
      }
      setInviteEmail('');
      setInviteName('');
      setAddDialogOpen(false);
      invalidateChat();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviting(false);
    }
  };

  const demoteModerator = async (moderatorId: string) => {
    try {
      const response = await fetch(`/api/admin/moderators/${moderatorId}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.errorDemote);
      }
      toast.success(t.successDemote);
      invalidateChat();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateConversationStatus = async (
    conversationId: string,
    status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  ) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      if (status === 'CLOSED') toast.success(t.successClose);
      else if (status === 'ACTIVE') toast.success(t.successReopen);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChatConversations({ limit: 50 }) });
    } catch {
      if (status === 'CLOSED') toast.error(t.errorClose);
      else toast.error(t.errorReopen);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast.success(t.successDelete);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChatConversations({ limit: 50 }) });
    } catch {
      toast.error(t.errorDelete);
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (!user || (user as any).role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-theme-accent" />
            <h2 className="text-2xl font-bold mb-2 text-white">{messages.admin.chat.accessDenied}</h2>
            <p className="text-slate-400">{messages.admin.chat.accessDeniedDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2 text-white">
          <ChatBubbleLeftRightIcon className="w-7 h-7 sm:w-8 sm:h-8 text-theme-accent shrink-0" />
          {messages.admin.chat.title}
        </h1>
        <p className="text-slate-400">{messages.admin.chat.subtitle}</p>
      </motion.div>

      {/* Stats */}
      {chatStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.chat.stats.totalConversations}</p>
                  <p className="text-2xl font-bold text-white">{chatStats.totalConversations}</p>
                </div>
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.chat.stats.activeConversations}</p>
                  <p className="text-2xl font-bold text-white">{chatStats.activeConversations}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.chat.stats.unassigned}</p>
                  <p className="text-2xl font-bold text-white">{chatStats.unassignedConversations}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-theme-highlight" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.chat.stats.responseTime}</p>
                  <p className="text-2xl font-bold text-white">{chatStats.averageResponseTime}min</p>
                </div>
                <ClockIcon className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="conversations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700 h-auto">
          <TabsTrigger
            value="conversations"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{messages.admin.chat.tabs.conversations}</span>
            <span className="sm:hidden text-[10px]">Convs</span>
          </TabsTrigger>
          <TabsTrigger
            value="moderators"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <UserGroupIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{messages.admin.chat.tabs.moderators}</span>
            <span className="sm:hidden text-[10px]">Modos</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <ChartBarIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{messages.admin.chat.tabs.stats}</span>
            <span className="sm:hidden text-[10px]">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Onglet Conversations ─── */}
        <TabsContent value="conversations">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                {messages.admin.chat.conversations.title} ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <PageLoading
                  variant="compact"
                  message={messages.admin.chat.conversations.loading}
                />
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">{messages.admin.chat.conversations.noConversations}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.slice(0, 20).map((conv) => (
                    <div
                      key={conv.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-900/40 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate">
                            {conv.subject || messages.admin.chat.conversations.noSubject}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${chatStatusBadgeClass(conv.status)}`}>
                            {conv.status}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${chatPriorityBadgeClass(conv.priority)}`}>
                            {conv.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          <span className="font-medium text-slate-300">
                            {conv.user?.name || conv.user?.email || messages.admin.chat.conversations.anonymousUser}
                          </span>
                          {conv.assignedModerator && (
                            <span>
                              {' '}• {messages.admin.chat.conversations.assignedTo}{' '}
                              {conv.assignedModerator.name || conv.assignedModerator.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>{messages.admin.chat.conversations.createdOn} {formatDate(conv.createdAt)}</span>
                          <span>{conv._count?.messages || 0} {messages.admin.chat.conversations.messages}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:text-white text-xs"
                          onClick={() => window.open(`/moderation/conversations/${conv.id}`, '_blank')}
                        >
                          {messages.admin.chat.conversations.view}
                        </Button>

                        {conv.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs"
                            onClick={() => updateConversationStatus(conv.id, 'CLOSED')}
                            title={t.closeTicket}
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10 text-xs"
                            onClick={() => updateConversationStatus(conv.id, 'ACTIVE')}
                            title={t.reopenTicket}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                          onClick={() => deleteConversation(conv.id)}
                          title={t.deleteTicket}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Onglet Modérateurs ─── */}
        <TabsContent value="moderators">
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                  <span>{t.title}</span>
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        {t.addModerator}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg w-[calc(100vw-2rem)] sm:w-full max-h-[90dvh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">{t.addModerator}</DialogTitle>
                      </DialogHeader>

                      <Tabs defaultValue="invite" className="mt-2">
                        <TabsList className="grid grid-cols-2 bg-slate-800 border border-slate-700">
                          <TabsTrigger
                            value="invite"
                            className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-300 flex items-center gap-2"
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            {t.inviteTab}
                          </TabsTrigger>
                          <TabsTrigger
                            value="promote"
                            className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-300 flex items-center gap-2"
                          >
                            <UserIcon className="w-4 h-4" />
                            {t.promoteTab}
                          </TabsTrigger>
                        </TabsList>

                        {/* Invitation par email */}
                        <TabsContent value="invite" className="space-y-4 mt-4">
                          <Alert className="border-blue-500/30 bg-blue-500/10">
                            <EnvelopeIcon className="h-4 w-4 text-blue-400" />
                            <AlertDescription className="text-blue-300 text-sm">
                              {t.inviteEmailWarning}
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <Label className="text-slate-200">{t.inviteEmailLabel}</Label>
                            <Input
                              type="email"
                              placeholder={t.inviteEmailPlaceholder}
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && inviteModerator()}
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-200">{t.inviteNameLabel}</Label>
                            <Input
                              placeholder={t.inviteNamePlaceholder}
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          <Button
                            onClick={inviteModerator}
                            disabled={inviting || !inviteEmail}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <EnvelopeIcon className="w-4 h-4 mr-2" />
                            {inviting ? t.inviting : t.inviteSubmit}
                          </Button>
                        </TabsContent>

                        {/* Promotion d'un compte Steam existant */}
                        <TabsContent value="promote" className="space-y-4 mt-4">
                          <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder={t.searchPlaceholder}
                              value={searchUser}
                              onChange={(e) => setSearchUser(e.target.value)}
                              className="bg-slate-800 border-slate-600 text-white pl-9 pr-9"
                            />
                            {searchLoading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>

                          {users.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {users.map((u) => (
                                <div
                                  key={u.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarImage src={u.steamAvatar || undefined} />
                                      <AvatarFallback className="bg-slate-700 text-white text-xs">
                                        {u.name?.[0] || u.email[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium text-white truncate">{u.name || t.noName}</p>
                                      <p className="text-sm text-slate-400 truncate">{u.email}</p>
                                      {u.steamUsername && (
                                        <p className="text-xs text-slate-500 truncate">Steam: {u.steamUsername}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => promoteToModerator(u.id)}
                                    disabled={promotingUser}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 ml-2"
                                  >
                                    {promotingUser ? t.promoting : t.promote}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moderators.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">{t.noModerators}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moderators.map((moderator: Moderator) => (
                      <div
                        key={moderator.id}
                        className="flex flex-col gap-3 p-4 rounded-lg bg-slate-900/40 border border-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={moderator.steamAvatar || undefined} />
                            <AvatarFallback className="bg-slate-700 text-white">
                              {moderator.name?.[0] || moderator.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white truncate">{moderator.name || t.noName}</h3>
                            <p className="text-sm text-slate-400 truncate">{moderator.email}</p>
                            {moderator.steamUsername && (
                              <p className="text-xs text-slate-500 truncate">Steam: {moderator.steamUsername}</p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              moderator.role === 'ADMIN'
                                ? 'bg-red-500/20 border-red-500/30 text-red-400 shrink-0'
                                : 'bg-blue-500/20 border-blue-500/30 text-blue-400 shrink-0'
                            }
                          >
                            {moderator.role}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/50">
                          <div className="text-sm">
                            <p className="font-medium text-white">{moderator._count.assignedConversations} {t.conversations}</p>
                            <p className="text-slate-400">{moderator._count.chatMessages} messages</p>
                          </div>
                          {moderator.role === 'MODERATOR' && moderator.id !== user.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 shrink-0"
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

        {/* ─── Onglet Statistiques ─── */}
        <TabsContent value="stats">
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.chat.performance.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {moderatorStats.length === 0 ? (
                  <div className="text-center py-8">
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">{messages.admin.chat.performance.noStats}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moderatorStats.map((stat: ModeratorStats) => (
                      <div
                        key={stat.id}
                        className="flex flex-col gap-4 p-4 rounded-lg bg-slate-900/40 border border-slate-700"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{stat.name || t.noName}</h3>
                          <p className="text-sm text-slate-400 truncate">{stat.email}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.assignedConversations}</p>
                            <p className="text-xs text-slate-400">{messages.admin.chat.performance.assigned}</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.closedConversations}</p>
                            <p className="text-xs text-slate-400">{messages.admin.chat.performance.closed}</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.totalMessages}</p>
                            <p className="text-xs text-slate-400">{messages.admin.chat.performance.messages}</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.averageResponseTime}min</p>
                            <p className="text-xs text-slate-400">{messages.admin.chat.performance.avgTime}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {chatStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{messages.admin.chat.priority.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(chatStats.conversationsByPriority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <Badge variant="outline" className={`text-xs ${chatPriorityBadgeClass(priority)}`}>
                            {priority}
                          </Badge>
                          <span className="font-semibold text-white">{count as string}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{messages.admin.chat.category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(chatStats.conversationsByCategory).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{category}</Badge>
                          <span className="font-semibold text-white">{count as string}</span>
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
  );
}
