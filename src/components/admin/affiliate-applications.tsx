'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, [page, statusFilter]);

  const loadApplications = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter
      });

      const response = await fetch(`/api/admin/affiliate-applications?${params}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications);
        setTotalPages(data.data.pagination.pages);
        setPendingCount(data.data.pendingCount);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les demandes',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) {
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
          title: 'Succès',
          description: 'Demande approuvée et compte affilié créé'
        });
        loadApplications();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors de l\'approbation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une raison de rejet',
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
          title: 'Succès',
          description: 'Demande rejetée'
        });
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedApp(null);
        loadApplications();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors du rejet',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Approuvée</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejetée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec badge de demandes en attente */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Demandes d&apos;Affiliation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Examinez et validez les demandes d&apos;affiliation
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-orange-500 text-white">
                <Clock className="h-4 w-4 mr-1" />
                {pendingCount} en attente
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => loadApplications()} variant="outline">
              Actualiser
            </Button>
          </div>

          {/* Tableau des demandes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Date de demande</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={app.user.steamAvatar || '/images/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">
                            {app.user.steamUsername || 'Utilisateur'}
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
              Aucune demande trouvée
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog open={!!selectedApp && !showRejectDialog} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Détails de la demande</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informations complètes sur la demande d&apos;affiliation
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              {/* Informations utilisateur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Utilisateur</Label>
                  <p className="font-medium">{selectedApp.user.steamUsername}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <p className="font-medium">{selectedApp.user.email}</p>
                </div>
                <div>
                  <Label className="text-slate-300">Statut KYC</Label>
                  <Badge variant={selectedApp.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                    {selectedApp.user.kycStatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-300">Membre depuis</Label>
                  <p className="font-medium">{formatDate(selectedApp.user.createdAt)}</p>
                </div>
              </div>

              {/* Motivation */}
              <div>
                <Label className="text-slate-300">Motivation</Label>
                <div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-sm whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>
              </div>

              {/* Liens sociaux */}
              {selectedApp.socialLinks && Object.keys(selectedApp.socialLinks).length > 0 && (
                <div>
                  <Label className="text-slate-300">Liens sociaux</Label>
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
                            Visiter
                            <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Statut de révision */}
              {selectedApp.status !== 'PENDING' && (
                <div className="border-t border-slate-700 pt-4">
                  <Label className="text-slate-300">Statut</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>État:</span>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    {selectedApp.reviewedAt && (
                      <div className="flex items-center justify-between">
                        <span>Révisé le:</span>
                        <span>{formatDate(selectedApp.reviewedAt)}</span>
                      </div>
                    )}
                    {selectedApp.reviewer && (
                      <div className="flex items-center justify-between">
                        <span>Par:</span>
                        <span>{selectedApp.reviewer.steamUsername || selectedApp.reviewer.email}</span>
                      </div>
                    )}
                    {selectedApp.rejectionReason && (
                      <div className="mt-2">
                        <Label className="text-slate-300">Raison du rejet:</Label>
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

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeter la demande</DialogTitle>
            <DialogDescription className="text-slate-400">
              Veuillez fournir une raison pour le rejet de cette demande
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Raison du rejet *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée..."
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
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? 'Traitement...' : 'Rejeter la demande'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

