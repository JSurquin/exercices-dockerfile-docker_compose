'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockTrades, mockUser, mockStats, mockVolumeData } from '@/lib/mock-data';
import { useLocale } from '@/components/providers/locale-provider';
import { useToast } from '@/hooks/use-toast';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import CountUp from 'react-countup';

// Imports des nouveaux composants avec vraies données
import { AdminStatsOverview } from '@/components/admin/stats-overview';
import { AdminTradesTable } from '@/components/admin/trades-table';
import { AdminUsersTable } from '@/components/admin/users-table';
import { AdminPayoutsTable } from '@/components/admin/payouts-table';
import { AdminKYCManagement } from '@/components/admin/kyc-management';
import { AdminExports } from '@/components/admin/exports';
import { AdminAnalyticsCharts } from '@/components/admin/analytics-charts';
import { AdminSkinplaceMetrics } from '@/components/admin/skinplace-metrics';
import AffiliatesManagement from '@/components/admin/affiliates-management';
import AffiliateCommissions from '@/components/admin/affiliate-commissions';
import { GiveawayAdmin } from '@/components/admin/giveaway-admin';

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + '€';
};

const getStatusColor = (status: string) => {
  const colors = {
    'créé': 'bg-blue-500',
    'accepté_par_bot': 'bg-indigo-500',
    'en_trade_hold': 'bg-yellow-500',
    'disponible': 'bg-green-500',
    'paiement_en_cours': 'bg-orange-500',
    'payé': 'bg-emerald-500',
    'échoué': 'bg-red-500',
    'pending': 'bg-yellow-500',
    'verified': 'bg-green-500',
    'rejected': 'bg-red-500',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

export default function AdminDashboard() {
  const { messages } = useLocale();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fonction pour télécharger l'export des données
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch('/api/admin/export-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export des données');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `cashtrade-export-donnees-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: messages.admin.toast.exportSuccess.title,
        description: messages.admin.toast.exportSuccess.description,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: messages.admin.toast.exportError.title,
        description: messages.admin.toast.exportError.description,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction pour générer le rapport complet
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      const response = await fetch('/api/admin/full-report', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `cashtrade-rapport-complet-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: messages.admin.toast.reportSuccess.title,
        description: messages.admin.toast.reportSuccess.description,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast({
        title: messages.admin.toast.reportError.title,
        description: messages.admin.toast.reportError.description,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        {/* Header avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Dashboard Admin CashTrade
              </h1>
              <p className="text-slate-300 text-lg">
                Gestion complète de la plateforme • CS2 Skin Trading
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="text-white border-slate-600 hover:bg-slate-800"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                {isExporting ? 'Export en cours...' : 'Exporter Données'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                {isGeneratingReport ? 'Génération...' : 'Rapport Complet'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview avec vraies données */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <AdminStatsOverview />
        </motion.div>

        {/* Skinplace Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <AdminSkinplaceMetrics />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-11 bg-slate-800/50 backdrop-blur-sm border border-slate-700">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Vue d&apos;ensemble
              </TabsTrigger>
              <TabsTrigger 
                value="trades" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Trades
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger 
                value="payouts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Paiements
              </TabsTrigger>
              <TabsTrigger 
                value="kyc" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                KYC
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="exports" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Exports
              </TabsTrigger>
              <TabsTrigger 
                value="affiliates" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Affiliés
              </TabsTrigger>
              <TabsTrigger 
                value="commissions" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Commissions
              </TabsTrigger>
              <TabsTrigger 
                value="giveaways" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Giveaways
              </TabsTrigger>
              <TabsTrigger 
                value="newsletter" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Newsletter
              </TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique des volumes */}
                <Card className="bg-slate-800/50 border-2 border-cyan-500/50 backdrop-blur-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-cyan-400" />
                      Volume des Trades (7 derniers jours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#F97316" 
                          strokeWidth={3}
                          dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Répartition des statuts */}
                <Card className="bg-slate-800/50 border-2 border-purple-500/50 backdrop-blur-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-purple-400" />
                      Répartition des Trades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { status: 'Payés', count: 45, color: '#10B981' },
                        { status: 'En cours', count: 23, color: '#F59E0B' },
                        { status: 'Hold', count: 12, color: '#EF4444' },
                        { status: 'Créés', count: 8, color: '#3B82F6' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="status" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Activité récente */}
              <Card className="mt-6 bg-slate-800/50 border-2 border-emerald-500/50 backdrop-blur-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-emerald-400" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTrades.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={mockUser.avatar} />
                            <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{mockUser.username}</p>
                            <p className="text-slate-400 text-sm">Trade #{trade.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatPrice(trade.netCentimes)}</p>
                          <Badge className={`${getStatusColor(trade.status)} text-white text-xs`}>
                            {trade.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trades */}
            <TabsContent value="trades" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-blue-500/50 backdrop-blur-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Trades</CardTitle>
                  <div className="text-slate-300">
                    Suivi et gestion de tous les trades de la plateforme
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminTradesTable />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Utilisateurs */}
            <TabsContent value="users" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-indigo-500/50 backdrop-blur-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Utilisateurs</CardTitle>
                  <div className="text-slate-300">
                    Administration des comptes utilisateurs et de leurs données
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminUsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Paiements */}
            <TabsContent value="payouts" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-yellow-500/50 backdrop-blur-sm shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Paiements</CardTitle>
                  <div className="text-slate-300">
                    Suivi et validation des paiements SEPA et crypto
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminPayoutsTable />
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC */}
            <TabsContent value="kyc" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-red-500/50 backdrop-blur-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Validation KYC</CardTitle>
                  <div className="text-slate-300">
                    Gestion des demandes de vérification d&apos;identité
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminKYCManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics avec D3 */}
            <TabsContent value="analytics" className="mt-6">
              <AdminAnalyticsCharts />
            </TabsContent>

            {/* Exports */}
            <TabsContent value="exports" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-pink-500/50 backdrop-blur-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Exports de Données</CardTitle>
                  <div className="text-slate-300">
                    Export des données pour la comptabilité et la conformité
                  </div>
                </CardHeader>
                <CardContent>
                  <AdminExports />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Affiliés */}
            <TabsContent value="affiliates" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-green-500/50 backdrop-blur-sm shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Affiliés</CardTitle>
                  <div className="text-slate-300">
                    Administration des comptes affiliés et de leurs performances
                  </div>
                </CardHeader>
                <CardContent>
                  <AffiliatesManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions */}
            <TabsContent value="commissions" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-teal-500/50 backdrop-blur-sm shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Commissions d&apos;Affiliation</CardTitle>
                  <div className="text-slate-300">
                    Validation et paiement des commissions générées par les affiliés
                  </div>
                </CardHeader>
                <CardContent>
                  <AffiliateCommissions />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Giveaways */}
            <TabsContent value="giveaways" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-orange-500/50 backdrop-blur-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Giveaways</CardTitle>
                  <div className="text-slate-300">
                    Tirage automatique des giveaways expirés
                  </div>
                </CardHeader>
                <CardContent>
                  <GiveawayAdmin />
                  <div className="mt-6">
                    <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                      <a href="/admin/giveaways">
                        Gestion complète des giveaways →
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Newsletter */}
            <TabsContent value="newsletter" className="mt-6">
              <Card className="bg-slate-800/50 border-2 border-blue-500/50 backdrop-blur-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">Gestion Newsletter</CardTitle>
                  <div className="text-slate-300">
                    Administration des abonnés et campagnes d&apos;emailing
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 rounded-full bg-blue-500/20">
                        <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Système Newsletter
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Accédez à la gestion complète des abonnés et campagnes
                    </p>
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <a href="/admin/newsletter">
                        Gérer la Newsletter →
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}