'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminGamificationEconomyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'gamification-economy'],
    queryFn: async () => {
      const r = await fetch('/api/admin/gamification-economy', { credentials: 'include' });
      if (!r.ok) throw new Error('Accès refusé ou erreur');
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12 text-slate-300">Chargement du pilotage économie…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-12 text-red-400">
        Impossible de charger les métriques (droits admin requis).
      </div>
    );
  }

  const fmtEur = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Économie fragments & giveaways</h1>
        <p className="text-slate-400 text-sm">
          Marge brute estimée : {((data.marginRateAssumption as number) * 100).toFixed(0)} % du volume vendu
          (paramètre `marginRate` sur l’API si besoin).
        </p>
      </div>

      {Array.isArray(data.alerts) && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a: string, i: number) => (
            <Alert key={i} variant="destructive" className="border-amber-600/50 bg-amber-950/30">
              <AlertTitle>Alerte</AlertTitle>
              <AlertDescription>{a}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Vue d’ensemble (7j / 30j)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>
              Volume vendu 7j : {fmtEur((data.finance.volumeSoldCents7d as number) / 100)}
            </p>
            <p>
              Volume vendu 30j : {fmtEur((data.finance.volumeSoldCents30d as number) / 100)}
            </p>
            <p>
              Marge brute estimée 7j : {fmtEur(data.finance.estimatedGrossBenefitEur7d as number)}
            </p>
            <p>
              Marge brute estimée 30j : {fmtEur(data.finance.estimatedGrossBenefitEur30d as number)}
            </p>
            <p>
              Coût giveaways 7j : {fmtEur(data.finance.giveawayCostEur7d as number)}
            </p>
            <p>
              Coût giveaways 30j : {fmtEur(data.finance.giveawayCostEur30j as number)}
            </p>
            <p>
              Ratio coût giveaways / marge 30j :{' '}
              {data.finance.ratioGiveawayCostToBenefit30d != null
                ? `${((data.finance.ratioGiveawayCostToBenefit30j as number) * 100).toFixed(2)} %`
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Fragments</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>Générés (total types GENERATED*) : {data.fragments.generatedTotal as number}</p>
            <p>Brûlés giveaways (total) : {data.fragments.spentTotalGiveaways as number}</p>
            <p>Circulation théorique : {data.fragments.circulationTheoretical as number}</p>
            <p>Solde utilisateurs (inutilisés) : {data.fragments.unusedOnBalances as number}</p>
            <p>Générés 30j : {data.fragments.generated30d as number}</p>
            <p>Dépensés 30j : {data.fragments.spent30dAbs as number}</p>
            <p>
              Taux utilisation 30j :{' '}
              {((data.fragments.utilizationRate30d as number) * 100).toFixed(1)} %
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-base">Giveaways</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>Entrées totales (lignes) : {data.giveaways.totalEntries as number}</p>
            <p>Participants uniques (approx.) : {data.giveaways.approxUniqueParticipants as number}</p>
            <p>Giveaways terminés : {data.giveaways.endedCount as number}</p>
            <p>Coût lots terminés (centimes) : {data.giveaways.totalEndedRewardCostCents as number}</p>
            <div className="pt-2">
              <p className="font-medium text-white mb-1">Par type de durée</p>
              <ul className="list-disc pl-5 space-y-1">
                {(data.giveaways.costByDurationType as { durationType: string; _sum: { rewardValueCents: number | null }; _count: number }[])?.map(
                  (row) => (
                    <li key={row.durationType}>
                      {row.durationType}: {row._count} giveaway(s), somme rewardValueCents{' '}
                      {row._sum.rewardValueCents ?? 0} cts (indicatif)
                    </li>
                  )
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
