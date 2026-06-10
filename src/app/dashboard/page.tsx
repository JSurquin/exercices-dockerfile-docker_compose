"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
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
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { useTourMode } from '@/components/providers/tour-provider';
import { DashboardTourDemo } from '@/components/tour-demos/dashboard-tour-demo';
import OnboardingDialog from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Messages } from "~/utils/types";
import { User } from "~/utils/types";
import { toast } from "sonner";
import { useUserTrades } from "@/hooks/use-user-trades";
import { formatPlatformVolume } from "@/hooks/use-public-stats";
import { TradeItemsGallery } from "@/components/trade/trade-items-gallery";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  TicketIcon,
  StarIcon,
  BanknotesIcon,
  CheckIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GiftIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Snowflake, TrendingUp } from "lucide-react";
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
  AreaChart,
  Area,
} from "recharts";
import CountUp from "react-countup";
import { formatCentsToCurrency } from "@/lib/currency-converter";
import { ConvertedPrice } from "@/components/ui/converted-price";
import { getLevelInfo, getLevelName, LEVELS } from "@/lib/level-system";
import { LevelHelpPopover } from "@/components/ui/level-help-popover";
import { LevelBadge, FragmentBadge } from "@/components/ui/level-badge";
import { LevelProgressBar } from "@/components/ui/level-progress-bar";

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + "€";
};

const getStatusBadgeClass = (status: string) => {
  const glass =
    "border backdrop-blur-sm font-normal";
  const colors: Record<string, string> = {
    CREATED: `${glass} bg-theme-accent/10 text-theme-highlight border-theme-accent/25`,
    ACCEPTED_BY_BOT: `${glass} bg-theme-accent/12 text-theme-highlight border-theme-accent/30`,
    IN_TRADE_HOLD: `${glass} bg-amber-500/10 text-amber-800 dark:text-amber-200/90 border-amber-500/25`,
    AVAILABLE: `${glass} bg-theme-success/10 text-theme-success border-theme-success/25`,
    PAYOUT_PENDING: `${glass} bg-theme-stat/10 text-theme-stat border-theme-stat/25`,
    PAID: `${glass} bg-theme-success/12 text-theme-success border-theme-success/30`,
    FAILED: `${glass} bg-red-500/10 text-red-700 dark:text-red-300/90 border-red-500/20`,
    CANCELLED: `${glass} bg-muted/40 text-muted-foreground border-border/60`,
    créé: `${glass} bg-theme-accent/10 text-theme-highlight border-theme-accent/25`,
    accepté_par_bot: `${glass} bg-theme-accent/12 text-theme-highlight border-theme-accent/30`,
    en_trade_hold: `${glass} bg-amber-500/10 text-amber-800 dark:text-amber-200/90 border-amber-500/25`,
    disponible: `${glass} bg-theme-success/10 text-theme-success border-theme-success/25`,
    paiement_en_cours: `${glass} bg-theme-stat/10 text-theme-stat border-theme-stat/25`,
    payé: `${glass} bg-theme-success/12 text-theme-success border-theme-success/30`,
    échoué: `${glass} bg-red-500/10 text-red-700 dark:text-red-300/90 border-red-500/20`,
  };
  return colors[status] || `${glass} bg-muted/40 text-muted-foreground border-border/60`;
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
    CANCELLED: "annulé",
  };
  
  const statusKey = statusKeyMap[status] || status;
  return messages.trade.status[statusKey as keyof typeof messages.trade.status] || status;
};

type DashboardPayoutApi = {
  id: string;
  status: string;
  amountCents: number;
  paymentReference: string | null;
  flexifyPayoutId: string | null;
  whitepayTransactionId: string | null;
  whitepayTargetCurrency: string | null;
  whitepayTargetValue: string | null;
  whitepayNetwork: string | null;
  createdAt: string;
  paymentMethod: { id: string; type: string } | null;
  trade: { id: string; ticketId: string | null } | null;
};

const PAYOUT_TERMINAL = new Set([
  "PAID",
  "FAILED",
  "CANCELLED",
  "FLEXIFY_PAID",
  "FLEXIFY_FAILED",
  "WHITEPAY_COMPLETE",
  "WHITEPAY_DECLINED",
]);

const isPayoutInProgress = (status: string) => !PAYOUT_TERMINAL.has(status);

const payoutChannelLabel = (
  p: DashboardPayoutApi,
  pay: Messages["dashboard"]["payments"],
) => {
  const t = p.paymentMethod?.type ?? "";
  if (p.whitepayTransactionId || t === "WHITEPAY_CRYPTO") return pay.channelWhitepay;
  if (["FLEXIFY_CARD", "FLEXIFY_SEPA", "CARD", "SEPA"].includes(t)) return pay.channelFlexify;
  return pay.channelOther;
};

const formatPayoutReference = (p: DashboardPayoutApi) =>
  p.paymentReference ||
  p.flexifyPayoutId ||
  (p.whitepayTransactionId ? `${p.whitepayTransactionId.slice(0, 12)}…` : null) ||
  `${p.id.slice(0, 10)}…`;

const payoutStatusBadgeClass = (status: string) => {
  const pill = "rounded-full font-normal backdrop-blur-sm";
  if (["PAID", "FLEXIFY_PAID", "WHITEPAY_COMPLETE"].includes(status)) {
    return `${pill} bg-emerald-500/8 text-emerald-700/90 dark:text-emerald-300/80 border-emerald-500/20`;
  }
  if (["FAILED", "FLEXIFY_FAILED", "WHITEPAY_DECLINED", "CANCELLED"].includes(status)) {
    return `${pill} bg-red-500/8 text-red-700/90 dark:text-red-300/80 border-red-500/20`;
  }
  return `${pill} bg-theme-stat/10 text-theme-highlight border-theme-highlight/25`;
};

const payoutStatusLabel = (
  status: string,
  labels: Messages["dashboard"]["payments"]["status"],
) => labels[status as keyof typeof labels] ?? status;

const dateLocaleTag = (locale: string) =>
  locale === "en" ? "en-GB" : locale === "cn" ? "zh-CN" : "fr-FR";

export default function DashboardPage() {
  const { isTourMode } = useTourMode();
  const { data, isPending, error } = useSession();
  const searchParams = useSearchParams();
  const { isFirstLogin, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const { data: tradesData, loading: tradesLoading, error: tradesError, refetch: refetchTrades } = useUserTrades();
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.userDashboard,
    queryFn: async () => {
      const response = await fetch('/api/user/dashboard-stats');
      if (!response.ok) throw new Error('Erreur statistiques');
      return response.json();
    },
    enabled: !!data?.user,
  });
  const [refreshingTradeId, setRefreshingTradeId] = useState<string | null>(null);
  const [refreshingKyc, setRefreshingKyc] = useState(false);
  const autoPollingDone = useRef(false);
  const queryClient = useQueryClient();

  const { data: balanceHistoryData, isLoading: balanceHistoryLoading } = useQuery({
    queryKey: queryKeys.userBalanceHistory,
    queryFn: async () => {
      const response = await fetch('/api/user/balance-history');
      if (!response.ok) throw new Error('Erreur historique solde');
      return response.json() as Promise<{
        history: { date: string; balanceCents: number }[];
        variationCents: number;
        variationPct: number;
        currentBalanceCents: number;
        availableCents: number;
        frozenBalanceCents: number;
        pendingBalanceCents: number;
        projectedAvailableCents: number;
        pendingTradesCount: number;
        nextReleaseAt: string | null;
      }>;
    },
    enabled: !!data?.user,
    refetchOnWindowFocus: true,
  });

  const { messages, locale: appLocale } = useLocale();
  const collectedVolumeDisplay = formatPlatformVolume(dashboardStats?.totalCollectedCents ?? 0);
  
  // Auto-claim DAILY_VISIT silencieusement à l'ouverture du dashboard
  useEffect(() => {
    if (!data?.user) return;
    fetch('/api/missions/daily-visit', { method: 'POST', credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.fragments) {
          toast.success(`+${j.fragments} fragments`, {
            description: messages.dashboard.dailyVisitClaimed,
            duration: 3000,
          });
        }
      })
      .catch(() => {});
  }, [data?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vérifier si c'est une connexion Steam réussie
  useEffect(() => {
    if (searchParams.get('steam_login') === 'success') {
      toast.success(messages.toast.steamLoginSuccess, {
        description: `${messages.dashboard.welcome} ${data?.user?.name || 'sur MoonSkin'} !`,
        duration: 4000,
      });
      
      // Nettoyer l'URL
      const url = new URL(window.location.href);
      url.searchParams.delete('steam_login');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, data?.user?.name, messages.toast.steamLoginSuccess, messages.dashboard.welcome]);

  // Gérer l'affichage de l'onboarding
  useEffect(() => {
    // Afficher l'onboarding seulement si :
    // 1. L'utilisateur est connecté
    // 2. C'est sa première connexion
    // 3. Il n'a pas déjà été fermé dans cette session
    if (data?.user && isFirstLogin && !onboardingDismissed) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [data, isFirstLogin, onboardingDismissed]);

  const handleOnboardingComplete = async () => {
    // Fermer immédiatement pour l'UX, puis tenter l'appel API
    setShowOnboarding(false);
    setOnboardingDismissed(true);
    await completeOnboarding();
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
        const tradeResult = result.trade as {
          message?: string;
          balanceCredited?: boolean;
        };

        if (tradeResult.balanceCredited) {
          toast.success(
            messages.dashboard.toasts.balanceCredited,
            {
              description: messages.dashboard.toasts.fundsReleased,
            }
          );
          queryClient.invalidateQueries({ queryKey: queryKeys.userBalanceHistory });
          queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
        } else {
          toast.success(messages.dashboard.toasts.statusUpdated, {
            description:
              tradeResult.message || messages.dashboard.toasts.statusVerified,
          });
        }

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

  // Double polling automatique : quand les trades sont chargés, on vérifie
  // automatiquement ceux en IN_TRADE_HOLD ou ACCEPTED_BY_BOT auprès de Skinplace.
  // Si le webhook IPN #2 n'a pas fonctionné, ce polling rattrape le coup et
  // crédite le solde quand protection_status=confirmed.
  useEffect(() => {
    if (autoPollingDone.current || !tradesData?.trades?.length || !data?.user) return;
    autoPollingDone.current = true;

    const PENDING_STATUSES = new Set(['accepté_par_bot', 'en_trade_hold', 'créé']);
    const tradesToPoll = tradesData.trades.filter((t) =>
      PENDING_STATUSES.has(t.status) ||
      (t.status === 'disponible' && !t.balanceCreditedAt)
    );

    if (tradesToPoll.length === 0) return;

    (async () => {
      let anyUpdated = false;
      for (const trade of tradesToPoll) {
        try {
          const res = await fetch(`/api/skinplace/trade/status/${trade.id}`, {
            method: 'GET',
            credentials: 'include',
          });
          if (!res.ok) continue;
          const result = await res.json();
          if (result.success && result.trade?.balanceCredited) {
            anyUpdated = true;
            toast.success(
              messages.dashboard.toasts.balanceCredited,
              {
                description: `${trade.ticketId} — ${messages.dashboard.toasts.fundsReleased}`,
              }
            );
          } else if (result.success && result.trade?.oldStatus && result.trade.oldStatus !== result.trade.status) {
            anyUpdated = true;
          }
        } catch {
          // Silently ignore polling errors
        }
      }
      if (anyUpdated) {
        refetchTrades();
        queryClient.invalidateQueries({ queryKey: queryKeys.userBalanceHistory });
        queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
      }
    })();
  }, [tradesData, data?.user]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: payoutsPayload, isLoading: payoutsLoading, error: payoutsQueryError, refetch: refetchPayouts } = useQuery({
    queryKey: queryKeys.userPayouts,
    queryFn: async () => {
      const response = await fetch("/api/flexify/payout?limit=50", { credentials: "include" });
      if (!response.ok) throw new Error("payouts");
      return (await response.json()) as { payouts: DashboardPayoutApi[]; total: number };
    },
    enabled: !!data?.user,
  });

  const user = data?.user as User;
  const payoutList = payoutsPayload?.payouts ?? [];
  const payoutsInProgress = payoutList.filter((p) => isPayoutInProgress(p.status));
  const payoutsCompleted = payoutList.filter((p) => !isPayoutInProgress(p.status));
  const localeTag = dateLocaleTag(appLocale);

  if (isPending) {
    return (
      <PageLoading variant="compact" message={messages.common.loading} className="min-h-[50vh]" />
    );
  }

  if (!data || !user) {
    if (isTourMode) return <DashboardTourDemo />;
    return (
      <LoginRequiredBlock
        icon={<ChartBarIcon className="w-16 h-16" />}
        title={messages.dashboard.loginRequired}
        description={messages.dashboard.loginSubtitle}
        buttonLabel={messages.common.steamLogin}
      />
    );
  }

  const userXP = user?.xp ?? 0;
  const levelInfo = getLevelInfo(userXP);
  const nextLevelName = !levelInfo.isMaxLevel && levelInfo.levelIndex < LEVELS.length - 1
    ? getLevelName(levelInfo.levelIndex + 1)
    : null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 sm:mb-4"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.image} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {messages.dashboard.welcome}, {user?.name}
              </h1>
              <p className="text-muted-foreground">
                {messages.dashboard.subtitle}
              </p>
            </div>
          </div>

          {/* XP Progress */}
          <Card data-tour="dashboard-xp" className="py-0 gap-0">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-start gap-2.5">
                <LevelBadge tierIndex={levelInfo.tierIndex} size="md" className="shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold sm:text-base">
                          {levelInfo.level.name} — Palier {levelInfo.tierIndex + 1}/5
                        </h3>
                        <LevelHelpPopover />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {levelInfo.saleBonus > 0
                          ? `Bonus vendeur actif : ${levelInfo.saleBonusPct} sur tes ventes`
                          : "Aucun bonus vendeur encore"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-bold tabular-nums">
                        {levelInfo.cappedXP.toLocaleString()} / {levelInfo.level.xpEnd.toLocaleString()} {messages.dashboard.xp}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        −{levelInfo.nextTierXP.toLocaleString()} XP prochain palier
                      </p>
                      {!levelInfo.isMaxLevel && levelInfo.nextLevelXP != null && nextLevelName && (
                        <p className="text-[11px] text-muted-foreground">
                          −{levelInfo.nextLevelXP.toLocaleString()} XP pour {nextLevelName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <LevelProgressBar xp={userXP} className="pt-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          data-tour="dashboard-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-3 sm:mb-4"
        >
          <Card className="overflow-hidden border-theme-highlight/20 bg-gradient-to-br from-theme-highlight/5 via-background to-theme-accent/5 py-0 gap-0">
            <CardContent className="p-0">
              {/* Solde disponible */}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center">
                      <BanknotesIcon className="w-4 h-4 text-theme-accent" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {messages.dashboard.balance.title}
                    </span>
                  </div>
                  {balanceHistoryData && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      balanceHistoryData.variationCents >= 0
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {balanceHistoryData.variationCents >= 0
                        ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                        : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
                      }
                      {balanceHistoryData.variationPct >= 0 ? "+" : ""}
                      {balanceHistoryData.variationPct}%
                      <span className="text-muted-foreground font-normal ml-0.5">
                        {messages.dashboard.balance.last7days}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div>
                    {balanceHistoryLoading ? (
                      <div className="h-10 w-36 animate-pulse bg-muted rounded-lg" />
                    ) : (
                      <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        <CountUp
                          end={(balanceHistoryData?.availableCents ?? balanceHistoryData?.currentBalanceCents ?? 0) / 100}
                          duration={1.5}
                          decimals={2}
                          suffix="€"
                          separator=" "
                        />
                      </p>
                    )}
                    {balanceHistoryData && balanceHistoryData.variationCents !== 0 && (
                      <p className={`text-sm mt-1 ${
                        balanceHistoryData.variationCents >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {balanceHistoryData.variationCents >= 0 ? "+" : ""}
                        {formatCentsToCurrency(balanceHistoryData.variationCents, "EUR")}{" "}
                        {messages.dashboard.balance.vsLastWeek}
                      </p>
                    )}
                  </div>

                  {!balanceHistoryLoading && (balanceHistoryData?.frozenBalanceCents ?? 0) > 0 && (
                    <div className="pb-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {messages.dashboard.balance.frozenBalance}
                      </p>
                      <p className="text-base font-bold text-theme-stat tabular-nums">
                        {formatCentsToCurrency(balanceHistoryData!.frozenBalanceCents, "EUR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Projection trade hold — entre solde et graphique */}
              {!balanceHistoryLoading && (balanceHistoryData?.pendingBalanceCents ?? 0) > 0 && (
                <div className="border-y border-theme-highlight/25 bg-gradient-to-r from-theme-highlight/10 via-theme-highlight/5 to-theme-accent/5 px-4 sm:px-5 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-theme-stat/15 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4 text-theme-highlight" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-theme-highlight">
                          {messages.dashboard.balance.projectedTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {messages.dashboard.balance.projectedHint}
                        </p>
                        {(balanceHistoryData?.pendingTradesCount ?? 0) > 0 && (
                          <p className="text-xs text-theme-highlight/80 dark:text-theme-highlight/80 mt-1 flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                            {messages.dashboard.balance.pendingTrades.replace(
                              '{count}',
                              String(balanceHistoryData!.pendingTradesCount),
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 pl-12 sm:pl-0">
                      <p className="text-xl sm:text-2xl font-bold text-theme-stat tabular-nums">
                        <CountUp
                          end={(balanceHistoryData?.projectedAvailableCents ?? 0) / 100}
                          duration={1.5}
                          decimals={2}
                          suffix="€"
                          separator=" "
                        />
                      </p>
                      <p className="text-xs font-medium text-theme-highlight mt-0.5">
                        {messages.dashboard.balance.projectedPending.replace(
                          '{amount}',
                          formatCentsToCurrency(balanceHistoryData!.pendingBalanceCents, 'EUR'),
                        )}
                      </p>
                      {balanceHistoryData?.nextReleaseAt && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {messages.dashboard.balance.nextRelease}:{' '}
                          {new Date(balanceHistoryData.nextReleaseAt).toLocaleDateString(
                            appLocale === 'en' ? 'en-GB' : appLocale === 'cn' ? 'zh-CN' : 'fr-FR',
                            { day: 'numeric', month: 'long', year: 'numeric' },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
                <div className="p-3 sm:p-4 flex flex-col justify-center">
                  <Link href="/payout">
                    <Button
                      variant="chrome"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <BanknotesIcon className="w-4 h-4 mr-2" />
                      {messages.payments.withdraw}
                    </Button>
                  </Link>
                </div>

                {/* Graphique de variation */}
                <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {messages.dashboard.balance.chart30days}
                  </p>
                  {balanceHistoryLoading ? (
                    <div className="h-12 animate-pulse bg-muted rounded-lg" />
                  ) : !balanceHistoryData?.history?.length ? (
                    <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                      {messages.dashboard.balance.noData}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart
                        data={balanceHistoryData.history.map((d) => ({
                          date: new Date(d.date).toLocaleDateString(
                            appLocale === "en" ? "en-GB" : appLocale === "cn" ? "zh-CN" : "fr-FR",
                            { day: "2-digit", month: "short" }
                          ),
                          solde: d.balanceCents / 100,
                        }))}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--theme-accent)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "currentColor" }}
                          className="text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          interval={6}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [
                            `${value.toFixed(2)} €`,
                            messages.dashboard.balance.title,
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="solde"
                          stroke="var(--theme-accent)"
                          strokeWidth={2}
                          fill="url(#balanceGradient)"
                          dot={false}
                          activeDot={{ r: 4, fill: "var(--theme-accent)" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          data-tour="dashboard-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4"
        >
          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.volume}</p>
                  <p className="text-xl font-bold">
                    <CountUp
                      end={(tradesData?.totalVolume || 0) / 100}
                      duration={2}
                      decimals={2}
                      suffix="€"
                    />
                  </p>
                </div>
                <CurrencyDollarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.trades}</p>
                  <p className="text-xl font-bold">
                    <CountUp end={tradesData?.totalTrades || 0} duration={2} />
                  </p>
                </div>
                <ChartBarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.level}</p>
                  <p className="text-xl font-bold">{levelInfo.level.name}</p>
                  <p className="text-xs text-muted-foreground">Palier {levelInfo.tierIndex + 1}/5</p>
                </div>
                <StarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 border-theme-highlight/25 dark:border-theme-highlight/35">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.fragmentsLabel}</p>
                  <motion.p 
                    key={(user as unknown as { fragments?: number })?.fragments ?? 0}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.4 }}
                    className="text-xl font-bold text-theme-stat flex items-center gap-2"
                  >
                    {(user as unknown as { fragments?: number })?.fragments ?? 0}
                    <FragmentBadge size="sm" />
                  </motion.p>
                  <Link href="/missions" className="text-xs text-theme-accent hover:underline">
                    {messages.dashboard.viewMissions}
                  </Link>
                </div>
                <FragmentBadge size="md" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 border-theme-accent/20 dark:border-theme-accent/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.giveawaysLabel}</p>
                  <Link href="/giveaways" className="text-theme-accent hover:underline text-sm font-medium">
                    {messages.dashboard.participateGiveaway}
                  </Link>
                </div>
                <GiftIcon className="w-6 h-6 text-theme-accent/70 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="trades" className="space-y-3 sm:space-y-4" data-tour="dashboard-trades">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-0">
              <TabsTrigger value="trades" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.trades}</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.analytics}</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.payments}</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.settings}</TabsTrigger>
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                    <div className="space-y-2">
                      {tradesData.trades.map((trade) => (
                      <div key={trade.id} className="border rounded-lg p-2.5 sm:p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className={getStatusBadgeClass(trade.status)}
                            >
                              {getStatusText(trade.status, messages)}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {trade.ticketId}
                            </span>
                            {/* Bouton pour rafraîchir le statut - uniquement pour les trades actifs */}
                            {(trade.status === 'créé' || trade.status === 'accepté_par_bot' || trade.status === 'en_trade_hold') && (
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
                              <ConvertedPrice usdCents={trade.brutCentimes} fromCurrency="USD" />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(trade.status === 'en_trade_hold' && !trade.balanceCreditedAt)
                                ? messages.dashboard.tradeHistory.pendingCredit
                                : messages.dashboard.tradeHistory.netCredit}{" "}
                              <ConvertedPrice usdCents={trade.netCentimes} fromCurrency="USD" className="text-green-600 font-medium" />
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(trade.créédLe).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 text-sm">
                          {/* Galerie d'images des skins */}
                          <div className="flex-shrink-0">
                            <p className="text-muted-foreground text-xs mb-2">
                              {messages.dashboard.tradeHistory.items} ({trade.items.length})
                            </p>
                            <TradeItemsGallery items={trade.items} />
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">
                                {messages.dashboard.tradeHistory.fees}
                              </span>
                              <p>{messages.dashboard.tradeHistory.cashout} <ConvertedPrice usdCents={trade.frais.cashout} fromCurrency="USD" /></p>
                            </div>
                            <div>
                              {trade.status === 'en_trade_hold' && trade.disponibleLe && (
                                <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-md bg-theme-stat/10 border border-theme-highlight/20">
                                  <ClockIcon className="w-3.5 h-3.5 text-theme-stat shrink-0" />
                                  <p className="text-xs text-theme-highlight">
                                    {messages.dashboard.tradeHistory.tradeHoldReminder}{" "}
                                    <span className="font-semibold">
                                      {new Date(trade.disponibleLe).toLocaleDateString()}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block mb-1">
                                {messages.dashboard.tradeHistory.timeline}
                              </span>
                              {trade.tradeAcceptéLe && (
                                <p>
                                  {messages.dashboard.tradeHistory.accepted}{" "}
                                  {new Date(trade.tradeAcceptéLe).toLocaleDateString()}
                                </p>
                              )}
                              {trade.disponibleLe && !['annulé', 'échoué'].includes(trade.status) && (
                                <p>
                                  {messages.dashboard.tradeHistory.available}{" "}
                                  {new Date(trade.disponibleLe).toLocaleDateString()}
                                </p>
                              )}
                            </div>
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
            <TabsContent value="analytics" className="space-y-3 sm:space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1 px-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                    {messages.dashboard.analytics.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
                    {messages.dashboard.analytics.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Card className="py-0 gap-0 border-theme-highlight/20 bg-gradient-to-br from-theme-highlight/5 via-background to-transparent">
                    <CardContent className="p-3 sm:p-4">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {messages.dashboard.analytics.totalSalesVolume}
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
                              <CountUp
                                end={collectedVolumeDisplay.value}
                                duration={2.5}
                                decimals={collectedVolumeDisplay.decimals}
                                prefix={collectedVolumeDisplay.prefix}
                                suffix={collectedVolumeDisplay.suffix}
                                separator=" "
                              />
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {messages.dashboard.analytics.totalSalesVolumeDesc}
                            </p>
                          </div>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border/60">
                            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="py-0 gap-0 border-theme-highlight/20 bg-gradient-to-br from-theme-highlight/5 via-background to-transparent">
                    <CardContent className="p-3 sm:p-4">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {messages.dashboard.analytics.totalSkinsSold}
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
                              <CountUp
                                end={dashboardStats?.totalSkinsSold ?? 0}
                                duration={2.5}
                                separator=" "
                              />
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {messages.dashboard.analytics.totalSkinsSoldDesc}
                            </p>
                          </div>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border/60">
                            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="px-1">
                    <h3 className="text-lg font-semibold">{messages.dashboard.analytics.personalTitle}</h3>
                    <p className="text-sm text-muted-foreground">{messages.dashboard.analytics.personalSubtitle}</p>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{messages.dashboard.analytics.tradingVolume}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <div className="flex items-center justify-center h-[200px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={dashboardStats?.volumeData || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,205,220,0.15)" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(value) => [
                                  formatPrice(value as number),
                                  messages.dashboard.volume,
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="volume"
                                stroke="var(--theme-stat)"
                                strokeWidth={2}
                                dot={{ fill: "var(--theme-accent)", r: 3 }}
                                activeDot={{ r: 4, fill: "var(--theme-highlight)" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>{messages.dashboard.analytics.tradeStatus}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <div className="flex items-center justify-center h-[200px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={dashboardStats?.tradeStatusData || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={64}
                                fill="#8884d8"
                                dataKey="count"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {(dashboardStats?.tradeStatusData || []).map((entry: { name: string; count: number; color: string }, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 sm:space-y-6">
              {/* Quick Actions - Payout & KYC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KYC Status Card */}
                <Card className={`border backdrop-blur-sm ${
                  data?.user?.kycStatus === 'VERIFIED' || data?.user?.kycStatus === 'KYCAID_VERIFIED'
                    ? 'border-theme-success/20 bg-theme-success/5'
                    : data?.user?.kycStatus === 'IN_PROGRESS'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-theme-accent/25 bg-theme-accent/5'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                          data?.user?.kycStatus === 'VERIFIED' || data?.user?.kycStatus === 'KYCAID_VERIFIED'
                            ? 'bg-theme-success/10 border-theme-success/20'
                            : data?.user?.kycStatus === 'IN_PROGRESS'
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-theme-accent/10 border-theme-accent/20'
                        }`}>
                          {data?.user?.kycStatus === 'VERIFIED' || data?.user?.kycStatus === 'KYCAID_VERIFIED' ? (
                            <CheckIcon className="w-6 h-6 text-theme-success" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-theme-accent">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.kycVerification}</h3>
                          <p className="text-sm text-muted-foreground">
                            {data?.user?.kycStatus === 'VERIFIED' || data?.user?.kycStatus === 'KYCAID_VERIFIED'
                              ? messages.dashboard.kycVerified
                              : data?.user?.kycStatus === 'IN_PROGRESS'
                              ? messages.dashboard.kycInProgress
                              : messages.dashboard.kycRequired}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(data?.user?.kycStatus !== 'VERIFIED' && data?.user?.kycStatus !== 'KYCAID_VERIFIED') && (
                          <Button asChild variant="cta">
                            <Link href="/kyc">{messages.payments.verify}</Link>
                          </Button>
                        )}
                        <Button 
                          variant="chrome" 
                          size="sm"
                          onClick={async () => {
                            setRefreshingKyc(true);
                            try {
                              // Récupérer le verificationId
                              const statusRes = await fetch('/api/kycaid/status');
                              if (statusRes.ok) {
                                const statusData = await statusRes.json();
                                if (statusData.verificationId) {
                                  // Forcer le poll
                                  const pollRes = await fetch(`/api/kycaid/poll/${statusData.verificationId}`);
                                  if (pollRes.ok) {
                                    const pollData = await pollRes.json();
                                    if (pollData.verified === true && pollData.status === 'completed') {
                                      toast.success(messages.dashboard.payments.kycToastVerified);
                                    } else if (pollData.verified === false && pollData.status === 'completed') {
                                      toast.error(messages.dashboard.payments.kycToastRejected);
                                    } else {
                                      toast.info(messages.dashboard.payments.kycToastUpdated);
                                    }
                                    // Recharger la page pour mettre à jour l'UI
                                    setTimeout(() => window.location.reload(), 1000);
                                  }
                                } else {
                                  toast.info(messages.dashboard.payments.kycToastNoVerification);
                                }
                              }
                            } catch (error) {
                              console.error('Error refreshing KYC:', error);
                              toast.error(messages.dashboard.payments.kycToastRefreshError);
                            } finally {
                              setRefreshingKyc(false);
                            }
                          }}
                          disabled={refreshingKyc}
                        >
                          {refreshingKyc ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                              {messages.dashboard.payments.kycRefreshing}
                            </>
                          ) : (
                            <>
                              <ArrowPathIcon className="w-4 h-4 mr-2" />
                              {messages.dashboard.payments.kycRefreshStatus}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Card */}
                <Card className="py-0 gap-0 border-theme-highlight/25">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center">
                          <BanknotesIcon className="w-5 h-5 text-theme-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{messages.dashboard.withdrawFunds}</h3>
                          <p className="text-sm text-muted-foreground">
                            {messages.dashboard.sepaOrCard}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="chrome" size="sm">
                        <Link href="/payout">{messages.payments.withdraw}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payout history (Flexify / Whitepay) */}
              <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BanknotesIcon className="w-5 h-5" />
                      {messages.dashboard.payments.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {messages.dashboard.payments.subtitle}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="chrome"
                    size="sm"
                    className="shrink-0"
                    onClick={() => refetchPayouts()}
                    disabled={payoutsLoading}
                  >
                    <ArrowPathIcon className={`w-4 h-4 mr-2 ${payoutsLoading ? "animate-spin" : ""}`} />
                    {messages.dashboard.payments.refreshPayoutList}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  {payoutsQueryError && (
                    <p className="text-sm text-destructive">{messages.dashboard.payments.loadError}</p>
                  )}

                  {payoutsLoading && !payoutList.length ? (
                    <PageLoading variant="compact" message={messages.common.loading} className="py-6" />
                  ) : null}

                  {!payoutsLoading && !payoutList.length && !payoutsQueryError ? (
                    <p className="text-sm text-muted-foreground">{messages.dashboard.payments.empty}</p>
                  ) : null}

                  {payoutsInProgress.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">{messages.dashboard.payments.inProgress}</h4>
                      <ul className="space-y-3">
                        {payoutsInProgress.map((p) => (
                          <li
                            key={p.id}
                            className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium tabular-nums">{formatPrice(p.amountCents)}</span>
                                <Badge variant="outline" className={payoutStatusBadgeClass(p.status)}>
                                  {payoutStatusLabel(p.status, messages.dashboard.payments.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleString(localeTag, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {messages.dashboard.payments.channel}: {payoutChannelLabel(p, messages.dashboard.payments)}
                              </p>
                              {(p.whitepayTargetCurrency || p.whitepayNetwork || p.whitepayTargetValue) && (
                                <p className="text-xs text-muted-foreground">
                                  {[p.whitepayTargetValue, p.whitepayTargetCurrency].filter(Boolean).join(" ")}
                                  {p.whitepayNetwork ? ` · ${p.whitepayNetwork}` : ""}
                                </p>
                              )}
                              {p.trade?.ticketId ? (
                                <p className="text-xs">
                                  <span className="text-muted-foreground">{messages.dashboard.payments.trade}: </span>
                                  {p.trade.ticketId}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground sm:text-right sm:max-w-[40%] truncate">
                              <span className="font-medium text-foreground/80">{messages.dashboard.payments.reference}: </span>
                              {formatPayoutReference(p)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {payoutsCompleted.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">{messages.dashboard.payments.history}</h4>
                      <ul className="space-y-3">
                        {payoutsCompleted.map((p) => (
                          <li
                            key={p.id}
                            className="rounded-lg border border-border/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium tabular-nums">{formatPrice(p.amountCents)}</span>
                                <Badge variant="outline" className={payoutStatusBadgeClass(p.status)}>
                                  {payoutStatusLabel(p.status, messages.dashboard.payments.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleString(localeTag, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {messages.dashboard.payments.channel}: {payoutChannelLabel(p, messages.dashboard.payments)}
                              </p>
                              {(p.whitepayTargetCurrency || p.whitepayNetwork || p.whitepayTargetValue) && (
                                <p className="text-xs text-muted-foreground">
                                  {[p.whitepayTargetValue, p.whitepayTargetCurrency].filter(Boolean).join(" ")}
                                  {p.whitepayNetwork ? ` · ${p.whitepayNetwork}` : ""}
                                </p>
                              )}
                              {p.trade?.ticketId ? (
                                <p className="text-xs">
                                  <span className="text-muted-foreground">{messages.dashboard.payments.trade}: </span>
                                  {p.trade.ticketId}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground sm:text-right sm:max-w-[40%] truncate">
                              <span className="font-medium text-foreground/80">{messages.dashboard.payments.reference}: </span>
                              {formatPayoutReference(p)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                      <Badge className="mission-glass-badge gap-1.5 font-normal">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme-success/70" />
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
                      <Badge className="mission-glass-badge gap-1.5 font-normal">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme-success/70" />
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
