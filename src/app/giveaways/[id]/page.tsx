'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale } from '@/components/providers/locale-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';
import { toast } from 'sonner';
import {
  GiftIcon,
  TicketIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { SafeImage } from '@/components/ui/safe-image';
import Image from 'next/image';
import {
  formatChanceNumber,
  formatChancePercent,
  formatCompactCountdown,
  formatGiveawayDate,
  getDisplayInitials,
  getGiveawayEntryLimits,
  getTimeRemaining,
  hasConfiguredUserEntryLimit,
} from '@/lib/giveaway-presentation';

interface GiveawayDetails {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeImageUrl?: string | null;
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  endDate: string;
  status: string;
  winnerId?: string | null;
  randomSeed?: string | null;
  winnerCount: number;
  maxEntriesPerUser?: number | null;
  isPrivate: boolean;
  requiredAffiliateCode?: string | null;
  canParticipate?: boolean;
  totalParticipants: number;
  totalEntries: number;
  myEntries: number;
  myChancePercent: number;
  entries?: never[];
  winners: {
    rank: number;
    user?: { steamUsername: string | null; steamAvatar: string | null } | null;
  }[];
}

export default function GiveawayDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { messages, locale } = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const giveawayId = params.id as string;

  const [entriesToBuy, setEntriesToBuy] = useState(1);
  const [userFragments, setUserFragments] = useState<number | null>(null);

  const { data: giveaway, isLoading, error } = useQuery<GiveawayDetails>({
    queryKey: ['giveaway', giveawayId],
    queryFn: async () => {
      const r = await fetch(`/api/giveaways/${giveawayId}`, { credentials: 'include' });
      if (!r.ok) throw new Error(messages.giveawaysPage.giveawayNotFound);
      return r.json();
    },
    refetchInterval: (query) => {
      const d = query.state.data as GiveawayDetails | undefined;
      return d?.status === 'ACTIVE' ? 15000 : false;
    },
  });

  const fragments = userFragments ?? (user?.fragments ?? 0);

  const participateMutation = useMutation({
    mutationFn: async (entries: number) => {
      const r = await fetch(`/api/giveaways/${giveawayId}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entriesToBuy: entries }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || messages.giveawaysPage.detail.errorGeneric);
      return json as { newFragmentBalance: number; entriesAdded: number; fragmentsSpent: number };
    },
    onSuccess: (data) => {
      setUserFragments(data.newFragmentBalance);
      queryClient.invalidateQueries({ queryKey: ['giveaway', giveawayId] });
      queryClient.invalidateQueries({ queryKey: ['giveaways'] });
      toast.success(messages.giveawaysPage.detail.entriesAddedToast.replace('{count}', String(data.entriesAdded)).replace('{spent}', String(data.fragmentsSpent)));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : messages.giveawaysPage.detail.errorGeneric),
  });

  if (!user) {
    return (
      <LoginRequiredBlock
        icon={<GiftIcon className="w-16 h-16" />}
        title={messages.giveawaysPage.detail.loginToParticipate}
        description={messages.giveaways.empty.loginRequiredDescription}
        buttonLabel={messages.giveawaysPage.detail.loginViaSteam}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{messages.giveawaysPage.giveawayNotFound}</h3>
            <p className="text-muted-foreground mb-6">{messages.giveawaysPage.giveawayNotFoundDesc}</p>
            <Button onClick={() => router.push('/giveaways')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              {messages.giveawaysPage.detail.backToGiveaways}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEntries = giveaway.totalEntries;
  const totalParticipants = giveaway.totalParticipants;
  const myEntries = giveaway.myEntries;
  const myChance = giveaway.myChancePercent;
  const progress = (giveaway.soldTickets / giveaway.maxTickets) * 100;
  const remaining = getTimeRemaining(giveaway.endDate);
  const layout = messages.giveaways.layout;
  const timeLeft = remaining.expired
    ? null
    : formatCompactCountdown(
        remaining,
        {
          days: layout.compactDays,
          hours: layout.compactHours,
          minutes: layout.compactMinutes,
          seconds: layout.compactSeconds,
        },
        messages.giveawaysPage.detail.finished
      );
  const isActive = giveaway.status === 'ACTIVE' && !remaining.expired;
  const isParticipationLocked =
    giveaway.isPrivate &&
    !!giveaway.requiredAffiliateCode &&
    giveaway.canParticipate === false;

  const limits = getGiveawayEntryLimits(giveaway, fragments);
  const maxSelectable = limits.maxSelectable;
  const remainingUserEntries = hasConfiguredUserEntryLimit(giveaway.maxEntriesPerUser)
    ? Math.max(0, (giveaway.maxEntriesPerUser ?? 0) - myEntries)
    : null;
  const totalCost = entriesToBuy * giveaway.ticketPrice;

  const previewMyEntries = myEntries + entriesToBuy;
  const previewChance = totalEntries + entriesToBuy > 0
    ? (100 * previewMyEntries) / (totalEntries + entriesToBuy)
    : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/giveaways">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {messages.giveawaysPage.detail.backToGiveaways}
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold">{giveaway.title}</h1>
          <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
          <Badge
            className={
              giveaway.status === 'ACTIVE'
                ? 'bg-green-500 text-white'
                : giveaway.status === 'ENDED'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
            }
          >
            {giveaway.status === 'ACTIVE'
              ? messages.giveawaysPage.detail.status.active
              : giveaway.status === 'ENDED'
                ? messages.giveawaysPage.detail.status.ended
                : messages.giveawaysPage.detail.status.cancelled}
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{giveaway.description}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lot */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-theme-accent/5 to-theme-accent/10 dark:from-theme-accent/10 dark:to-theme-accent/15 rounded-lg p-6 border">
                  <div className="flex items-center gap-4">
                    <SafeImage
                      src={giveaway.prizeImageUrl}
                      alt={giveaway.prize}
                      width={140}
                      height={100}
                      className="object-contain rounded drop-shadow-lg shrink-0"
                      fallbackClassName="w-[140px] h-[100px] rounded shrink-0"
                      fallbackIcon={<TrophyIcon className="w-16 h-16 text-theme-accent" />}
                      unoptimized
                    />
                    <div>
                      <p className="text-sm font-medium text-theme-highlight uppercase tracking-wider mb-1">
                        {messages.giveawaysPage.detail.prizeTitle}
                      </p>
                      <h2 className="text-2xl font-bold text-theme-accent dark:text-theme-highlight">{giveaway.prize}</h2>
                    </div>
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <FragmentBadge size="sm" className="mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">{messages.giveawaysPage.detail.ticketPrice}</p>
                    <FragmentAmount amount={giveaway.ticketPrice} size="xs" className="font-bold justify-center" />
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <UserGroupIcon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">{messages.giveawaysPage.detail.participants}</p>
                    <p className="font-bold">{totalParticipants}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <TicketIcon className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">{messages.giveawaysPage.detail.totalEntries}</p>
                    <p className="font-bold">{totalEntries}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <TrophyIcon className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">{messages.giveawaysPage.detail.winnersLabel}</p>
                    <p className="font-bold">{giveaway.winnerCount}</p>
                  </div>
                </div>

                {/* Timer & date */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClockIcon className="w-4 h-4 shrink-0" />
                    <span>{timeLeft ?? messages.giveawaysPage.detail.finished}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    <span>{formatGiveawayDate(giveaway.endDate, locale)}</span>
                  </div>
                </div>

                {/* Progression */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{messages.giveawaysPage.detail.ticketsSold}</span>
                    <span className="font-medium">{giveaway.soldTickets} / {giveaway.maxTickets} ({progress.toFixed(1)}%)</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mes stats + Participer */}
          {user && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className={isActive ? 'border-theme-accent/30' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChartBarIcon className="w-5 h-5 text-theme-accent" />
                    {messages.giveawaysPage.detail.yourParticipation}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-theme-highlight/5 dark:bg-theme-highlight/10 rounded-lg border border-theme-highlight/25 dark:border-theme-highlight/35">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myEntries}</p>
                      <p className="text-xl font-bold text-theme-stat">{myEntries}</p>
                    </div>
                    <div className="text-center p-3 bg-theme-accent/5 dark:bg-theme-accent/10/20 rounded-lg border border-theme-accent/20 dark:border-theme-accent/30">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myChance}</p>
                      <p className="text-xl font-bold text-theme-accent">{formatChancePercent(myChance, locale)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myFragments}</p>
                      <FragmentAmount amount={fragments} size="sm" className="text-xl font-bold justify-center" />
                    </div>
                  </div>

                  {isParticipationLocked && (
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200/90 space-y-1">
                      <div className="flex items-start gap-2">
                        <LockClosedIcon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                        <p>
                          {messages.giveaways.card.reservedForAffiliateCode.replace(
                            '{code}',
                            giveaway.requiredAffiliateCode ?? ''
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        {messages.giveaways.card.reservedForAffiliateCodeHint}
                      </p>
                    </div>
                  )}

                  {isActive && !isParticipationLocked && (
                    <div className="space-y-3 pt-2 border-t">
                      {fragments < giveaway.ticketPrice ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{messages.giveawaysPage.detail.fragmentsAvailable}</span>
                            <span className="text-theme-stat font-medium">
                              {messages.giveawaysPage.detail.fragmentsMissing.replace('{count}', String(giveaway.ticketPrice - fragments))}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, (fragments / giveaway.ticketPrice) * 100)}
                            className="h-1.5 bg-muted [&>div]:bg-theme-stat"
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            {messages.giveawaysPage.detail.sellSkinsHint}
                          </p>
                          <Link href="/missions">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                              <FragmentBadge size="xs" />
                              {messages.giveawaysPage.detail.viewMissions}
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="entries-count" className="text-sm font-medium">
                              {messages.giveawaysPage.detail.entriesToBuyLabel}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {messages.giveawaysPage.detail.maxEntriesAvailable.replace('{count}', String(maxSelectable))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              id="entries-count"
                              type="number"
                              min="1"
                              max={Math.max(1, maxSelectable)}
                              value={entriesToBuy}
                              onChange={(e) => {
                                const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setEntriesToBuy(Math.min(v, Math.max(1, maxSelectable)));
                              }}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => participateMutation.mutate(entriesToBuy)}
                              disabled={
                                participateMutation.isPending ||
                                maxSelectable < 1 ||
                                fragments < totalCost ||
                                entriesToBuy > maxSelectable
                              }
                              className="bg-cta-gradient hover:brightness-110 shrink-0 gap-2"
                            >
                              {participateMutation.isPending ? (
                                messages.giveawaysPage.detail.participating
                              ) : (
                                <>
                                  {messages.giveawaysPage.detail.participateWithCost}
                                  <FragmentAmount amount={totalCost} size="xs" className="text-white" />
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Aperçu de la chance après participation */}
                          {entriesToBuy > 0 && (
                            <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-sm flex items-center justify-between">
                              <span className="text-muted-foreground">{messages.giveawaysPage.detail.afterPurchase}</span>
                              <div className="flex gap-4 font-medium">
                                <span>{messages.giveawaysPage.detail.entriesCount.replace('{count}', String(previewMyEntries))}</span>
                                <span className="text-green-600">
                                  {messages.giveawaysPage.detail.chancePercent.replace('{percent}', formatChanceNumber(previewChance, locale))}
                                </span>
                              </div>
                            </div>
                          )}

                          {remainingUserEntries != null && (
                            <p className="text-xs text-muted-foreground">
                              {messages.giveawaysPage.detail.userEntryLimit.replace('{max}', String(giveaway.maxEntriesPerUser)).replace('{remaining}', String(remainingUserEntries))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!isActive && giveaway.status === 'ENDED' && (
                    <p className="text-sm text-muted-foreground text-center pt-1">
                      {messages.giveawaysPage.detail.giveawayEnded}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!user && isActive && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-theme-accent/30">
                <CardContent className="p-6 text-center">
                  <GiftIcon className="w-12 h-12 mx-auto mb-3 text-theme-accent" />
                  <p className="font-medium mb-1">{messages.giveawaysPage.detail.loginToParticipate}</p>
                  <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
                    <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
                    <span>{messages.giveawaysPage.detail.costPerEntry}</span>
                  </p>
                  <Link href="/">
                    <Button variant="cta">
                      {messages.giveawaysPage.detail.loginViaSteam}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Gagnants (si terminé) */}
          {giveaway.status === 'ENDED' && giveaway.winners && giveaway.winners.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    {messages.giveawaysPage.detail.winnerTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {giveaway.winners.map((w) => {
                    const u = w.user;
                    return (
                      <div
                        key={`w-${w.rank}`}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-theme-highlight/5 to-theme-accent/5 dark:from-theme-highlight/10 dark:to-theme-accent/10 rounded-lg border border-theme-highlight/25 dark:border-theme-highlight/35"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 rounded-full text-white text-sm font-bold shrink-0">
                          #{w.rank}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={u?.steamAvatar ?? undefined} />
                          <AvatarFallback className="bg-yellow-500 text-white">
                            {getDisplayInitials(
                              u?.steamUsername ?? messages.giveawaysPage.detail.winnerFallback
                            ) || 'MS'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            {u?.steamUsername ?? messages.giveawaysPage.detail.winnerFallback}
                          </p>
                        </div>
                        <CheckCircleIcon className="w-7 h-7 text-yellow-600 shrink-0" />
                      </div>
                    );
                  })}

                  {giveaway.randomSeed && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {messages.giveawaysPage.detail.drawSeed}:{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {giveaway.randomSeed.slice(0, 20)}…
                      </code>
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Statistiques */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{messages.giveawaysPage.detail.statistics}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{messages.giveawaysPage.detail.totalEntries}</span>
                  <span className="font-semibold">{totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{messages.giveawaysPage.participantCount}</span>
                  <span className="font-semibold">{totalParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{messages.giveawaysPage.avgTicketsPerParticipant}</span>
                  <span className="font-semibold">
                    {totalParticipants > 0 ? (totalEntries / totalParticipants).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{messages.giveawaysPage.fillRate}</span>
                  <span className="font-semibold">{progress.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Liste des participants */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {messages.giveawaysPage.detail.participantsCount} ({totalParticipants})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {!user && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      {messages.giveawaysPage.detail.participantCountPrivateHint}
                    </p>
                  )}
                  {user && myEntries === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      {messages.giveawaysPage.detail.yourEntryNone}
                    </p>
                  )}
                  {user && myEntries > 0 && (
                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        giveaway.winners?.some((w) => w.user?.steamUsername === user.username)
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-theme-highlight/25 dark:border-theme-highlight/35'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(user.username ?? 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {messages.giveawaysPage.detail.entriesAndChance.replace('{entries}', String(myEntries)).replace('{chance}', formatChanceNumber(myChance, locale))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
