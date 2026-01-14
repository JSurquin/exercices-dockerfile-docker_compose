"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useAuth } from "@/components/providers/auth-provider";
import { useSession } from "~/lib/auth-client";
import { useLocale } from "@/components/providers/locale-provider";
import OnboardingDialog from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Messages } from "~/utils/types";
import { User } from "~/utils/types";
import { toast } from "sonner";
import {
  mockVolumeData,
  mockTradeStatusData,
} from "@/lib/mock-data";
import { useUserTrades } from "@/hooks/use-user-trades";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  TicketIcon,
  StarIcon,
  BanknotesIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { StripeIcon, QontoIcon, BinanceIcon } from "@/components/ui/payment-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CountUp from "react-countup";

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + "€";
};

const getStatusColor = (status: string) => {
  // Mapper les statuts Prisma vers les couleurs
  const colors: Record<string, string> = {
    // Statuts Prisma
    CREATED: "bg-blue-500",
    ACCEPTED_BY_BOT: "bg-indigo-500",
    IN_TRADE_HOLD: "bg-yellow-500",
    AVAILABLE: "bg-green-500",
    PAYOUT_PENDING: "bg-orange-500",
    PAID: "bg-emerald-500",
    FAILED: "bg-red-500",
    // Anciens statuts français (pour compatibilité)
    créé: "bg-blue-500",
    accepté_par_bot: "bg-indigo-500",
    en_trade_hold: "bg-yellow-500",
    disponible: "bg-green-500",
    paiement_en_cours: "bg-orange-500",
    payé: "bg-emerald-500",
    échoué: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getStatusText = (status: string, messages: Messages) => {
  // Mapper les statuts Prisma vers les clés de traduction
  const statusKeyMap: Record<string, string> = {
    CREATED: "créé",
    ACCEPTED_BY_BOT: "accepté_par_bot",
    IN_TRADE_HOLD: "en_trade_hold",
    AVAILABLE: "disponible",
    PAYOUT_PENDING: "paiement_en_cours",
    PAID: "payé",
    FAILED: "échoué",
  };
  
  const statusKey = statusKeyMap[status] || status;
  return messages.trade.status[statusKey as keyof typeof messages.trade.status] || status;
};

export default function DashboardPage() {
  const { data, isPending, error } = useSession();
  const searchParams = useSearchParams();
  const { isFirstLogin, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<'stripe' | 'qonto' | 'binance' | null>('qonto');
  const { data: tradesData, loading: tradesLoading, error: tradesError, refetch: refetchTrades } = useUserTrades();
  const [refreshingTradeId, setRefreshingTradeId] = useState<string | null>(null);
  
  console.log("useSession data:", data);
  console.log("useSession isPending:", isPending);
  console.log("useSession error:", error);

  // Vérifier si c'est une connexion Steam réussie
  useEffect(() => {
    if (searchParams.get('steam_login') === 'success') {
      toast.success(messages.toast.steamLoginSuccess || 'Connexion Steam réussie !', {
        description: `${messages.dashboard.welcome} ${data?.user?.name || 'sur CashTrade'} !`,
        duration: 4000,
      });
      
      // Nettoyer l'URL
      const url = new URL(window.location.href);
      url.searchParams.delete('steam_login');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, data?.user?.name]);

  // Gérer l'affichage de l'onboarding
  useEffect(() => {
    // Afficher l'onboarding seulement si :
    // 1. L'utilisateur est connecté
    // 2. C'est sa première connexion
    if (data?.user && isFirstLogin) {
      // Petit délai pour laisser la page se charger
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [data, isFirstLogin]);

  const handleOnboardingComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      setShowOnboarding(false);
    }
  };

  // Rafraîchir le statut d'un trade manuellement
  const handleRefreshTradeStatus = async (tradeId: string) => {
    setRefreshingTradeId(tradeId);
    try {
      const response = await fetch(`/api/skinplace/trade/status/${tradeId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(messages.dashboard.toasts.statusUpdated, {
          description: result.trade.message || messages.dashboard.toasts.statusVerified,
        });
        // Recharger la liste des trades
        refetchTrades();
      } else {
        toast.error(messages.dashboard.toasts.error, {
          description: result.error || messages.dashboard.toasts.statusCheckFailed,
        });
      }
    } catch (error) {
      console.error('Erreur refresh trade:', error);
      toast.error(messages.dashboard.toasts.error, {
        description: messages.dashboard.toasts.statusCheckError,
      });
    } finally {
      setRefreshingTradeId(null);
    }
  };
  
  const { messages } = useLocale();

  const user = data?.user as User;

  if (!data || !user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              {messages.dashboard.loginRequired}
            </h2>
            <p className="text-muted-foreground mb-6">
              {messages.dashboard.loginSubtitle}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              {messages.common.steamLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevel = user?.level || 0;
  const nextLevel = currentLevel + 1;
  const xpForCurrentLevel = currentLevel * 1000;
  const xpForNextLevel = nextLevel * 1000;
  const xpProgress =
    ((user?.xp || 0 - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) *
    100;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-3 sm:space-x-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.image} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {messages.dashboard.welcome}, {user?.name}
              </h1>
              <p className="text-muted-foreground">
                {messages.dashboard.subtitle}
              </p>
            </div>
          </div>

          {/* XP Progress */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold">{messages.dashboard.currentLevel} {currentLevel}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.xp || 0 - xpForCurrentLevel} /{" "}
                      {xpForNextLevel - xpForCurrentLevel} {messages.dashboard.xp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {user?.xp?.toLocaleString()} {messages.dashboard.xp}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {xpForNextLevel - (user?.xp || 0)} {messages.dashboard.xpForNext} {nextLevel}
                  </p>
                </div>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8"
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.volume}</p>
                  <p className="text-2xl font-bold">
                    <CountUp
                      end={(tradesData?.totalVolume || 0) / 100}
                      duration={2}
                      decimals={2}
                      suffix="€"
                    />
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.trades}</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={tradesData?.totalTrades || 0} duration={2} />
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.level}</p>
                  <p className="text-2xl font-bold">{user?.level || 0}</p>
                </div>
                <StarIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.tickets}</p>
                  <p className="text-2xl font-bold">{user?.tickets || 0}</p>
                </div>
                <TicketIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="trades" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trades">{messages.dashboard.tabs.trades}</TabsTrigger>
              <TabsTrigger value="analytics">{messages.dashboard.tabs.analytics}</TabsTrigger>
              <TabsTrigger value="payments">{messages.dashboard.tabs.payments}</TabsTrigger>
              <TabsTrigger value="settings">{messages.dashboard.tabs.settings}</TabsTrigger>
            </TabsList>

            {/* Trades Tab */}
            <TabsContent value="trades" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{messages.dashboard.tradeHistory.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {tradesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  ) : tradesError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{messages.dashboard.tradeHistory.loadingError} {tradesError}</p>
                    </div>
                  ) : !tradesData?.trades || tradesData.trades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{messages.dashboard.tradeHistory.noTrades}</p>
                      <p className="text-sm">{messages.dashboard.tradeHistory.noTradesDescription}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {tradesData.trades.map((trade) => (
                      <div key={trade.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(
                                trade.status
                              )} text-white`}
                            >
                              {getStatusText(trade.status, messages)}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {trade.ticketId}
                            </span>
                            {/* Bouton pour rafraîchir le statut - uniquement pour les trades en attente */}
                            {(trade.status === 'CREATED' || trade.status === 'ACCEPTED_BY_BOT' || trade.status === 'IN_TRADE_HOLD') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefreshTradeStatus(trade.id)}
                                disabled={refreshingTradeId === trade.id}
                                className="h-7 px-2"
                              >
                                <ArrowPathIcon 
                                  className={`w-4 h-4 ${refreshingTradeId === trade.id ? 'animate-spin' : ''}`} 
                                />
                              </Button>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatPrice(trade.netCentimes)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(trade.créédLe).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.items} ({trade.items.length}):
                            </span>
                            <div className="mt-1">
                              {trade.items.slice(0, 2).map((item, index) => (
                                <p key={index} className="truncate">
                                  {item.name}
                                </p>
                              ))}
                              {trade.items.length > 2 && (
                                <p className="text-muted-foreground">
                                  +{trade.items.length - 2} {messages.dashboard.tradeHistory.others}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.fees}
                            </span>
                            <p>{messages.dashboard.tradeHistory.cashout} {formatPrice(trade.frais.cashout)}</p>
                            <p>{messages.dashboard.tradeHistory.network} {formatPrice(trade.frais.réseau)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.timeline}
                            </span>
                            {trade.tradeAcceptéLe && (
                              <p>
                                {messages.dashboard.tradeHistory.accepted}{" "}
                                {new Date(
                                  trade.tradeAcceptéLe
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {trade.disponibleLe && (
                              <p>
                                {messages.dashboard.tradeHistory.available}{" "}
                                {new Date(
                                  trade.disponibleLe
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.analytics.tradingVolume}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            formatPrice(value as number),
                            "Volume",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={{ fill: "#f97316" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.analytics.tradeStatus}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mockTradeStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {mockTradeStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 sm:space-y-6">
              {/* Quick Actions - Payout & KYC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KYC Status Card */}
                <Card className={`border-2 ${
                  data?.user?.kycStatus === 'verified' || data?.user?.kycStatus === 'VERIFIED'
                    ? 'border-green-500/50 bg-green-500/5'
                    : data?.user?.kycStatus === 'in_progress'
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-orange-500/50 bg-orange-500/5'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          data?.user?.kycStatus === 'verified' || data?.user?.kycStatus === 'VERIFIED'
                            ? 'bg-green-500/20'
                            : data?.user?.kycStatus === 'in_progress'
                            ? 'bg-yellow-500/20'
                            : 'bg-orange-500/20'
                        }`}>
                          {data?.user?.kycStatus === 'verified' || data?.user?.kycStatus === 'VERIFIED' ? (
                            <CheckIcon className="w-6 h-6 text-green-500" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.kycVerification}</h3>
                          <p className="text-sm text-muted-foreground">
                            {data?.user?.kycStatus === 'verified' || data?.user?.kycStatus === 'VERIFIED'
                              ? messages.dashboard.kycVerified
                              : data?.user?.kycStatus === 'in_progress'
                              ? messages.dashboard.kycInProgress
                              : messages.dashboard.kycRequired}
                          </p>
                        </div>
                      </div>
                      {(data?.user?.kycStatus !== 'verified' && data?.user?.kycStatus !== 'VERIFIED') && (
                        <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                          <Link href="/kyc">Vérifier</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Card */}
                <Card className="border-2 border-green-500/50 bg-green-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <BanknotesIcon className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.withdrawFunds}</h3>
                          <p className="text-sm text-muted-foreground">
                            {messages.dashboard.sepaOrCard}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                        <Link href="/payout">Retirer</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preferred Payment Method Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{messages.dashboard.payments.preferredMethod}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {messages.dashboard.payments.selectPreferred}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stripe Option */}
                    <div 
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        preferredPaymentMethod === 'stripe' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setPreferredPaymentMethod('stripe')}
                    >
                      {preferredPaymentMethod === 'stripe' && (
                        <div className="absolute top-3 right-3">
                          <CheckIcon className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                          <StripeIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.payments.stripe}</h3>
                          <p className="text-sm text-muted-foreground">
                            Cartes bancaires
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Qonto Option */}
                    <div 
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        preferredPaymentMethod === 'qonto' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setPreferredPaymentMethod('qonto')}
                    >
                      {preferredPaymentMethod === 'qonto' && (
                        <div className="absolute top-3 right-3">
                          <CheckIcon className="w-5 h-5 text-orange-500" />
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                          <QontoIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.payments.qonto}</h3>
                          <p className="text-sm text-muted-foreground">
                            Virement bancaire
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Binance Option */}
                    <div 
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                        preferredPaymentMethod === 'binance' 
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setPreferredPaymentMethod('binance')}
                    >
                      {preferredPaymentMethod === 'binance' && (
                        <div className="absolute top-3 right-3">
                          <CheckIcon className="w-5 h-5 text-yellow-500" />
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                          <BinanceIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.payments.binance}</h3>
                          <p className="text-sm text-muted-foreground">
                            Cryptomonnaies
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Payment Methods Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{messages.dashboard.payments.methods}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <BanknotesIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">SEPA - Qonto</p>
                            <p className="text-sm text-muted-foreground">
                              FR76 **** **** **** **89
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            {messages.dashboard.payments.verified}
                          </Badge>
                          <Badge variant="outline">{messages.dashboard.payments.default}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-xs">
                              ₿
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">Bitcoin</p>
                            <p className="text-sm text-muted-foreground">
                              1A1z...DivfNa
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {messages.dashboard.payments.verified}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      {messages.dashboard.payments.addMethod}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.settings.profile}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                        <AvatarFallback>
                          {user?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Steam ID: {user?.steamId}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          KYC{" "}
                          {user?.kycStatus === "APPROVED"
                            ? messages.kyc.approved
                            : messages.kyc.pending}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.settings.security}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{messages.dashboard.settings.twoFactor}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.dashboard.settings.twoFactorDesc}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {messages.dashboard.settings.enabled}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{messages.dashboard.settings.emailNotifications}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.dashboard.settings.emailNotificationsDesc}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {messages.dashboard.settings.enabled}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Onboarding Dialog */}
      <OnboardingDialog 
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
