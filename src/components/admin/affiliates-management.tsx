'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter,
  Edit,
  ToggleLeft,
  ToggleRight,
  Eye,
  UserCheck,
  Settings
} from 'lucide-react';
import AffiliateTools from './affiliate-tools';

interface AffiliateData {
  id: string;
  code: string;
  totalReferrals: number;
  totalVolumeCents: number;
  totalCommissionCents: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    steamUsername?: string;
    steamAvatar?: string;
    createdAt: string;
    kycStatus: string;
  };
  _count: {
    referrals: number;
    commissions: number;
  };
}

interface GlobalStats {
  totalAffiliates: number;
  totalReferrals: number;
  totalVolume: number;
  totalCommissions: number;
}

export default function AffiliatesManagement() {
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalAffiliates: 0,
    totalReferrals: 0,
    totalVolume: 0,
    totalCommissions: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [editingCommissionRate, setEditingCommissionRate] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliates();
  }, [page, search, statusFilter]);

  const loadAffiliates = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/affiliates?${params}`);
      const data = await response.json();

      if (data.success) {
        setAffiliates(data.data.affiliates);
        setGlobalStats(data.data.globalStats);
        setTotalPages(data.data.pagination.pages);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les affiliés',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur chargement affiliés:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAffiliateStatus = async (affiliate: AffiliateData) => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          affiliateId: affiliate.id,
          data: { currentStatus: affiliate.isActive }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Succès',
          description: `Affilié ${affiliate.isActive ? 'désactivé' : 'activé'} avec succès`
        });
        loadAffiliates();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors du changement de statut',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    }
  };

  const updateCommissionRate = async () => {
    if (!selectedAffiliate) return;

    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_commission_rate',
          affiliateId: selectedAffiliate.id,
          data: {
            oldRate: selectedAffiliate.commissionRate,
            newRate: newCommissionRate / 100 // Convertir en décimal
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Succès',
          description: 'Taux de commission mis à jour'
        });
        setEditingCommissionRate(false);
        loadAffiliates();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors de la mise à jour',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
      {/* Outils d'administration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Outils d'Administration
          </CardTitle>
          <CardDescription>
            Outils de maintenance et de recalcul pour le système d'affiliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AffiliateTools />
        </CardContent>
      </Card>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalAffiliates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Référrals Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Généré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(globalStats.totalVolume)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(globalStats.totalCommissions)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Affiliés</CardTitle>
          <CardDescription>
            Gérez les comptes affiliés, leurs commissions et leurs performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, nom ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des affiliés */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Référrals</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Commissions</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={affiliate.user.steamAvatar || '/images/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">
                            {affiliate.user.steamUsername || 'Utilisateur'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {affiliate.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {affiliate.code}
                      </code>
                    </TableCell>
                    <TableCell>{affiliate.totalReferrals}</TableCell>
                    <TableCell>{formatCurrency(affiliate.totalVolumeCents)}</TableCell>
                    <TableCell>{formatCurrency(affiliate.totalCommissionCents)}</TableCell>
                    <TableCell>{(affiliate.commissionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={affiliate.isActive ? 'default' : 'secondary'}>
                        {affiliate.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setNewCommissionRate(affiliate.commissionRate * 100);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAffiliateStatus(affiliate)}
                        >
                          {affiliate.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      {/* Dialog de détails d'affilié */}
      <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'affilié</DialogTitle>
            <DialogDescription>
              Gérer les paramètres et voir les détails de l'affilié
            </DialogDescription>
          </DialogHeader>
          
          {selectedAffiliate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom d'utilisateur</Label>
                  <p className="font-medium">{selectedAffiliate.user.steamUsername}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedAffiliate.user.email}</p>
                </div>
                <div>
                  <Label>Code d'affiliation</Label>
                  <p className="font-mono font-medium">{selectedAffiliate.code}</p>
                </div>
                <div>
                  <Label>Statut KYC</Label>
                  <Badge variant={selectedAffiliate.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                    {selectedAffiliate.user.kycStatus}
                  </Badge>
                </div>
                <div>
                  <Label>Membre depuis</Label>
                  <p className="font-medium">{formatDate(selectedAffiliate.user.createdAt)}</p>
                </div>
                <div>
                  <Label>Affilié depuis</Label>
                  <p className="font-medium">{formatDate(selectedAffiliate.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label>Taux de commission</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCommissionRate(!editingCommissionRate)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                
                {editingCommissionRate ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24"
                    />
                    <span>%</span>
                    <Button size="sm" onClick={updateCommissionRate}>
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingCommissionRate(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <p className="font-medium text-lg">
                    {(selectedAffiliate.commissionRate * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedAffiliate.totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">Référrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedAffiliate.totalVolumeCents)}
                  </p>
                  <p className="text-sm text-muted-foreground">Volume</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedAffiliate.totalCommissionCents)}
                  </p>
                  <p className="text-sm text-muted-foreground">Commissions</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}