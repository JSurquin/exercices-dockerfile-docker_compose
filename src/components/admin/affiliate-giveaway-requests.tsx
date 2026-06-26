'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeImg } from '@/components/ui/safe-image';
import { SkinPickerModal, type SkinItem } from '@/components/admin/skin-picker-modal';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { Gift, Check, X, Loader2 } from 'lucide-react';
import { AdminUserLink } from '@/components/admin/admin-user-link';

interface GiveawayRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  winnerCount: number;
  costCents: number;
  adminMessage?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  availableCents: number;
  affiliate: { id: string; code: string };
  user: {
    id: string;
    steamUsername?: string | null;
    steamAvatar?: string | null;
    email: string;
  };
  giveaway?: { id: string; title: string; status: string } | null;
}

export default function AffiliateGiveawayRequests() {
  const { messages } = useLocale();
  const t = messages.admin.affiliateGiveawayRequests;
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GiveawayRequestRow | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<SkinItem | null>(null);
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminAffiliateGiveawayRequests(statusFilter),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter === 'all' ? 'all' : statusFilter,
      });
      const response = await fetch(`/api/admin/affiliate-giveaway-requests?${params}`);
      return response.json();
    },
    refetchInterval: 30_000,
  });

  const requests: GiveawayRequestRow[] = data?.data?.requests ?? [];
  const totalPages: number = data?.data?.pagination?.pages ?? 1;
  const pendingCount: number = data?.data?.pendingCount ?? 0;

  const openApprove = (row: GiveawayRequestRow) => {
    setSelected(row);
    setTitle(`Giveaway ${row.affiliate.code}`);
    setDescription(`Giveaway privé organisé par ${row.affiliate.code}`);
    setSelectedSkin(null);
    setShowApprove(true);
  };

  const openReject = (row: GiveawayRequestRow) => {
    setSelected(row);
    setRejectionReason('');
    setShowReject(true);
  };

  const handleApprove = async () => {
    if (!selected || !selectedSkin) return;
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/affiliate-giveaway-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId: selected.id,
          data: {
            title,
            description,
            prize: selectedSkin.steam_market_hash_name,
            prizeImageUrl: selectedSkin.icon_url ?? null,
            steamMarketHashName: selectedSkin.steam_market_hash_name,
            rewardValueCents:
              selectedSkin.price != null ? Math.round(selectedSkin.price * 100) : selected.costCents,
          },
        }),
      });
      const json = await response.json();
      if (json.success) {
        toast({ title: t.success, description: t.approveSuccess });
        setShowApprove(false);
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-giveaway-requests'] });
      } else {
        toast({
          title: t.error,
          description: json.error || t.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: t.error, description: t.error, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/affiliate-giveaway-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId: selected.id,
          data: { rejectionReason },
        }),
      });
      const json = await response.json();
      if (json.success) {
        toast({ title: t.success, description: t.rejectSuccess });
        setShowReject(false);
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-giveaway-requests'] });
      } else {
        toast({
          title: t.error,
          description: json.error || t.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: t.error, description: t.error, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: GiveawayRequestRow['status']) => {
    const map = {
      PENDING: t.filterPending,
      APPROVED: t.filterApproved,
      REJECTED: t.filterRejected,
    };
    return map[status];
  };

  const canApproveSelected =
    selected &&
    selected.availableCents >= selected.costCents &&
    selectedSkin &&
    title.trim() &&
    description.trim();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5" />
            {t.title}
            {pendingCount > 0 && (
              <Badge variant="destructive">
                {pendingCount} {t.pendingBadge}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-slate-900 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="PENDING">{t.filterPending}</SelectItem>
              <SelectItem value="APPROVED">{t.filterApproved}</SelectItem>
              <SelectItem value="REJECTED">{t.filterRejected}</SelectItem>
            </SelectContent>
          </Select>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="rounded-md border border-slate-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">{t.colAffiliate}</TableHead>
                    <TableHead className="text-slate-300">{t.colDates}</TableHead>
                    <TableHead className="text-slate-300">{t.colWinners}</TableHead>
                    <TableHead className="text-slate-300">{t.colCost}</TableHead>
                    <TableHead className="text-slate-300">{t.colBalance}</TableHead>
                    <TableHead className="text-slate-300">{t.colStatus}</TableHead>
                    <TableHead className="text-slate-300">{t.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                        {t.noRequests}
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((row) => (
                      <TableRow key={row.id} className="border-slate-700">
                        <TableCell>
                          <AdminUserLink
                            userId={row.user.id}
                            name={row.user.steamUsername || row.user.email}
                            avatar={row.user.steamAvatar}
                            subtitle={row.affiliate.code}
                          />
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {new Date(row.startDate).toLocaleDateString()} →{' '}
                          {new Date(row.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-slate-300">{row.winnerCount}</TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCentsToCurrency(row.costCents, 'EUR')}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatCentsToCurrency(row.availableCents, 'EUR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{statusBadge(row.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openApprove(row)}>
                                <Check className="h-3 w-3 mr-1" />
                                {t.approve}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400"
                                onClick={() => openReject(row)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                {t.reject}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </Button>
              <span className="text-slate-400 text-sm self-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t.approveTitle}</DialogTitle>
            <DialogDescription>{t.approveDesc}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.adminMessage && (
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-slate-300">{t.adminMessage}:</span>{' '}
                  {selected.adminMessage}
                </p>
              )}
              {selected.availableCents < selected.costCents && (
                <p className="text-sm text-amber-400">
                  {t.insufficientBalance
                    .replace('{available}', formatCentsToCurrency(selected.availableCents, 'EUR'))
                    .replace('{cost}', formatCentsToCurrency(selected.costCents, 'EUR'))}
                </p>
              )}
              <div className="space-y-2">
                <Label>{t.titleLabel}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.descriptionLabel}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.prizeLabel}</Label>
                {selectedSkin ? (
                  <div className="flex items-center gap-3 p-2 rounded border border-slate-600">
                    {selectedSkin.icon_url && (
                      <SafeImg src={selectedSkin.icon_url} alt="" className="h-10 w-10" />
                    )}
                    <span className="text-sm text-white truncate flex-1">
                      {selectedSkin.steam_market_hash_name}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedSkin(null)}>
                      ×
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setSkinPickerOpen(true)}>
                    {t.selectSkin}
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowApprove(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={!canApproveSelected || processing}
              onClick={handleApprove}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : t.confirmApprove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.rejectTitle}</DialogTitle>
            <DialogDescription>{t.rejectDesc}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="…"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReject(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" disabled={processing} onClick={handleReject}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : t.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SkinPickerModal
        open={skinPickerOpen}
        onOpenChange={setSkinPickerOpen}
        onSelect={(skin) => {
          setSelectedSkin(skin);
          setSkinPickerOpen(false);
        }}
        selected={selectedSkin}
      />
    </div>
  );
}
