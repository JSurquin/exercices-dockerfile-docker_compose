'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Mail, 
  Users, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NewsletterCampaignCreator } from '@/components/admin/newsletter-campaign-creator';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadSubscribers();
    loadCampaigns();
  }, [currentPage, searchTerm, statusFilter]);

  const loadSubscribers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscribers(data.subscribers);
        setStats(data.stats);
      } else {
        toast.error('Erreur lors du chargement des abonnés');
      }
    } catch (error) {
      console.error('Error loading subscribers:', error);
      toast.error('Erreur lors du chargement des abonnés');
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/campaigns');
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (subscriberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/newsletter/subscribers?id=${subscriberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Abonné supprimé avec succès');
        loadSubscribers();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export réussi');
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="h-8 w-8 text-orange-500" />
              Gestion Newsletter
            </h1>
            <p className="text-slate-400 mt-2">
              Gérez vos abonnés et campagnes d'emailing
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Total Abonnés
              </CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Abonnés Actifs
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Désabonnés
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="subscribers" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="subscribers" className="data-[state=active]:bg-orange-500">
              <Users className="h-4 w-4 mr-2" />
              Abonnés
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-orange-500">
              <Send className="h-4 w-4 mr-2" />
              Campagnes
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Liste des Abonnés</CardTitle>
                    <CardDescription>
                      Gérez vos abonnés à la newsletter
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={exportSubscribers}
                    variant="outline" 
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Rechercher par email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Désabonnés</option>
                  </select>
                </div>

                {/* Subscribers Table */}
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead>
                        <TableHead className="text-slate-300">Date d'inscription</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">
                            {subscriber.email}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={subscriber.isActive ? "default" : "secondary"}
                              className={subscriber.isActive ? "bg-green-500" : "bg-red-500"}
                            >
                              {subscriber.isActive ? 'Actif' : 'Désabonné'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(subscriber.subscribedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSubscriber(subscriber.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {subscribers.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    Aucun abonné trouvé
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <NewsletterCampaignCreator onCampaignCreated={loadCampaigns} />
            
            {campaigns.length > 0 && (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Campagnes existantes</CardTitle>
                  <CardDescription>
                    Historique de vos campagnes d'emailing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50"
                      >
                        <div>
                          <h4 className="text-white font-medium">{campaign.title}</h4>
                          <p className="text-slate-400 text-sm">{campaign.subject}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            Créée le {format(new Date(campaign.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={campaign.status === 'SENT' ? 'default' : 'secondary'}
                            className={
                              campaign.status === 'SENT'
                                ? 'bg-green-500'
                                : campaign.status === 'SCHEDULED'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                            }
                          >
                            {campaign.status === 'SENT' ? 'Envoyée' : 
                             campaign.status === 'SCHEDULED' ? 'Planifiée' : 'Brouillon'}
                          </Badge>
                          {campaign.sentAt && (
                            <span className="text-xs text-slate-500">
                              {format(new Date(campaign.sentAt), 'dd/MM HH:mm', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}