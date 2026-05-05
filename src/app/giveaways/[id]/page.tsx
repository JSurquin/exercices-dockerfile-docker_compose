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
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import Image from 'next/image';

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

function getTimeRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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
  const timeLeft = getTimeRemaining(giveaway.endDate);
  const isActive = giveaway.status === 'ACTIVE' && timeLeft !== null;

  const poolLeft = giveaway.maxTickets - giveaway.soldTickets;
  const maxPerUser = giveaway.maxEntriesPerUser != null
    ? Math.max(0, giveaway.maxEntriesPerUser - myEntries)
    : poolLeft;
  const maxAffordable = giveaway.ticketPrice > 0 ? Math.floor(fragments / giveaway.ticketPrice) : 0;
  const maxSelectable = Math.max(0, Math.min(poolLeft, maxPerUser, maxAffordable));
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
        <div className="flex items-center justify-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold">{giveaway.title}</h1>
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
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-6 border">
                  <div className="flex items-center gap-4">
                    <SafeImage
                      src={giveaway.prizeImageUrl}
                      alt={giveaway.prize}
                      width={140}
                      height={100}
                      className="object-contain rounded drop-shadow-lg shrink-0"
                      fallbackClassName="w-[140px] h-[100px] rounded shrink-0"
                      fallbackIcon={<TrophyIcon className="w-16 h-16 text-orange-600" />}
                      unoptimized
                    />
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
                        {messages.giveawaysPage.detail.prizeTitle}
                      </p>
                      <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200">{giveaway.prize}</h2>
                    </div>
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <SparklesIcon className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <p className="text-xs text-muted-foreground">{messages.giveawaysPage.detail.ticketPrice}</p>
                    <p className="font-bold">{giveaway.ticketPrice} 💠</p>
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
                    <span>{new Date(giveaway.endDate).toLocaleDateString(locale === 'cn' ? 'zh-CN' : locale)}</span>
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
              <Card className={isActive ? 'border-orange-500/30' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChartBarIcon className="w-5 h-5 text-orange-500" />
                    {messages.giveawaysPage.detail.yourParticipation}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myEntries}</p>
                      <p className="text-xl font-bold text-amber-600">{myEntries}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myChance}</p>
                      <p className="text-xl font-bold text-orange-600">{myChance.toFixed(2)}%</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">{messages.giveawaysPage.detail.myFragments}</p>
                      <p className="text-xl font-bold">{fragments} 💠</p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="space-y-3 pt-2 border-t">
                      {fragments < giveaway.ticketPrice ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{messages.giveawaysPage.detail.fragmentsAvailable}</span>
                            <span className="text-amber-500 font-medium">
                              {messages.giveawaysPage.detail.fragmentsMissing.replace('{count}', String(giveaway.ticketPrice - fragments))}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, (fragments / giveaway.ticketPrice) * 100)}
                            className="h-1.5 bg-muted [&>div]:bg-amber-500"
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            {messages.giveawaysPage.detail.sellSkinsHint}
                          </p>
                          <Link href="/missions">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
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
                                entriesToBuy > poolLeft ||
                                entriesToBuy > maxPerUser
                              }
                              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shrink-0"
                            >
                              {participateMutation.isPending ? messages.giveawaysPage.detail.participating : messages.giveawaysPage.detail.participateWithCost.replace('{cost}', String(totalCost))}
                            </Button>
                          </div>

                          {/* Aperçu de la chance après participation */}
                          {entriesToBuy > 0 && (
                            <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-sm flex items-center justify-between">
                              <span className="text-muted-foreground">{messages.giveawaysPage.detail.afterPurchase}</span>
                              <div className="flex gap-4 font-medium">
                                <span>{messages.giveawaysPage.detail.entriesCount.replace('{count}', String(previewMyEntries))}</span>
                                <span className="text-green-600">
                                  {messages.giveawaysPage.detail.chancePercent.replace('{percent}', previewChance.toFixed(2))}
                                </span>
                              </div>
                            </div>
                          )}

                          {giveaway.maxEntriesPerUser != null && (
                            <p className="text-xs text-muted-foreground">
                              {messages.giveawaysPage.detail.userEntryLimit.replace('{max}', String(giveaway.maxEntriesPerUser)).replace('{remaining}', String(maxPerUser))}
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
              <Card className="border-orange-500/30">
                <CardContent className="p-6 text-center">
                  <GiftIcon className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                  <p className="font-medium mb-1">{messages.giveawaysPage.detail.loginToParticipate}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {messages.giveawaysPage.detail.costPerEntry.replace('{price}', String(giveaway.ticketPrice))}
                  </p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
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
                    🎉 {messages.giveawaysPage.detail.winnerTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {giveaway.winners.map((w) => {
                    const u = w.user;
                    return (
                      <div
                        key={`w-${w.rank}`}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 rounded-full text-white text-sm font-bold shrink-0">
                          #{w.rank}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={u?.steamAvatar ?? undefined} />
                          <AvatarFallback className="bg-yellow-500 text-white">
                            {(u?.steamUsername ?? 'W').slice(0, 2).toUpperCase()}
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
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800'
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
                          {messages.giveawaysPage.detail.entriesAndChance.replace('{entries}', String(myEntries)).replace('{chance}', myChance.toFixed(1))}
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
