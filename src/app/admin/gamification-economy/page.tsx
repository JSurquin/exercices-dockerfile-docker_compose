'use client';

import { useQuery } from '@tanstack/react-query';
import { ADMIN_GAMIFICATION_REFETCH_INTERVAL_MS } from '@/lib/admin-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

function RatioGauge({ ratio, label }: { ratio: number; label: string }) {
  const pct = Math.min(100, ratio * 100);
  const color =
    ratio > 0.15 ? 'bg-red-500' :
    ratio > 0.12 ? 'bg-orange-500' :
    ratio > 0.08 ? 'bg-yellow-500' :
    ratio > 0.03 ? 'bg-green-500' :
    'bg-blue-500';

  const status =
    ratio > 0.15 ? { label: 'Dangereux', color: 'text-red-400' } :
    ratio > 0.12 ? { label: 'Coûteux', color: 'text-orange-400' } :
    ratio > 0.08 ? { label: 'À surveiller', color: 'text-yellow-400' } :
    ratio > 0.03 ? { label: 'Idéal', color: 'text-green-400' } :
    { label: 'Trop dur', color: 'text-blue-400' };

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
        <span>0%</span>
        <span className="text-green-600">3–8% idéal</span>
        <span className="text-red-600">+12% danger</span>
        <span>20%+</span>
      </div>
    </div>
  );
}

function UtilRateGauge({ rate }: { rate: number }) {
  const pct = rate * 100;
  const color =
    pct < 25 ? 'bg-blue-500' :
    pct < 60 ? 'bg-green-500' :
    pct < 85 ? 'bg-yellow-500' :
    'bg-red-500';

  const status =
    pct < 25 ? 'Fragments sous-utilisés' :
    pct < 60 ? 'Zone saine' :
    pct < 85 ? 'Très bonne consommation' :
    'Sur-consommation';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Taux d&apos;utilisation 30j</span>
        <span className="font-bold text-white">{pct.toFixed(1)}%</span>
      </div>
      <Progress value={pct} className={`h-3 bg-slate-700 [&>div]:${color}`} />
      <p className="text-xs text-slate-500">{status}</p>
    </div>
  );
}

function Recommendation({ ratio30, utilRate }: { ratio30: number | null; utilRate: number }) {
  if (ratio30 === null) return null;

  if (ratio30 > 0.12) {
    return (
      <div className="rounded-lg border border-orange-700/50 bg-orange-950/30 p-4 space-y-1">
        <p className="text-orange-400 font-semibold text-sm flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Recommandation : augmenter les prix
        </p>
        <p className="text-slate-400 text-xs">
          Ratio {(ratio30 * 100).toFixed(1)}% → dépasse le seuil de 12%. Augmenter le prix d&apos;entrée de +15% sur les prochains giveaways.
        </p>
      </div>
    );
  }

  if (ratio30 < 0.03 && utilRate < 0.25) {
    return (
      <div className="rounded-lg border border-blue-700/50 bg-blue-950/30 p-4 space-y-1">
        <p className="text-blue-400 font-semibold text-sm flex items-center gap-2">
          <ArrowTrendingDownIcon className="w-4 h-4" />
          Recommandation : baisser les prix
        </p>
        <p className="text-slate-400 text-xs">
          Ratio faible ({(ratio30 * 100).toFixed(1)}%) + utilisation faible ({(utilRate * 100).toFixed(1)}%). Baisser le prix d&apos;entrée de −15% ou augmenter le nombre de gagnants.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-700/50 bg-green-950/30 p-4 space-y-1">
      <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
        <CheckCircleIcon className="w-4 h-4" />
        Économie équilibrée
      </p>
      <p className="text-slate-400 text-xs">
        Ratio {(ratio30 * 100).toFixed(1)}% dans la zone cible (3–8%). Aucun ajustement urgent.
      </p>
    </div>
  );
}

export default function AdminGamificationEconomyPage() {
  const { data, isLoading, error } = useQuery<EconomyData>({
    queryKey: ['admin', 'gamification-economy'],
    queryFn: async () => {
      const r = await fetch('/api/admin/gamification-economy', { credentials: 'include' });
      if (!r.ok) throw new Error('Accès refusé ou erreur');
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
        Impossible de charger les métriques (droits admin requis).
      </div>
    );
  }

  const ratio30 = data.finance.ratioGiveawayCostToBenefit30d;
  const utilRate = data.fragments.utilizationRate30d;

  return (
    <div className="space-y-8">
      {/* Titre */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
          <ChartBarIcon className="w-7 h-7 text-orange-500" />
          Économie fragments & giveaways
        </h1>
        <p className="text-slate-400 text-sm">
          Marge brute estimée : {((data.marginRateAssumption ?? 0) * 100).toFixed(0)}% du volume vendu.
          Rafraîchissement auto toutes les 60 s.
        </p>
      </div>

      {/* Alertes */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4"
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommandation */}
      <Recommendation ratio30={ratio30} utilRate={utilRate} />

      {/* Bloc 1 — Finance */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <ChartBarIcon className="w-4 h-4 text-orange-500" />
          Vue d&apos;ensemble financière
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Volume vendu 7j"
            value={fmtEur(data.finance.volumeSoldCents7d / 100)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Volume vendu 30j"
            value={fmtEur(data.finance.volumeSoldCents30d / 100)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Marge brute 7j"
            value={fmtEur(data.finance.estimatedGrossBenefitEur7d)}
            icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label="Marge brute 30j"
            value={fmtEur(data.finance.estimatedGrossBenefitEur30d)}
            icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label="Coût giveaways 7j"
            value={fmtEur(data.finance.giveawayCostEur7d)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-orange-400"
          />
          <KpiCard
            label="Coût giveaways 30j"
            value={fmtEur(data.finance.giveawayCostEur30d)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-orange-400"
          />
          <KpiCard
            label="Ratio giveaways/marge 7j"
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
            label="Ratio giveaways/marge 30j"
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
            <ChartBarIcon className="w-4 h-4 text-orange-500" />
            KPI principaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {ratio30 != null && <RatioGauge ratio={ratio30} label="Ratio coût giveaways / marge brute (30j)" />}
          <UtilRateGauge rate={utilRate} />
        </CardContent>
      </Card>

      {/* Bloc 2 — Fragments */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <SparklesIcon className="w-4 h-4 text-amber-500" />
          Fragments
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Générés (total)"
            value={fmtNum(data.fragments.generatedTotal)}
            icon={<SparklesIcon className="w-4 h-4" />}
            color="text-amber-400"
          />
          <KpiCard
            label="Brûlés (total)"
            value={fmtNum(data.fragments.spentTotalGiveaways)}
            icon={<SparklesIcon className="w-4 h-4" />}
            color="text-orange-400"
          />
          <KpiCard
            label="En circulation"
            value={fmtNum(data.fragments.circulationTheoretical)}
            sub="généré − brûlé"
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Inutilisés (soldes)"
            value={fmtNum(data.fragments.unusedOnBalances)}
            sub="somme des soldes"
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Générés 24h"
            value={fmtNum(data.fragments.generated24h)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Générés 7j"
            value={fmtNum(data.fragments.generated7d)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Générés 30j"
            value={fmtNum(data.fragments.generated30d)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Dépensés 30j"
            value={fmtNum(data.fragments.spent30dAbs)}
            icon={<SparklesIcon className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Bloc 3 — Giveaways */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <GiftIcon className="w-4 h-4 text-purple-400" />
          Giveaways
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Actifs"
            value={fmtNum(data.giveaways.countByStatus['ACTIVE'] ?? 0)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-green-400"
          />
          <KpiCard
            label="Terminés"
            value={fmtNum(data.giveaways.endedCount)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Entrées totales"
            value={fmtNum(data.giveaways.totalEntries)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Participants uniques"
            value={fmtNum(data.giveaways.approxUniqueParticipants)}
            sub="approx."
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Moy. entrées / giveaway"
            value={(data.giveaways.avgEntriesPerEndedGiveaway ?? 0).toFixed(1)}
            icon={<ChartBarIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Coût lots terminés"
            value={fmtEur(data.giveaways.totalEndedRewardCostCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
            color="text-orange-400"
          />
          <KpiCard
            label="Coût giveaways 7j"
            value={fmtEur(data.giveaways.costLast7dCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
          <KpiCard
            label="Coût giveaways 30j"
            value={fmtEur(data.giveaways.costLast30dCents / 100)}
            icon={<GiftIcon className="w-4 h-4" />}
          />
        </div>

        {/* Par type */}
        {data.giveaways.costByDurationType.length > 0 && (
          <Card className="mt-4 bg-slate-900/80 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Coût par type de durée (terminés)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.giveaways.costByDurationType.map((row) => (
                  <div key={row.durationType} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium capitalize">{row.durationType.toLowerCase()}</p>
                      <p className="text-slate-500 text-xs">{row._count} giveaway(s)</p>
                    </div>
                    <p className="text-orange-400 font-bold">{fmtEur((row._sum.rewardValueCents ?? 0) / 100)}</p>
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
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
            Grille de décision — ratio giveaways / marge brute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            {[
              { range: '< 3%', label: 'Trop dur', desc: '→ baisser prix entrées ou augmenter nb gagnants', color: 'border-blue-700 bg-blue-950/30 text-blue-300' },
              { range: '3% – 8%', label: 'Idéal ✓', desc: '→ ne rien changer', color: 'border-green-700 bg-green-950/30 text-green-300' },
              { range: '8% – 12%', label: 'À surveiller', desc: '→ petits ajustements éventuels', color: 'border-yellow-700 bg-yellow-950/30 text-yellow-300' },
              { range: '> 12%', label: 'Trop généreux', desc: '→ augmenter prix entrées de +15%', color: 'border-orange-700 bg-orange-950/30 text-orange-300' },
              { range: '> 15%', label: 'Dangereux !', desc: '→ correction obligatoire', color: 'border-red-700 bg-red-950/30 text-red-300' },
            ].map((row) => (
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
