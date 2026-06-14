'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  Loader2,
  Crown,
  Store,
  RefreshCw,
} from 'lucide-react';
import { UserRoleBadge } from '@/components/ui/user-role-badge';
import { UserRewardsBlockControls } from '@/components/admin/user-rewards-block-controls';
import Link from 'next/link';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';

interface VipMerchantUser {
  id: string;
  username: string;
  avatar: string;
  steamId64: string;
  userTag: string;
  bonusRatePercent: number;
  affiliateRewardsBlocked?: boolean;
  xpRewardsBlocked?: boolean;
  totalVolume: number;
  joinedAt: string;
}

interface VipMerchantProps {
  tag: 'VIP' | 'MERCHANT';
}

export function VipMerchantManagement({ tag }: VipMerchantProps) {
  const { messages } = useLocale();
  const t = messages.admin.vipMerchantManagement;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: VipMerchantUser | null }>({ open: false, user: null });
  const [newBonusRate, setNewBonusRate] = useState('');
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; user: VipMerchantUser | null }>({ open: false, user: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminUsers({ tag, search: debouncedSearch, page, limit, status: undefined }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('tag', tag);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error(t.fetchUsersError);
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const users: VipMerchantUser[] = (data?.users ?? []).filter(
    (u: VipMerchantUser) => u.userTag === tag
  );
  const totalUsers = users.length;

  const handleEditBonus = async () => {
    if (!editDialog.user) return;
    const rate = parseFloat(newBonusRate);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      toast({ title: t.toastErrorTitle, description: t.bonusRangeError, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editDialog.user.id}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusRatePercent: rate, userTag: tag }),
      });
      if (!res.ok) throw new Error(t.fetchBonusError);

      toast({
        title: t.bonusUpdatedTitle,
        description: t.bonusUpdatedDesc.replace('{username}', editDialog.user.username).replace('{rate}', String(rate)),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditDialog({ open: false, user: null });
    } catch {
      toast({ title: t.toastErrorTitle, description: t.bonusUpdateError, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = async () => {
    if (!removeDialog.user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${removeDialog.user.id}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusRatePercent: 0, userTag: null }),
      });
      if (!res.ok) throw new Error(t.tagRemoveError);

      toast({
        title: t.tagRemovedTitle,
        description: t.tagRemovedDesc.replace('{username}', removeDialog.user.username).replace('{tag}', tag),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setRemoveDialog({ open: false, user: null });
    } catch {
      toast({ title: t.toastErrorTitle, description: t.tagRemoveError, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalVolumeCents = users.reduce((sum, u) => sum + (u.totalVolume || 0), 0);

  const Icon = tag === 'VIP' ? Crown : Store;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-theme-highlight" />
            <div>
              <p className="text-sm text-slate-400">{t.totalWithTagLabel.replace('{tag}', tag)}</p>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">{t.totalVolume}</p>
              <p className="text-2xl font-bold text-white">
                <ConvertedPrice
                  usdCents={totalVolumeCents}
                  fromCurrency="USD"
                  className="text-2xl font-bold text-white"
                />
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">{t.averageBonus}</p>
              <p className="text-2xl font-bold text-white">
                {totalUsers > 0
                  ? (users.reduce((sum, u) => sum + (u.bonusRatePercent || 0), 0) / totalUsers).toFixed(1)
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t.searchPlaceholder.replace('{tag}', tag)}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t.emptyStateLine.replace('{tag}', tag)}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">{t.colUser}</TableHead>
                  <TableHead className="text-slate-400">{t.colBonus}</TableHead>
                  <TableHead className="text-slate-400">{t.colVolume}</TableHead>
                  <TableHead className="text-slate-400">{t.colRewardsBlock ?? 'Rewards'}</TableHead>
                  <TableHead className="text-slate-400">{t.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{user.username}</span>
                            <UserRoleBadge userTag={user.userTag} />
                          </div>
                          <span className="text-xs text-slate-400">{user.steamId64}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-theme-highlight font-semibold">+{user.bonusRatePercent}%</span>
                    </TableCell>
                    <TableCell className="text-white">
                      <ConvertedPrice
                        usdCents={user.totalVolume || 0}
                        fromCurrency="USD"
                        className="text-white"
                      />
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <UserRewardsBlockControls
                        userId={user.id}
                        affiliateRewardsBlocked={user.affiliateRewardsBlocked ?? false}
                        xpRewardsBlocked={user.xpRewardsBlocked ?? false}
                        compact
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-white hover:bg-slate-700"
                          onClick={() => {
                            setEditDialog({ open: true, user });
                            setNewBonusRate(String(user.bonusRatePercent));
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600/50 text-red-400 hover:bg-red-900/20"
                          onClick={() => setRemoveDialog({ open: true, user })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination && data.pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Label className="text-slate-300 text-sm">{t.perPage || 'Par page'}:</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {t.page || 'Page'} {data.pagination.page} / {data.pagination.pages} ({data.pagination.total} {t.total || 'total'})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {t.previous || 'Previous'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!data.pagination.pages || page >= data.pagination.pages}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {t.next || 'Suivant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.dialogEditTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editDialog.user?.username
                ? t.dialogEditDesc.replace('{username}', editDialog.user.username)
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.bonusRateLabel}</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={newBonusRate}
                onChange={(e) => setNewBonusRate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-white" onClick={() => setEditDialog({ open: false, user: null })}>
              {t.cancel}
            </Button>
            <Button onClick={handleEditBonus} disabled={saving} className="bg-theme-stat hover:bg-theme-highlight/90 text-black">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog({ open: false, user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.dialogRemoveTitle.replace('{tag}', tag)}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {removeDialog.user?.username
                ? t.dialogRemoveDesc
                    .replace(/\{tag\}/g, tag)
                    .replace('{username}', removeDialog.user.username)
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-white" onClick={() => setRemoveDialog({ open: false, user: null })}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleRemoveTag} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.dialogRemoveConfirm.replace('{tag}', tag)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
