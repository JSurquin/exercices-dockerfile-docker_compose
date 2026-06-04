'use client';

import { Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

// Imports des composants
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
import { VipMerchantManagement } from '@/components/admin/vip-merchant-management';
import { GiveawayAdmin } from '@/components/admin/giveaway-admin';
import { DashboardOverview } from '@/components/admin/dashboard-overview';
import { adminBtnOutline, adminBtnPrimary } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

function DashboardContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { messages } = useLocale();
  const tab = searchParams.get('tab') || 'overview';

  // Quick actions handlers
  const handleExportData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/export-data');
      if (!response.ok) throw new Error(messages.admin.exportMessages.error);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moonskin-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: messages.admin.exportMessages.success,
        description: messages.admin.exportMessages.successDesc,
      });
    } catch (error) {
      toast({
        title: messages.common.error || 'Error',
        description: messages.admin.exportMessages.errorDesc,
        variant: 'destructive',
      });
    }
  }, [toast, messages]);

  const handleGenerateReport = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/full-report');
      if (!response.ok) throw new Error(messages.admin.exportMessages.reportError);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moonskin-rapport-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: messages.admin.exportMessages.reportGenerated,
        description: messages.admin.exportMessages.reportGeneratedDesc,
      });
    } catch (error) {
      toast({
        title: messages.common.error || 'Error',
        description: messages.admin.exportMessages.reportError,
        variant: 'destructive',
      });
    }
  }, [toast, messages]);

  // Quick Actions pour le header
  const quickActions = useMemo(() => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn('hidden md:flex', adminBtnOutline)}
        onClick={handleExportData}
      >
        <DocumentArrowDownIcon className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">{messages.admin.dashboard.exportData}</span>
      </Button>
      <Button
        size="sm"
        className={cn('hidden md:flex', adminBtnPrimary)}
        onClick={handleGenerateReport}
      >
        <ChartBarIcon className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">{messages.admin.dashboard.fullReport}</span>
      </Button>
    </div>
  ), [handleExportData, handleGenerateReport, messages]);

  // Rendu du contenu selon le tab actif
  const renderContent = () => {
    switch (tab) {
      case 'overview':
        return <DashboardOverview />;
      
      case 'analytics':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminAnalyticsCharts />
          </motion.div>
        );
      
      case 'users':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.usersManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.usersDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AdminUsersTable />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'trades':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.tradesManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.tradesDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AdminTradesTable />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'payouts':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.payoutsManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.payoutsDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AdminPayoutsTable />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'kyc':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.kycValidation}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.kycDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AdminKYCManagement />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'affiliates':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.affiliatesManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.affiliatesDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AffiliatesManagement />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'commissions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.commissionsManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.commissionsDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AffiliateCommissions />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'affiliate-performance':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.chat.performance.title}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.affiliatesDescription}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center text-slate-400">
                  {messages.admin.dashboard.sectionInDevelopment}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'vip':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.vipManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.vipDescription}
                </p>
              </CardHeader>
              <CardContent>
                <VipMerchantManagement tag="VIP" />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'merchants':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.merchantManagement}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.merchantDescription}
                </p>
              </CardHeader>
              <CardContent>
                <VipMerchantManagement tag="MERCHANT" />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      case 'exports':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.dashboard.exportConfiguration}</CardTitle>
                <p className="text-sm text-slate-400">
                  {messages.admin.dashboard.exportDescription}
                </p>
              </CardHeader>
              <CardContent>
                <AdminExports />
              </CardContent>
            </Card>
          </motion.div>
        );
      
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec titre et actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-theme-accent to-primary bg-clip-text text-transparent sm:text-3xl md:text-4xl">
              {messages.admin.dashboard.title}
            </h1>
          </div>
        {quickActions}
      </motion.div>

      {/* Stats Overview + Skinplace Metrics - Uniquement sur overview */}
      {tab === 'overview' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AdminStatsOverview />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AdminSkinplaceMetrics />
          </motion.div>
        </>
      )}

      {/* Contenu principal selon le tab */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 bg-slate-800" />
        <Skeleton className="h-6 w-96 bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
