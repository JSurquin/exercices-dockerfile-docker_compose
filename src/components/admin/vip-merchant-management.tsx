'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import Link from 'next/link';
import { queryKeys } from '@/lib/query-keys';

interface VipMerchantUser {
  id: string;
  username: string;
  avatar: string;
  steamId64: string;
  userTag: string;
  bonusRatePercent: number;
  totalVolume: number;
  joinedAt: string;
}

interface VipMerchantProps {
  tag: 'VIP' | 'MERCHANT';
}

export function VipMerchantManagement({ tag }: VipMerchantProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminUsers({ search: debouncedSearch, page, limit: 20, status: undefined }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('tag', tag);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
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
      toast({ title: 'Erreur', description: 'Le bonus doit être entre 0 et 50%', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editDialog.user.id}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusRatePercent: rate, userTag: tag }),
      });
      if (!res.ok) throw new Error('Failed to update bonus');

      toast({ title: 'Bonus mis à jour', description: `${editDialog.user.username} → ${rate}%` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditDialog({ open: false, user: null });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le bonus', variant: 'destructive' });
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
      if (!res.ok) throw new Error('Failed to remove tag');

      toast({ title: 'Tag retiré', description: `${removeDialog.user.username} n'est plus ${tag}` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setRemoveDialog({ open: false, user: null });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de retirer le tag', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (centimes: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(centimes / 100);

  const Icon = tag === 'VIP' ? Crown : Store;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-sm text-slate-400">Total {tag}s</p>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">Volume total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(users.reduce((sum, u) => sum + (u.totalVolume || 0), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Bonus moyen</p>
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
              placeholder={`Rechercher un ${tag}...`}
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
            <p>Aucun utilisateur {tag} trouvé</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Utilisateur</TableHead>
                  <TableHead className="text-slate-400">Bonus</TableHead>
                  <TableHead className="text-slate-400">Volume</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
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
                      <span className="text-amber-400 font-semibold">+{user.bonusRatePercent}%</span>
                    </TableCell>
                    <TableCell className="text-white">
                      {formatCurrency(user.totalVolume || 0)}
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

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier le bonus</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifier le taux de bonus pour {editDialog.user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Taux de bonus (%)</Label>
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
              Annuler
            </Button>
            <Button onClick={handleEditBonus} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog({ open: false, user: null })}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Retirer le statut {tag}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Êtes-vous sûr de vouloir retirer le statut {tag} de {removeDialog.user?.username} ? Son bonus sera remis à 0%.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-white" onClick={() => setRemoveDialog({ open: false, user: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRemoveTag} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Retirer {tag}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
