'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { Ban, RefreshCw, ShieldOff, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, zhCN } from 'date-fns/locale';
import { PageLoading } from '@/components/ui/page-loading';
import { queryKeys } from '@/lib/query-keys';
import { User as UserType } from '@/lib/types';

export function BannedUsersManagement() {
  const { toast } = useToast();
  const { locale, messages } = useLocale();
  const t = messages.admin.bannedUsers;
  const banT = messages.admin.userBanManagement;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [unbanningId, setUnbanningId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.adminUsers({ banned: 'true', search: debouncedSearch, page: 1, limit: 100 }),
    queryFn: async () => {
      const params = new URLSearchParams({
        banned: 'true',
        page: '1',
        limit: '100',
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(t.loadError);
      return res.json() as Promise<{ users: UserType[]; pagination: { total: number } }>;
    },
  });

  const getDateFnsLocale = () => {
    switch (locale) {
      case 'en':
        return enUS;
      case 'cn':
        return zhCN;
      default:
        return fr;
    }
  };

  const handleUnban = async (userId: string) => {
    setUnbanningId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || banT.errorTitle);

      toast({ title: banT.unbanSuccessTitle, description: banT.unbanSuccessDesc });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      toast({
        title: banT.errorTitle,
        description: e instanceof Error ? e.message : banT.errorSave,
        variant: 'destructive',
      });
    } finally {
      setUnbanningId(null);
    }
  };

  const bannedUsers = data?.users ?? [];

  if (isLoading) {
    return <PageLoading variant="compact" message={t.loading} className="min-h-[30vh]" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400" />
            {t.searchTitle}
          </CardTitle>
          <CardDescription className="text-slate-400">{t.searchDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="bg-slate-700 border-slate-600 text-white max-w-md"
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              {t.listTitle}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {data?.pagination.total ?? bannedUsers.length} {t.entriesFound}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {bannedUsers.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t.noEntries}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">{t.table.user}</TableHead>
                    <TableHead className="text-slate-400">{t.table.reason}</TableHead>
                    <TableHead className="text-slate-400">{t.table.expires}</TableHead>
                    <TableHead className="text-slate-400 text-right">{t.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.username} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{user.username}</p>
                            <p className="text-xs text-slate-500">{user.steamId64}</p>
                          </div>
                          <Badge variant="destructive" className="ml-1">
                            {banT.bannedBadge}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs">
                        <p className="truncate">{user.banReason || banT.noReason}</p>
                      </TableCell>
                      <TableCell className="text-slate-400 whitespace-nowrap">
                        {user.banExpires
                          ? format(new Date(user.banExpires), 'dd/MM/yyyy HH:mm', {
                              locale: getDateFnsLocale(),
                            })
                          : t.permanent}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300"
                          >
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              {t.viewProfile}
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnban(user.id)}
                            disabled={unbanningId === user.id}
                            className="border-green-600/50 text-green-400 hover:bg-green-500/10"
                          >
                            <ShieldOff className="h-4 w-4 mr-1" />
                            {unbanningId === user.id ? banT.processing : t.unbanButton}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
