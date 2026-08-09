'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { useLocale } from '@/components/providers/locale-provider';
import { AdminUserLink } from '@/components/admin/admin-user-link';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface MerchantWithdrawRequest {
  id: string;
  reference: string | null;
  status: string;
  amountCents: number;
  netCents: number;
  createdAt: string;
  paidAt: string | null;
  errorMessage: string | null;
  paymentReference: string | null;
  subtype: 'bank' | 'crypto' | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    steamUsername: string | null;
    steamAvatar: string | null;
  } | null;
  coordinates: {
    subtype: 'bank';
    accountHolder: string;
    fullIban: string;
    maskedIban: string;
    bic: string;
    country: string;
  } | {
    subtype: 'crypto';
    asset: string;
    network: string;
    fullAddress: string;
    maskedAddress: string;
    memo: string | null;
  } | null;
}

export default function AdminMerchantWithdrawalsPage() {
  const { messages } = useLocale();
  const t = messages.adminMerchantWithdrawals;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detailModal, setDetailModal] = useState<MerchantWithdrawRequest | null>(null);
  const [approveModal, setApproveModal] = useState<MerchantWithdrawRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<MerchantWithdrawRequest | null>(null);
  const [approveReference, setApproveReference] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [limit, statusFilter]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-merchant-withdrawals', statusFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/admin/merchant-withdrawals?${params}`);
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
  });

  const requests: MerchantWithdrawRequest[] = data?.requests ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge className="bg-theme-stat text-white">{t.status.pending}</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-500 text-white">{t.status.processing}</Badge>;
      case 'PAID':
        return <Badge className="bg-green-500 text-white">{t.status.paid}</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500 text-white">{t.status.rejected}</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white">{status}</Badge>;
    }
  };

  const patchRequest = async (
    payoutId: string,
    body: Record<string, string>,
    successMsg: string,
    errorMsg: string,
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/merchant-withdrawals/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? errorMsg);
      toast.success(successMsg);
      queryClient.invalidateQueries({ queryKey: ['admin-merchant-withdrawals'] });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcess = async (req: MerchantWithdrawRequest) => {
    await patchRequest(req.id, { action: 'process' }, t.toast.processSuccess, t.toast.processError);
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    if (!approveReference.trim()) {
      toast.error(t.referenceRequired);
      return;
    }
    const ok = await patchRequest(
      approveModal.id,
      {
        action: 'approve',
        reference: approveReference.trim(),
        internalNote: internalNote.trim() || '',
      },
      t.toast.approveSuccess,
      t.toast.approveError,
    );
    if (ok) {
      setApproveModal(null);
      setApproveReference('');
      setInternalNote('');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error(t.rejectReasonRequired);
      return;
    }
    const ok = await patchRequest(
      rejectModal.id,
      { action: 'reject', reason: rejectReason.trim() },
      t.toast.rejectSuccess,
      t.toast.rejectError,
    );
    if (ok) {
      setRejectModal(null);
      setRejectReason('');
    }
  };

  const renderDestination = (req: MerchantWithdrawRequest) => {
    if (!req.coordinates) return '-';
    if (req.coordinates.subtype === 'bank') {
      return (
        <span className="font-mono text-xs text-white">
          {req.coordinates.fullIban.replace(/(.{4})/g, '$1 ').trim()}
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-white break-all">
        {req.coordinates.fullAddress}
      </span>
    );
  };

  const renderDetailCoordinates = (req: MerchantWithdrawRequest) => {
    if (!req.coordinates) return null;
    if (req.coordinates.subtype === 'bank') {
      return (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-slate-400 text-xs uppercase">{t.columns.destination}</p>
            <p className="select-all font-mono text-theme-highlight">{req.coordinates.fullIban}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase">BIC</p>
            <p className="select-all font-mono">{req.coordinates.bic}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase">{t.subtypeBank}</p>
            <p className="select-all">{req.coordinates.accountHolder}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase">{t.columns.type}</p>
            <p>{req.coordinates.country}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs uppercase">{t.columns.destination}</p>
          <p className="select-all font-mono text-theme-highlight break-all">{req.coordinates.fullAddress}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase">{t.subtypeCrypto}</p>
          <p>{req.coordinates.asset} / {req.coordinates.network}</p>
        </div>
        {req.coordinates.memo && (
          <div>
            <p className="text-slate-400 text-xs uppercase">Memo</p>
            <p className="select-all font-mono">{req.coordinates.memo}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BanknotesIcon className="w-7 h-7 text-violet-400" />
            {t.title}
          </h1>
          <p className="text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600 text-slate-300">
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          {t.refresh}
        </Button>
      </motion.div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <Label className="text-slate-300 text-sm shrink-0">{t.statusLabel} :</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">{t.filters.all}</SelectItem>
                <SelectItem value="pending">{t.filters.pending}</SelectItem>
                <SelectItem value="processing">{t.filters.processing}</SelectItem>
                <SelectItem value="paid">{t.filters.paid}</SelectItem>
                <SelectItem value="rejected">{t.filters.rejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">{total} demande{total !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-slate-400 py-12">{t.emptyState}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-left">
                    <th className="pb-3 pr-4">{t.columns.user}</th>
                    <th className="pb-3 pr-4">{t.columns.amount}</th>
                    <th className="pb-3 pr-4">{t.columns.type}</th>
                    <th className="pb-3 pr-4">{t.columns.destination}</th>
                    <th className="pb-3 pr-4">{t.columns.date}</th>
                    <th className="pb-3 pr-4">{t.columns.status}</th>
                    <th className="pb-3">{t.columns.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-700/20">
                      <td className="py-4 pr-4">
                        {req.user && (
                          <AdminUserLink
                            userId={req.user.id}
                            name={req.user.name ?? req.user.steamUsername ?? t.columns.user}
                            avatar={req.user.steamAvatar}
                            email={req.user.email}
                            showEmail
                          />
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-green-400 font-bold">{formatCentsToCurrency(req.netCents, 'EUR')}</p>
                        <p className="text-slate-500 text-xs">{t.amountLabels.fees}: 0 %</p>
                      </td>
                      <td className="py-4 pr-4">
                        {req.subtype === 'bank' ? t.subtypeBank : req.subtype === 'crypto' ? t.subtypeCrypto : '-'}
                      </td>
                      <td className="py-4 pr-4 max-w-[200px]">{renderDestination(req)}</td>
                      <td className="py-4 pr-4 text-xs text-slate-300">
                        {new Date(req.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-4 pr-4">{getStatusBadge(req.status)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setDetailModal(req)} className="h-8 text-xs">
                            Détail
                          </Button>
                          {req.status === 'PENDING_APPROVAL' && (
                            <Button size="sm" onClick={() => handleProcess(req)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                              <ClockIcon className="w-3.5 h-3.5 mr-1" />
                              {t.actions.process}
                            </Button>
                          )}
                          {['PENDING_APPROVAL', 'PROCESSING'].includes(req.status) && (
                            <>
                              <Button size="sm" onClick={() => { setApproveModal(req); setApproveReference(''); setInternalNote(''); }} className="h-8 text-xs bg-green-600 hover:bg-green-700">
                                <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                                {t.actions.approve}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setRejectModal(req); setRejectReason(''); }} className="h-8 text-xs border-red-600 text-red-400">
                                <XCircleIcon className="w-3.5 h-3.5 mr-1" />
                                {t.actions.reject}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailModal} onOpenChange={(o) => !o && setDetailModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de la demande</DialogTitle>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Réf. {detailModal.reference}</p>
              <p className="text-lg font-bold text-green-400">{formatCentsToCurrency(detailModal.netCents, 'EUR')}</p>
              {renderDetailCoordinates(detailModal)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!approveModal} onOpenChange={(o) => !o && setApproveModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t.approveModal.title}</DialogTitle>
            <DialogDescription className="text-slate-400">{t.approveModal.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t.approveModal.referenceLabel}</Label>
              <Input value={approveReference} onChange={(e) => setApproveReference(e.target.value)} className="bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label>{t.approveModal.internalNoteLabel}</Label>
              <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="bg-slate-800 border-slate-600" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal(null)}>{t.approveModal.cancel}</Button>
            <Button onClick={handleApprove} disabled={isSubmitting} className="bg-green-600">{t.approveModal.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectModal} onOpenChange={(o) => !o && setRejectModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t.rejectModal.title}</DialogTitle>
            <DialogDescription className="text-slate-400">{t.rejectModal.description}</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t.rejectModal.reasonPlaceholder} className="bg-slate-800 border-slate-600" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>{t.rejectModal.cancel}</Button>
            <Button onClick={handleReject} disabled={isSubmitting} className="bg-red-600">{t.rejectModal.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
