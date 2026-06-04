'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SafeImg } from '@/components/ui/safe-image';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { 
  FileText, 
  Check, 
  X, 
  Eye,
  Clock,
  ExternalLink
} from 'lucide-react';

interface AffiliateApplication {
  id: string;
  userId: string;
  motivation: string;
  socialLinks?: {
    youtube?: string;
    twitch?: string;
    twitter?: string;
    instagram?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    steamUsername?: string;
    steamAvatar?: string;
    kycStatus: string;
    createdAt: string;
  };
  reviewer?: {
    id: string;
    email: string;
    steamUsername?: string;
  };
}

export default function AffiliateApplications() {
  const { messages } = useLocale();
  const t = messages.admin.affiliateApplications;

  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminAffiliateApplications(statusFilter),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter
      });
      const response = await fetch(`/api/admin/affiliate-applications?${params}`);
      return response.json();
    },
    refetchInterval: 30_000
  });

  const applications: AffiliateApplication[] = data?.data?.applications ?? [];
  const totalPages: number = data?.data?.pagination?.pages ?? 1;
  const pendingCount: number = data?.data?.pendingCount ?? 0;

  const handleApprove = async (applicationId: string) => {
    if (!confirm(t.confirmApprove)) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/affiliate-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          applicationId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t.success,
          description: t.approveSuccess
        });
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-applications'] });
      } else {
        toast({
          title: t.error,
          description: data.error || t.approveError,
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: t.connectionError,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast({
        title: t.error,
        description: t.rejectReasonRequired,
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/affiliate-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          applicationId: selectedApp.id,
          data: { rejectionReason }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t.success,
          description: t.rejectSuccess
        });
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedApp(null);
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-applications'] });
      } else {
        toast({
          title: t.error,
          description: data.error || t.rejectError,
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: t.connectionError,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t.statusPending}</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">{t.statusApproved}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{t.statusRejected}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t.description}
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {pendingCount} {t.pendingBadge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t.colStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAll}</SelectItem>
                <SelectItem value="pending">{t.filterPending}</SelectItem>
                <SelectItem value="approved">{t.filterApproved}</SelectItem>
                <SelectItem value="rejected">{t.filterRejected}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-applications'] })} variant="outline">
              {t.refresh}
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.colUser}</TableHead>
                  <TableHead>{t.colDate}</TableHead>
                  <TableHead>{t.colKyc}</TableHead>
                  <TableHead>{t.colStatus}</TableHead>
                  <TableHead>{t.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <SafeImg
                          src={app.user.steamAvatar || '/images/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                          fallbackClassName="w-8 h-8 rounded-full"
                          fallbackIcon={<UserCircleIcon className="w-5 h-5" />}
                        />
                        <div>
                          <p className="font-medium">
                            {app.user.steamUsername || t.defaultUsername}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {app.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(app.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={app.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}
                        className={app.user.kycStatus === 'VERIFIED' ? 'bg-green-500' : ''}
                      >
                        {app.user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {app.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(app.id)}
                              disabled={processing}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app);
                                setShowRejectDialog(true);
                              }}
                              disabled={processing}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {applications.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              {t.noApplications}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {t.pageOf.replace('{page}', String(page)).replace('{total}', String(totalPages))}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {t.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                {t.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp && !showRejectDialog} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.detailsTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.detailsDescription}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t.labelUser}</Label>
                  <p className="font-medium">{selectedApp.user.steamUsername}</p>
                </div>
                <div>
                  <Label className="text-slate-300">{t.labelEmail}</Label>
                  <p className="font-medium">{selectedApp.user.email}</p>
                </div>
                <div>
                  <Label className="text-slate-300">{t.labelKycStatus}</Label>
                  <Badge variant={selectedApp.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                    {selectedApp.user.kycStatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-300">{t.labelMemberSince}</Label>
                  <p className="font-medium">{formatDate(selectedApp.user.createdAt)}</p>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">{t.labelMotivation}</Label>
                <div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-sm whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>
              </div>

              {selectedApp.socialLinks && Object.keys(selectedApp.socialLinks).length > 0 && (
                <div>
                  <Label className="text-slate-300">{t.labelSocialLinks}</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(selectedApp.socialLinks).map(([platform, url]) => (
                      url && (
                        <div key={platform} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                          <span className="font-medium capitalize">{platform}</span>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-400 hover:text-blue-300"
                          >
                            {t.visitLink}
                            <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.status !== 'PENDING' && (
                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-slate-300">{t.labelStatus}</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{t.labelState}</span>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    {selectedApp.reviewedAt && (
                      <div className="flex items-center justify-between">
                        <span>{t.labelReviewedAt}</span>
                        <span>{formatDate(selectedApp.reviewedAt)}</span>
                      </div>
                    )}
                    {selectedApp.reviewer && (
                      <div className="flex items-center justify-between">
                        <span>{t.labelReviewedBy}</span>
                        <span>{selectedApp.reviewer.steamUsername || selectedApp.reviewer.email}</span>
                      </div>
                    )}
                    {selectedApp.rejectionReason && (
                      <div className="mt-2">
                        <Label className="text-slate-300">{t.labelRejectionReason}</Label>
                        <p className="mt-1 p-3 bg-red-900/20 rounded-lg border border-red-800 text-sm">
                          {selectedApp.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.rejectDialogTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.rejectDialogDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">{t.rejectionReasonLabel}</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t.rejectionReasonPlaceholder}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? t.processing : t.rejectButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
