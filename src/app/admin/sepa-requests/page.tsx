'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  UserIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface SepaFrRequest {
  id: string;
  reference: string | null;
  status: string;
  amountCents: number;
  netCents: number;
  createdAt: string;
  paidAt: string | null;
  errorMessage: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    steamUsername: string | null;
    steamAvatar: string | null;
  } | null;
  beneficiary: {
    maskedIban: string;
    fullIban: string;
    bic: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function AdminSepaRequestsPage() {
  const { messages } = useLocale();
  const t = messages.adminSepaRequests;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [approveModal, setApproveModal] = useState<SepaFrRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<SepaFrRequest | null>(null);
  const [approveReference, setApproveReference] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-sepa-requests', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/admin/sepa-requests?${params}`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      return res.json();
    },
  });

  const requests: SepaFrRequest[] = data?.requests ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  const pendingCount = requests.filter((r) => r.status === 'PENDING_APPROVAL').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge className="bg-amber-500 text-white">{t.status.pending}</Badge>;
      case 'PAID':
        return <Badge className="bg-green-500 text-white">{t.status.approved}</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500 text-white">{t.status.rejected}</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white">{status}</Badge>;
    }
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/sepa-requests/${approveModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reference: approveReference.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.toast.approveError);
      toast.success(t.toast.approveSuccess);
      setApproveModal(null);
      setApproveReference('');
      queryClient.invalidateQueries({ queryKey: ['admin-sepa-requests'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toast.approveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error('La raison du refus est requise');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/sepa-requests/${rejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.toast.rejectError);
      toast.success(t.toast.rejectSuccess);
      setRejectModal(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-sepa-requests'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toast.rejectError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BanknotesIcon className="w-7 h-7 text-orange-400" />
            {t.title}
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white ml-2">{pendingCount} {t.badge}</Badge>
            )}
          </h1>
          <p className="text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </motion.div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <Label className="text-slate-300 text-sm shrink-0">Statut :</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">{t.filters.all}</SelectItem>
                <SelectItem value="pending">{t.filters.pending}</SelectItem>
                <SelectItem value="approved">{t.filters.approved}</SelectItem>
                <SelectItem value="rejected">{t.filters.rejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {total} demande{total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">{t.emptyState}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-left">
                    <th className="pb-3 pr-4 font-medium">{t.columns.user}</th>
                    <th className="pb-3 pr-4 font-medium">{t.columns.amount}</th>
                    <th className="pb-3 pr-4 font-medium">{t.columns.iban}</th>
                    <th className="pb-3 pr-4 font-medium">{t.columns.bic}</th>
                    <th className="pb-3 pr-4 font-medium">{t.columns.date}</th>
                    <th className="pb-3 pr-4 font-medium">{t.columns.status}</th>
                    <th className="pb-3 font-medium">{t.columns.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          {req.user?.steamAvatar ? (
                            <img src={req.user.steamAvatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">
                              {req.user?.name ?? req.user?.steamUsername ?? 'Utilisateur'}
                            </p>
                            <p className="text-slate-400 text-xs">{req.user?.email ?? '—'}</p>
                            {req.beneficiary?.firstName && (
                              <p className="text-slate-300 text-xs">
                                {req.beneficiary.firstName} {req.beneficiary.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-white font-semibold">
                          {formatCentsToCurrency(req.amountCents, 'EUR')}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <span className="font-mono text-white text-xs font-semibold tracking-wide">
                            {req.beneficiary?.fullIban
                              ? req.beneficiary.fullIban.replace(/(.{4})/g, '$1 ').trim()
                              : '—'}
                          </span>
                          {req.beneficiary?.firstName && (
                            <p className="text-slate-400 text-xs mt-0.5">
                              {req.beneficiary.firstName} {req.beneficiary.lastName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-mono text-slate-300 text-xs">
                          {req.beneficiary?.bic || '—'}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <p className="text-slate-300 text-xs">
                            {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          {getStatusBadge(req.status)}
                          {req.errorMessage && (
                            <p className="text-red-400 text-xs mt-1 max-w-[120px] truncate" title={req.errorMessage}>
                              {req.errorMessage}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {req.status === 'PENDING_APPROVAL' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => { setApproveModal(req); setApproveReference(''); }}
                              className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                              {t.actions.approve}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setRejectModal(req); setRejectReason(''); }}
                              className="border-red-600 text-red-400 hover:bg-red-950/30 h-8 px-3 text-xs"
                            >
                              <XCircleIcon className="w-3.5 h-3.5 mr-1" />
                              {t.actions.reject}
                            </Button>
                          </div>
                        )}
                        {req.status === 'PAID' && (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>{req.paidAt ? new Date(req.paidAt).toLocaleDateString('fr-FR') : 'Payé'}</span>
                          </div>
                        )}
                        {req.status === 'CANCELLED' && (
                          <div className="flex items-center gap-1 text-red-400 text-xs">
                            <XCircleIcon className="w-4 h-4" />
                            <span>Refusé</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-600 text-slate-300"
              >
                ← Précédent
              </Button>
              <span className="text-slate-400 text-sm">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-slate-600 text-slate-300"
              >
                Suivant →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={!!approveModal} onOpenChange={(open) => { if (!open) setApproveModal(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              {t.approveModal.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.approveModal.description}
            </DialogDescription>
          </DialogHeader>

          {approveModal && (
            <div className="space-y-4 py-2">
              {/* IBAN complet bien visible pour copier-coller */}
              <div className="bg-slate-800 border border-orange-500/40 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">IBAN destinataire</p>
                  <p className="font-mono text-orange-300 text-base font-bold tracking-widest select-all">
                    {approveModal.beneficiary?.fullIban
                      ? approveModal.beneficiary.fullIban.replace(/(.{4})/g, '$1 ').trim()
                      : '—'}
                  </p>
                </div>
                {approveModal.beneficiary?.bic && (
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">BIC / SWIFT</p>
                    <p className="font-mono text-white font-semibold select-all">{approveModal.beneficiary.bic}</p>
                  </div>
                )}
                {approveModal.beneficiary?.firstName && (
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Bénéficiaire</p>
                    <p className="text-white font-medium">{approveModal.beneficiary.firstName} {approveModal.beneficiary.lastName}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Utilisateur</span>
                  <span className="text-white font-medium">
                    {approveModal.user?.name ?? approveModal.user?.steamUsername ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant à virer</span>
                  <span className="text-green-400 font-bold text-base">
                    {formatCentsToCurrency(approveModal.amountCents, 'EUR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">{t.approveModal.referenceLabel}</Label>
                <Input
                  placeholder={t.approveModal.referencePlaceholder}
                  value={approveReference}
                  onChange={(e) => setApproveReference(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveModal(null)}
              disabled={isSubmitting}
              className="border-slate-600 text-slate-300"
            >
              {t.approveModal.cancel}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              {t.approveModal.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={(open) => { if (!open) setRejectModal(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              {t.rejectModal.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.rejectModal.description}
            </DialogDescription>
          </DialogHeader>

          {rejectModal && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Utilisateur</span>
                  <span className="text-white font-medium">
                    {rejectModal.user?.name ?? rejectModal.user?.steamUsername ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant</span>
                  <span className="text-white font-semibold">
                    {formatCentsToCurrency(rejectModal.amountCents, 'EUR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">{t.rejectModal.reasonLabel}</Label>
                <Textarea
                  placeholder={t.rejectModal.reasonPlaceholder}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectModal(null)}
              disabled={isSubmitting}
              className="border-slate-600 text-slate-300"
            >
              {t.rejectModal.cancel}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircleIcon className="w-4 h-4 mr-2" />
              )}
              {t.rejectModal.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
