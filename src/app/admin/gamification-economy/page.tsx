'use client';

import { useQuery } from '@tanstack/react-query';
import { ADMIN_GAMIFICATION_REFETCH_INTERVAL_MS } from '@/lib/admin-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/components/providers/locale-provider';
import {
  SparklesIcon,
  GiftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface EconomyData {
  marginRateAssumption: number;
  fragments: {
    generatedTotal: number;
    generated24h: number;
    generated7d: number;
    generated30d: number;
    spentTotalGiveaways: number;
    spent24hAbs: number;
    spent7dAbs: number;
    spent30dAbs: number;
    circulationTheoretical: number;
    unusedOnBalances: number;
    utilizationRate30d: number;
    byType: { type: string; _sum: { amount: number | null } }[];
  };
  giveaways: {
    countByStatus: Record<string, number>;
    endedCount: number;
    totalEntries: number;
    approxUniqueParticipants: number;
    avgEntriesPerEndedGiveaway: number;
    totalEndedRewardCostCents: number;
    costLast7dCents: number;
    costLast30dCents: number;
    costByDurationType: { durationType: string; _sum: { rewardValueCents: number | null }; _count: number }[];
  };
  finance: {
    volumeSoldCents7d: number;
    volumeSoldCents30d: number;
    estimatedGrossBenefitEur7d: number;
    estimatedGrossBenefitEur30d: number;
    giveawayCostEur7d: number;
    giveawayCostEur30d: number;
    ratioGiveawayCostToBenefit7d: number | null;
    ratioGiveawayCostToBenefit30d: number | null;
  };
  alerts: string[];
}

const fmtEur = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const fmtNum = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString('fr-FR');

function KpiCard({
  label,
  value,
  sub,
  icon,
  color = 'text-white',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function RatioGauge({ ratio, label, t }: { ratio: number; label: string; t: Record<string, string> }) {
  const pct = Math.min(100, ratio * 100);
  const color =
    ratio > 0.15 ? 'bg-red-500' :
    ratio > 0.12 ? 'bg-primary' :
    ratio > 0.08 ? 'bg-yellow-500' :
    ratio > 0.03 ? 'bg-green-500' :
    'bg-blue-500';

  const status =
    ratio > 0.15 ? { label: t.statusDangerous, color: 'text-red-400' } :
    ratio > 0.12 ? { label: t.statusExpensive, color: 'text-theme-highlight' } :
    ratio > 0.08 ? { label: t.statusWatch, color: 'text-yellow-400' } :
    ratio > 0.03 ? { label: t.statusIdeal, color: 'text-green-400' } :
    { label: t.statusTooHard, color: 'text-blue-400' };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{(ratio * 100).toFixed(2)}%</span>
          <Badge className={`text-xs border-0 bg-transparent ${status.color} font-medium`}>
            {status.label}
          </Badge>
        </div>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, (pct / 20) * 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{t.rangeLabel0}</span>
        <span className="text-green-600">{t.rangeIdeal}</span>
        <span className="text-red-600">{t.rangeDanger}</span>
        <span>{t.rangeMax}</span>
      </div>
    </div>
  );
}

function UtilRateGauge({ rate, t }: { rate: number; t: Record<string, string> }) {
  const pct = rate * 100;
  const color =
    pct < 25 ? 'bg-blue-500' :
    pct < 60 ? 'bg-green-500' :
    pct < 85 ? 'bg-yellow-500' :
    'bg-red-500';

  const status =
    pct < 25 ? t.utilUnder :
    pct < 60 ? t.utilHealthy :
    pct < 85 ? t.utilHigh :
    t.utilOver;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{t.utilRate30d}</span>
        <span className="font-bold text-white">{pct.toFixed(1)}%</span>
      </div>
      <Progress value={pct} className={`h-3 bg-slate-700 [&>div]:${color}`} />
      <p className="text-xs text-slate-500">{status}</p>
    </div>
  );
}

function Recommendation({
  ratio30,
  utilRate,
  t,
}: {
  ratio30: number | null;
  utilRate: number;
  t: Record<string, string>;
}) {
  if (ratio30 === null) return null;

  if (ratio30 > 0.12) {
    return (
      <div className="rounded-lg border border-theme-accent/30 bg-theme-accent/10 p-4 space-y-1">
        <p className="text-theme-highlight font-semibold text-sm flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          {t.increasePrices}
        </p>
        <p className="text-slate-400 text-xs">
          {t.increasePricesDesc.replace('{ratio}', (ratio30 * 100).toFixed(1))}
        </p>
      </div>
    );
  }

  if (ratio30 < 0.03 && utilRate < 0.25) {
    return (
      <div className="rounded-lg border border-blue-700/50 bg-blue-950/30 p-4 space-y-1">
        <p className="text-blue-400 font-semibold text-sm flex items-center gap-2">
          <ArrowTrendingDownIcon className="w-4 h-4" />
          {t.decreasePrices}
        </p>
        <p className="text-slate-400 text-xs">
          {t.decreasePricesDesc
            .replace('{ratio}', (ratio30 * 100).toFixed(1))
            .replace('{util}', (utilRate * 100).toFixed(1))}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-700/50 bg-green-950/30 p-4 space-y-1">
      <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
        <CheckCircleIcon className="w-4 h-4" />
        {t.balanced}
      </p>
      <p className="text-slate-400 text-xs">
        {t.balancedDesc.replace('{ratio}', (ratio30 * 100).toFixed(1))}
      </p>
    </div>
  );
}

export default function AdminGamificationEconomyPage() {
  const { messages } = useLocale();
  const ge = messages.adminNav.gamificationEconomy;

  const { data, isLoading, error } = useQuery<EconomyData>({
    queryKey: ['admin', 'gamification-economy'],
    queryFn: async () => {
      const r = await fetch('/api/admin/gamification-economy', { credentials: 'include' });
      if (!r.ok) throw new Error(ge.loadError);
      return r.json();
    },
    refetchInterval: ADMIN_GAMIFICATION_REFETCH_INTERVAL_MS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-red-400 py-12 text-center">
        {ge.loadError}
      </div>
    );
  }

  const ratio30 = data.finance.ratioGiveawayCostToBenefit30d;
  const utilRate = data.fragments.utilizationRate30d;

  const decisionRows = [
    { range: ge.decisionGrid.range1, label: ge.decisionGrid.label1, desc: ge.decisionGrid.desc1, color: 'border-blue-700 bg-blue-950/30 text-blue-300' },
    { range: ge.decisionGrid.range2, label: ge.decisionGrid.label2, desc: ge.decisionGrid.desc2, color: 'border-green-700 bg-green-950/30 text-green-300' },
    { range: ge.decisionGrid.range3, label: ge.decisionGrid.label3, desc: ge.decisionGrid.desc3, color: 'border-yellow-700 bg-yellow-950/30 text-yellow-300' },
    { range: ge.decisionGrid.range4, label: ge.decisionGrid.label4, desc: ge.decisionGrid.desc4, color: 'border-theme-accent/30 bg-theme-accent/10 text-theme-highlight' },
    { range: ge.decisionGrid.range5, label: ge.decisionGrid.label5, desc: ge.decisionGrid.desc5, color: 'border-red-700 bg-red-950/30 text-red-300' },
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
          <ChartBarIcon className="w-7 h-7 text-theme-accent" />
          {ge.title}
        </h1>
        <p className="text-slate-400 text-sm">
          {ge.subtitle.replace('{rate}', ((data.marginRateAssumption ?? 0) * 100).toFixed(0))}
        </p>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-theme-highlight/30 bg-theme-highlight/10 p-4"
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-theme-highlight shrink-0 mt-0.5" />
              <p className="text-theme-highlight text-sm">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommandation */}
      <Recommendation ratio30={ratio30} utilRate={utilRate} t={ge.recommendation as unknown as Record<string, string>} />

      {/* Bloc 1 — Finance */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <ChartBarIcon className="w-4 h-4 text-theme-accent" />
          {ge.finance.title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label={ge.finance.volumeSold7d}
            value={fmtEur(data.finance.volumeSoldCents7d / 100)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.finance.volumeSold30d}
            value={fmtEur(data.finance.volumeSoldCents30d / 100)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.finance.grossMargin7d}
            value={fmtEur(data.finance.estimatedGrossBenefitEur7d)}
            icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label={ge.finance.grossMargin30d}
            value={fmtEur(data.finance.estimatedGrossBenefitEur30d)}
            icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label={ge.finance.giveawayCost7d}
            value={fmtEur(data.finance.giveawayCostEur7d)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-theme-highlight"
          />
          <KpiCard
            label={ge.finance.giveawayCost30d}
            value={fmtEur(data.finance.giveawayCostEur30d)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-theme-highlight"
          />
          <KpiCard
            label={ge.finance.ratio7d}
            value={data.finance.ratioGiveawayCostToBenefit7d != null
              ? `${(data.finance.ratioGiveawayCostToBenefit7d * 100).toFixed(2)}%`
              : '—'}
            icon={<ChartBarIcon className="w-4 h-4" />}
            color={
              data.finance.ratioGiveawayCostToBenefit7d != null && data.finance.ratioGiveawayCostToBenefit7d > 0.12
                ? 'text-red-400'
                : 'text-white'
            }
          />
          <KpiCard
            label={ge.finance.ratio30d}
            value={ratio30 != null ? `${(ratio30 * 100).toFixed(2)}%` : '—'}
            icon={<ChartBarIcon className="w-4 h-4" />}
            color={
              ratio30 != null && ratio30 > 0.12 ? 'text-red-400' :
              ratio30 != null && ratio30 > 0.08 ? 'text-yellow-400' :
              'text-green-400'
            }
          />
        </div>
      </div>

      {/* KPI principaux — jauges */}
      <Card className="bg-slate-900/80 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-theme-accent" />
            {ge.kpi.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {ratio30 != null && (
            <RatioGauge
              ratio={ratio30}
              label={ge.kpi.ratioLabel}
              t={ge.kpi as unknown as Record<string, string>}
            />
          )}
          <UtilRateGauge rate={utilRate} t={ge.kpi as unknown as Record<string, string>} />
        </CardContent>
      </Card>

      {/* Bloc 2 — Fragments */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <SparklesIcon className="w-4 h-4 text-theme-stat" />
          {ge.fragments.title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label={ge.fragments.generatedTotal}
            value={fmtNum(data.fragments.generatedTotal)}
            icon={<SparklesIcon className="w-4 h-4" />}
            color="text-theme-highlight"
          />
          <KpiCard
            label={ge.fragments.spentTotal}
            value={fmtNum(data.fragments.spentTotalGiveaways)}
            icon={<SparklesIcon className="w-4 h-4" />}
            color="text-theme-highlight"
          />
          <KpiCard
            label={ge.fragments.circulation}
            value={fmtNum(data.fragments.circulationTheoretical)}
            sub={ge.fragments.circulationSub}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.fragments.unused}
            value={fmtNum(data.fragments.unusedOnBalances)}
            sub={ge.fragments.unusedSub}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.fragments.generated24h}
            value={fmtNum(data.fragments.generated24h)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.fragments.generated7d}
            value={fmtNum(data.fragments.generated7d)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.fragments.generated30d}
            value={fmtNum(data.fragments.generated30d)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.fragments.spent30d}
            value={fmtNum(data.fragments.spent30dAbs)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Bloc 3 — Giveaways */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <GiftIcon className="w-4 h-4 text-purple-400" />
          {ge.giveaways.title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label={ge.giveaways.active}
            value={fmtNum(data.giveaways.countByStatus['ACTIVE'] ?? 0)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label={ge.giveaways.ended}
            value={fmtNum(data.giveaways.endedCount)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.giveaways.totalEntries}
            value={fmtNum(data.giveaways.totalEntries)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.giveaways.uniqueParticipants}
            value={fmtNum(data.giveaways.approxUniqueParticipants)}
            sub={ge.giveaways.uniqueParticipantsSub}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.giveaways.avgEntries}
            value={(data.giveaways.avgEntriesPerEndedGiveaway ?? 0).toFixed(1)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.giveaways.costEnded}
            value={fmtEur(data.giveaways.totalEndedRewardCostCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-theme-highlight"
          />
          <KpiCard
            label={ge.giveaways.cost7d}
            value={fmtEur(data.giveaways.costLast7dCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label={ge.giveaways.cost30d}
            value={fmtEur(data.giveaways.costLast30dCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
        </div>

        {/* Par type */}
        {data.giveaways.costByDurationType.length > 0 && (
          <Card className="mt-4 bg-slate-900/80 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">{ge.giveaways.costByType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.giveaways.costByDurationType.map((row) => (
                  <div key={row.durationType} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{row.durationType.toLowerCase()}</p>
                      <p className="text-slate-500 text-xs">
                        {ge.giveaways.giveawayCount.replace('{count}', String(row._count))}
                      </p>
                    </div>
                    <p className="text-theme-highlight font-bold">{fmtEur((row._sum.rewardValueCents ?? 0) / 100)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grille de décision */}
      <Card className="bg-slate-900/80 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-theme-stat" />
            {ge.decisionGrid.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            {decisionRows.map((row) => (
              <div key={row.range} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${row.color}`}>
                <span className="font-bold w-20">{row.range}</span>
                <span className="font-medium w-28">{row.label}</span>
                <span className="text-slate-400">{row.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
