'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  GiftIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';

type MissionRow = {
  key: string;
  category: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';
  rewardFragments: number;
  periodKey: string;
  completed: boolean;
  eligible: boolean;
  progressCurrent?: number;
  progressTarget?: number;
  thresholdCents?: number;
};

const MISSION_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  DAILY_CLAIM: {
    label: 'Claim quotidien',
    description: 'Viens sur le site et récupère tes fragments du jour.',
    icon: <SparklesIcon className="w-5 h-5 text-amber-500" />,
  },
  DAILY_SELL_SKIN: {
    label: 'Vendre un skin',
    description: 'Réalise au moins 1 vente validée aujourd\'hui.',
    icon: <ChartBarIcon className="w-5 h-5 text-green-500" />,
  },
  DAILY_VISIT: {
    label: 'Visite quotidienne',
    description: 'Ouvre ton dashboard pour valider ta présence du jour.',
    icon: <ClockIcon className="w-5 h-5 text-blue-500" />,
  },
  WEEKLY_SELL_500: {
    label: 'Vendre 500 €',
    description: 'Atteins 500 € de volume vendu cette semaine.',
    icon: <ChartBarIcon className="w-5 h-5 text-emerald-500" />,
  },
  WEEKLY_SELL_1000: {
    label: 'Vendre 1 000 €',
    description: 'Atteins 1 000 € de volume vendu cette semaine.',
    icon: <ChartBarIcon className="w-5 h-5 text-emerald-600" />,
  },
  WEEKLY_GIVEAWAY_3: {
    label: 'Participer à 3 giveaways',
    description: 'Rejoins au moins 3 giveaways différents cette semaine.',
    icon: <GiftIcon className="w-5 h-5 text-purple-500" />,
  },
  MONTHLY_SELL_5000: {
    label: 'Vendre 5 000 €',
    description: 'Atteins 5 000 € de volume vendu ce mois-ci.',
    icon: <ChartBarIcon className="w-5 h-5 text-orange-500" />,
  },
  MONTHLY_SELL_10000: {
    label: 'Vendre 10 000 €',
    description: 'Atteins 10 000 € de volume vendu ce mois-ci.',
    icon: <ChartBarIcon className="w-5 h-5 text-red-500" />,
  },
  SOCIAL_NEWSLETTER: {
    label: 'Newsletter',
    description: 'Inscris-toi à notre newsletter pour rester informé.',
    icon: <GlobeAltIcon className="w-5 h-5 text-sky-500" />,
  },
  SOCIAL_TWITTER: {
    label: 'Suivre sur X (Twitter)',
    description: 'Suis notre compte Twitter officiel.',
    icon: <GlobeAltIcon className="w-5 h-5 text-sky-400" />,
  },
  SOCIAL_INSTAGRAM: {
    label: 'Suivre sur Instagram',
    description: 'Suis notre compte Instagram.',
    icon: <GlobeAltIcon className="w-5 h-5 text-pink-500" />,
  },
  SOCIAL_DISCORD: {
    label: 'Rejoindre Discord',
    description: 'Rejoins notre serveur Discord communautaire.',
    icon: <GlobeAltIcon className="w-5 h-5 text-indigo-500" />,
  },
  BONUS_DAILY_SURPRISE: {
    label: 'Mission du jour',
    description: 'Récompense surprise du jour — montant aléatoire entre 20 et 50 fragments.',
    icon: <StarIcon className="w-5 h-5 text-yellow-400" />,
  },
};

const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  DAILY: {
    label: 'Missions quotidiennes',
    description: 'Se réinitialisent chaque jour à minuit UTC.',
    icon: <ClockIcon className="w-5 h-5" />,
    color: 'text-amber-500',
  },
  WEEKLY: {
    label: 'Missions hebdomadaires',
    description: 'Se réinitialisent chaque lundi.',
    icon: <CalendarDaysIcon className="w-5 h-5" />,
    color: 'text-emerald-500',
  },
  MONTHLY: {
    label: 'Missions mensuelles',
    description: 'Se réinitialisent le 1er du mois.',
    icon: <ChartBarIcon className="w-5 h-5" />,
    color: 'text-orange-500',
  },
  SOCIAL: {
    label: 'Missions sociales',
    description: 'À compléter une seule fois.',
    icon: <GlobeAltIcon className="w-5 h-5" />,
    color: 'text-purple-500',
  },
  BONUS: {
    label: 'Mission surprise',
    description: 'Récompense aléatoire du jour. Reviens chaque jour pour une nouvelle surprise !',
    icon: <StarIcon className="w-5 h-5" />,
    color: 'text-yellow-400',
  },
};

function MissionCard({
  mission,
  onClaim,
  isPending,
}: {
  mission: MissionRow;
  onClaim: (key: string) => void;
  isPending: boolean;
}) {
  const meta = MISSION_META[mission.key];

  return (
    <div
      className={`md:flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
        mission.completed
          ? 'bg-muted/40 opacity-70'
          : mission.category === 'BONUS'
            ? 'bg-gradient-to-r from-yellow-50/60 to-amber-50/60 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-300 dark:border-yellow-700 shadow-sm'
            : mission.eligible
              ? 'bg-gradient-to-r from-orange-50/60 to-amber-50/60 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800 shadow-sm'
              : 'hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            mission.completed
              ? 'bg-green-100 dark:bg-green-900/30'
              : mission.category === 'BONUS'
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : mission.eligible
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-muted'
          }`}
        >
          {mission.completed ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : !mission.eligible ? (
            <LockClosedIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            meta?.icon ?? <SparklesIcon className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{meta?.label ?? mission.key.replace(/_/g, ' ')}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {meta?.description ?? ''}
          </p>
          {!mission.completed && mission.progressTarget != null && mission.progressCurrent != null && (
            <div className="mt-2 space-y-1">
              <Progress
                value={Math.min(100, (mission.progressCurrent / mission.progressTarget) * 100)}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground">
                {mission.thresholdCents != null
                  ? `${(mission.progressCurrent / 100).toFixed(0)} € / ${(mission.progressTarget / 100).toFixed(0)} €`
                  : `${mission.progressCurrent} / ${mission.progressTarget}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
          <SparklesIcon className="w-4 h-4" />
          +{mission.rewardFragments}
        </div>
        {mission.completed ? (
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
            Réclamée
          </Badge>
        ) : mission.eligible ? (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => onClaim(mission.key)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            Réclamer
          </Button>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <LockClosedIcon className="w-3.5 h-3.5 mr-1" />
            Non disponible
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [animatingFragments, setAnimatingFragments] = useState(false);
  const [fragmentsEarned, setFragmentsEarned] = useState(0);
  const [displayFragments, setDisplayFragments] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const r = await fetch('/api/missions', { credentials: 'include' });
      if (!r.ok) throw new Error('Erreur chargement missions');
      return r.json() as Promise<{ missions: MissionRow[] }>;
    },
    enabled: !!user,
  });

  const claim = useMutation({
    mutationFn: async (missionKey: string) => {
      const r = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionKey }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      return j;
    },
    onSuccess: async (j: { fragments?: number }) => {
      const earned = j.fragments ?? 0;
      setFragmentsEarned(earned);
      setAnimatingFragments(true);
      
      // Animation du compteur rapide
      const duration = 1500; // 1.5 secondes
      const steps = 30;
      const increment = earned / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= earned) {
          setDisplayFragments(earned);
          clearInterval(interval);
          setTimeout(() => setAnimatingFragments(false), 1000);
        } else {
          setDisplayFragments(Math.floor(current));
        }
      }, duration / steps);

      // Invalider les queries pour mettre à jour l'UI
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalanceHistory });
      
      await refreshUser();
      
      toast.success(`+${earned} fragments récupérés !`, {
        description: 'Tes fragments ont été ajoutés à ton compte',
        duration: 3000,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (authLoading) {
    return (
      <div className="container py-24 text-center text-muted-foreground">Chargement…</div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-24 text-center space-y-4">
        <SparklesIcon className="w-16 h-16 mx-auto text-amber-500" />
        <p className="font-semibold text-lg">Connecte-toi pour voir les missions</p>
        <p className="text-muted-foreground">Gagne des fragments en accomplissant des missions quotidiennes.</p>
        <Link href="/giveaways">
          <Button variant="outline">Retour aux giveaways</Button>
        </Link>
      </div>
    );
  }

  const missions = data?.missions ?? [];
  const byCat = (c: string) => missions.filter((m) => m.category === c);

  const totalClaimable = missions.filter((m) => m.eligible && !m.completed)
    .reduce((s, m) => s + m.rewardFragments, 0);
  const totalCompleted = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Animation overlay pour les fragments */}
      <AnimatePresence>
        {animatingFragments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ 
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1],
                y: [100, -20, 0],
              }}
              exit={{ 
                scale: 0.5,
                opacity: 0,
                y: -100,
              }}
              transition={{
                duration: 1.5,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl border-4 border-amber-300"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
                  }}
                >
                  <SparklesIcon className="w-20 h-20" />
                </motion.div>
                <div className="text-center">
                  <motion.p 
                    className="text-6xl font-black tabular-nums"
                    key={displayFragments}
                  >
                    +{displayFragments}
                  </motion.p>
                  <p className="text-2xl font-semibold mt-2">Fragments 💠</p>
                  <p className="text-sm opacity-90 mt-1">Mission complétée !</p>
                </div>
              </div>
            </motion.div>
            
            {/* Particules de confettis */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                }}
                animate={{
                  opacity: [1, 0],
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  scale: [1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.3,
                  ease: "easeOut",
                }}
                className={`absolute w-3 h-3 rounded-full ${
                  i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-orange-400' : 'bg-yellow-300'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-amber-500" />
            Missions
          </h1>
          <p className="text-muted-foreground mt-1">
            Source secondaire de fragments — les ventes restent la priorité.
          </p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline">Giveaways</Button>
        </Link>
      </div>

      {/* Résumé */}
      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Fragments disponibles</p>
            <motion.p 
              key={user.fragments ?? 0}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold text-amber-600"
            >
              {user.fragments ?? 0} 💠
            </motion.p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">À réclamer</p>
            <p className="text-2xl font-bold text-orange-500">+{totalClaimable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Complétées</p>
            <p className="text-2xl font-bold text-green-500">
              {totalCompleted}/{totalMissions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression globale */}
      {totalMissions > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-medium">{Math.round((totalCompleted / totalMissions) * 100)}%</span>
          </div>
          <Progress value={(totalCompleted / totalMissions) * 100} className="h-2" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(['BONUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL'] as const).map((cat) => {
            const catMissions = byCat(cat);
            const catMeta = CATEGORY_META[cat];
            const catCompleted = catMissions.filter((m) => m.completed).length;
            const catClaimable = catMissions.filter((m) => m.eligible && !m.completed)
              .reduce((s, m) => s + m.rewardFragments, 0);

            return (
              <Card key={cat}>
                <CardHeader className="pb-3">
                  <CardTitle className={`flex items-center justify-between text-base ${catMeta.color}`}>
                    <div className="flex items-center gap-2">
                      {catMeta.icon}
                      {catMeta.label}
                    </div>
                    <div className="flex items-center gap-2">
                      {catClaimable > 0 && (
                        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                          +{catClaimable} 💠 disponibles
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-normal">
                        {catCompleted}/{catMissions.length}
                      </span>
                    </div>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{catMeta.description}</p>
                  {catMissions.length > 0 && (
                    <Progress
                      value={(catCompleted / catMissions.length) * 100}
                      className="h-1 mt-2"
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {catMissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">Aucune mission.</p>
                  ) : (
                    catMissions.map((m) => (
                      <MissionCard
                        key={`${m.key}-${m.periodKey}`}
                        mission={m}
                        onClaim={(key) => claim.mutate(key)}
                        isPending={claim.isPending}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {claim.isError && (
        <p className="text-sm text-destructive">
          {(claim.error as Error)?.message}
        </p>
      )}
    </div>
  );
}
