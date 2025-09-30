import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Download,
  RefreshCw
} from 'lucide-react';
import { AdminStatsOverview } from '@/components/admin/stats-overview';
import { AdminTradesTable } from '@/components/admin/trades-table';
import { AdminUsersTable } from '@/components/admin/users-table';
import { AdminPayoutsTable } from '@/components/admin/payouts-table';
import { AdminKYCManagement } from '@/components/admin/kyc-management';
import { AdminExports } from '@/components/admin/exports';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Dashboard Admin
              </h1>
              <p className="text-slate-300">
                Gestion complète de la plateforme CashTrade
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-800">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <Suspense fallback={<StatsOverviewSkeleton />}>
          <AdminStatsOverview />
        </Suspense>

        {/* Main Content Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
              <TabsTrigger value="trades" className="data-[state=active]:bg-slate-700">
                Trades
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="payouts" className="data-[state=active]:bg-slate-700">
                Paiements
              </TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-slate-700">
                KYC
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="exports" className="data-[state=active]:bg-slate-700">
                Exports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Trades</CardTitle>
                  <CardDescription className="text-slate-300">
                    Suivi et gestion de tous les trades de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TableSkeleton />}>
                    <AdminTradesTable />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Utilisateurs</CardTitle>
                  <CardDescription className="text-slate-300">
                    Administration des comptes utilisateurs et de leurs données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TableSkeleton />}>
                    <AdminUsersTable />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gestion des Paiements</CardTitle>
                  <CardDescription className="text-slate-300">
                    Suivi et validation des paiements SEPA et crypto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TableSkeleton />}>
                    <AdminPayoutsTable />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Validation KYC</CardTitle>
                  <CardDescription className="text-slate-300">
                    Gestion des demandes de vérification d&apos;identité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TableSkeleton />}>
                    <AdminKYCManagement />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Analytics Avancées</CardTitle>
                  <CardDescription className="text-slate-300">
                    Graphiques et analyses détaillées de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-300">Analytics en cours de développement...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exports" className="mt-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Exports de Données</CardTitle>
                  <CardDescription className="text-slate-300">
                    Export des données pour la comptabilité et la conformité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TableSkeleton />}>
                    <AdminExports />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-600 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-slate-600 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}
