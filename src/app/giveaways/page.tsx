'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { Messages } from '~/utils/types';
import { useGiveaways, GiveawayWithEntries } from '@/hooks/use-giveaways';
import { GiveawayNotifications } from '@/components/giveaway/giveaway-notifications';
import {
  GiftIcon,
  TicketIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  BellAlertIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

const getTimeRemaining = (endDate: Date) => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: false };
};

const formatTimeRemaining = (timeRemaining: ReturnType<typeof getTimeRemaining>, messages: Messages) => {
  if (timeRemaining.expired) return messages.giveaways.card.status.ended;
  
  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}j ${timeRemaining.hours}h`;
  } else if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }
};

const defaultFragmentLabels = {
  costPerEntry: 'fragments / entrée',
  totalEntries: 'entrées',
  participants: 'participants',
  yourEntries: 'Tes entrées',
  yourChance: 'Ta chance',
  winnerCount: 'gagnants',
  entriesToBuy: 'Nombre d’entrées',
  entriesAvailable: 'fragments disponibles',
};

const GiveawayCard = ({
  giveaway,
  onParticipate,
  messages,
  userFragments,
  locale,
}: {
  giveaway: GiveawayWithEntries;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void;
  messages: Messages;
  userFragments: number;
  locale: string;
}) => {
  const [entriesToBuy, setEntriesToBuy] = useState(1);
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate);
  const progress = (giveaway.soldTickets / giveaway.maxTickets) * 100;
  const fg = { ...defaultFragmentLabels, ...messages.giveaways.fragments };
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? giveaway.entries?.length ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const poolLeft = giveaway.maxTickets - giveaway.soldTickets;
  const maxPerUser =
    giveaway.maxEntriesPerUser != null ? Math.max(0, giveaway.maxEntriesPerUser - myEntries) : poolLeft;
  const maxAffordable =
    giveaway.ticketPrice > 0 ? Math.floor(userFragments / giveaway.ticketPrice) : 0;
  const maxSelectable = Math.max(0, Math.min(poolLeft, maxPerUser, maxAffordable));
  const totalCost = entriesToBuy * giveaway.ticketPrice;

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{giveaway.title}</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">{giveaway.description}</p>
          </div>
          <Badge
            variant={giveaway.status === 'ACTIVE' ? 'default' : 'secondary'}
            className={giveaway.status === 'ACTIVE' ? 'bg-green-500' : ''}
          >
            {giveaway.status === 'ACTIVE'
              ? messages.giveaways.card.status.active
              : giveaway.status === 'ENDED'
                ? messages.giveaways.card.status.ended
                : messages.giveaways.card.status.cancelled}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4 border">
          <div className="flex items-center space-x-3">
            {giveaway.prizeImageUrl ? (
              <Image
                src={giveaway.prizeImageUrl}
                alt={giveaway.prize}
                width={72}
                height={52}
                className="object-contain rounded shrink-0 drop-shadow"
                unoptimized
              />
            ) : (
              <TrophyIcon className="w-8 h-8 text-orange-600 shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-200">{messages.giveaways.card.prize}</h4>
              <p className="text-orange-700 dark:text-orange-300">{giveaway.prize}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1.5">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {giveaway.ticketPrice} {fg.costPerEntry}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>
              {totalParticipants} {fg.participants} · {totalEntries} {fg.totalEntries}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>
              {fg.yourEntries}: {myEntries} · {fg.yourChance}: {myChance.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrophyIcon className="w-4 h-4 shrink-0" />
            <span>
              {giveaway.winnerCount ?? 1} {fg.winnerCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-muted-foreground" />
            <span>{formatTimeRemaining(timeRemaining, messages)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>{endDate.toLocaleDateString(locale === 'cn' ? 'zh-CN' : locale)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{messages.giveaways.card.ticketsSold}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {giveaway.status === 'ENDED' && (giveaway.winnerId || (giveaway.winners && giveaway.winners.length > 0)) && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <StarIcon className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                  {messages.giveaways.card.winner}{' '}
                  {giveaway.winners && giveaway.winners.length > 0
                    ? `${giveaway.winners.length} gagnant(s)`
                    : giveaway.winnerId?.slice(-6)}
                </span>
              </div>
              <Link href={`/giveaways/${giveaway.id}`}>
                <Button variant="outline" size="sm" className="text-xs shrink-0">
                  {messages.giveawaysPage.viewDetails}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {giveaway.status === 'ACTIVE' && !timeRemaining.expired && (
          <div className="border-t pt-4 space-y-3">
            <Label htmlFor={`entries-${giveaway.id}`} className="text-sm">
              {fg.entriesToBuy}
            </Label>
            <div className="flex space-x-2">
              <Input
                id={`entries-${giveaway.id}`}
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
                onClick={() => onParticipate(giveaway, entriesToBuy)}
                disabled={
                  maxSelectable < 1 ||
                  userFragments < totalCost ||
                  entriesToBuy > poolLeft ||
                  entriesToBuy > maxPerUser
                }
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                {messages.giveaways.card.participate}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {messages.giveaways.youHave} {userFragments} {fg.entriesAvailable} — coût : {totalCost}{' '}
              fragments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function GiveawaysPage() {
  const { user } = useAuth();
  const { messages, locale } = useLocale();
  const [selectedTab, setSelectedTab] = useState('active');
  const { giveaways, loading, participateInGiveaway, refetch } = useGiveaways();
  const [userFragments, setUserFragments] = useState(0);
  const [giveawaysEnabled, setGiveawaysEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setUserFragments(user.fragments ?? 0);
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/giveaways/status')
      .then(r => r.json())
      .then(d => setGiveawaysEnabled(d.enabled ?? true))
      .catch(() => setGiveawaysEnabled(true));
  }, []);

  useEffect(() => {
    const initGiveaway = async () => {
      try {
        await fetch('/api/giveaways/init', { method: 'POST' });
        refetch();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
      }
    };

    initGiveaway();
  }, [refetch]);

  const { data: myEntriesData, isLoading: loadingEntries, refetch: refetchEntries } = useQuery({
    queryKey: ['giveaways', 'my-entries', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/giveaways/my-entries', { credentials: 'include' });
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!user,
  });
  const myEntries = myEntriesData ?? [];

  const handleParticipate = async (giveaway: GiveawayWithEntries, entries: number) => {
    if (!user) {
      toast.error(messages.giveaways.participation.loginRequired);
      return;
    }

    const cost = entries * giveaway.ticketPrice;
    if (userFragments < cost) {
      toast.error(
        messages.giveaways.participation.notEnoughFragments ??
          messages.giveaways.participation.notEnoughTickets
      );
      return;
    }

    try {
      const res = await participateInGiveaway(giveaway.id, entries);
      setUserFragments(res.newFragmentBalance);
      refetch();
      refetchEntries();
    } catch (error) {
      console.error('Erreur lors de la participation:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {messages.giveaways.myEntries.entries.inProgress}
        </Badge>;
      case 'won':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">
          {messages.giveaways.myEntries.entries.won}
        </Badge>;
      case 'lost':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">
          {messages.giveaways.myEntries.entries.lost}
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const activeGiveaways = giveaways.filter(g => g.status === 'ACTIVE');
  const endedGiveaways = giveaways.filter(g => g.status === 'ENDED');

  // Chargement de l'état
  if (giveawaysEnabled === null) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{messages.giveawaysPage.loading}</div>
      </div>
    );
  }

  // Page désactivée par l'admin
  if (!giveawaysEnabled) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Icône animée */}
            <div className="relative mb-8 inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center mx-auto">
                <LockClosedIcon className="w-16 h-16 text-orange-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Giveaways
              </span>{' '}
              {messages.giveawaysPage.comingSoon}
            </h1>
            <p className="text-xl text-muted-foreground mb-3">
              {messages.giveawaysPage.temporarilyClosed}
            </p>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              {messages.giveawaysPage.comingSoonDescription}
            </p>

            {/* Infos sur les tickets */}
            <Card className="mb-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <BellAlertIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                      {messages.giveawaysPage.keepAccumulating}
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {messages.giveawaysPage.keepAccumulatingDescription}
                    </p>
                    {user && (
                      <div className="mt-3 flex items-center space-x-2">
                        <SparklesIcon className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {user.fragments ?? 0} fragments
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                  <TrophyIcon className="w-4 h-4 mr-2" />
                  {messages.giveawaysPage.viewDashboard}
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <GiftIcon className="w-4 h-4 mr-2" />
                  {messages.giveawaysPage.sellMySkins}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GiveawayNotifications />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <GiftIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            {messages.giveaways.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {messages.giveaways.subtitle}
          </p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            disabled={loading}
            className="mb-4"
          >
            {loading ? messages.giveawaysPage.loading : messages.giveawaysPage.refreshGiveaways}
          </Button>
        </motion.div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        {messages.giveaways.userTickets.level} {user.level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <SparklesIcon className="w-5 h-5 text-amber-500" />
                      <span className="text-2xl font-bold">{userFragments}</span>
                      <span className="text-muted-foreground">fragments</span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 text-sm text-muted-foreground">
                      <span>{messages.giveaways.userTickets.tickets}: {user.tickets ?? 0}</span>
                      <Link href="/missions" className="text-orange-600 hover:underline">
                        Missions
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How Tickets Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TicketIcon className="w-5 h-5 text-purple-500" />
                <span>{messages.giveaways.howTicketsWork.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{messages.giveaways.howTicketsWork.earn.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {messages.giveaways.howTicketsWork.earn.description}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GiftIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{messages.giveaways.howTicketsWork.participate.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {messages.giveaways.howTicketsWork.participate.description}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrophyIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">{messages.giveaways.howTicketsWork.win.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {messages.giveaways.howTicketsWork.win.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Giveaways Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                {messages.giveaways.tabs.active} ({activeGiveaways.length})
              </TabsTrigger>
              <TabsTrigger value="ended">
                {messages.giveaways.tabs.ended} ({endedGiveaways.length})
              </TabsTrigger>
              <TabsTrigger value="my-entries">
                {messages.giveaways.tabs.myEntries}
              </TabsTrigger>
            </TabsList>

            {/* Active Giveaways */}
            <TabsContent value="active">
              {loading ? (
                <div className="text-center py-8">
                  <p>{messages.giveawaysPage.loadingGiveaways}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGiveaways.map((giveaway, index) => (
                    <motion.div
                      key={giveaway.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <GiveawayCard giveaway={giveaway} onParticipate={handleParticipate} messages={messages} userFragments={userFragments} locale={locale} />
                    </motion.div>
                  ))}
                </div>
              )}
              {activeGiveaways.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">{messages.giveaways.empty.noActive}</h3>
                    <p className="text-muted-foreground">
                      {messages.giveaways.empty.noActiveDescription}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Ended Giveaways */}
            <TabsContent value="ended">
              {loading ? (
                <div className="text-center py-8">
                  <p>{messages.giveawaysPage.loadingEndedGiveaways}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedGiveaways.map((giveaway, index) => (
                    <motion.div
                      key={giveaway.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <GiveawayCard giveaway={giveaway} onParticipate={handleParticipate} messages={messages} userFragments={userFragments} locale={locale} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Entries */}
            <TabsContent value="my-entries">
              {user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.giveaways.myEntries.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingEntries ? (
                      <div className="text-center py-8">
                        <p>{messages.giveawaysPage.loadingParticipations}</p>
                      </div>
                    ) : myEntries.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {myEntries.map((entry: { id: string; ticketsUsed: number; enteredAt: string; participationStatus: string; giveaway: { id: string; title: string; status: string; endDate: string } }) => (
                          <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Link href={`/giveaways/${entry.giveaway.id}`}>
                                  <h4 className="font-semibold hover:text-orange-600 transition-colors cursor-pointer">
                                    {entry.giveaway.title}
                                  </h4>
                                </Link>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {entry.ticketsUsed} {entry.ticketsUsed > 1 ? messages.giveawaysPage.ticketsUsed : messages.giveawaysPage.ticketUsed}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {messages.giveawaysPage.participatedOn} {new Date(entry.enteredAt).toLocaleDateString(locale === 'cn' ? 'zh-CN' : locale, {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(entry.participationStatus)}
                                {entry.giveaway.status === 'ENDED' && (
                                  <p className="text-xs text-muted-foreground">
                                    {messages.giveawaysPage.endedOn} {new Date(entry.giveaway.endDate).toLocaleDateString(locale === 'cn' ? 'zh-CN' : locale)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">{messages.giveawaysPage.noEntries}</h3>
                        <p className="text-muted-foreground mb-6">
                          {messages.giveawaysPage.noEntriesDescription}
                        </p>
                        <Button onClick={() => setSelectedTab('active')}>
                          {messages.giveawaysPage.viewActive}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">{messages.giveaways.empty.loginRequired}</h3>
                    <p className="text-muted-foreground mb-6">
                      {messages.giveaways.empty.loginRequiredDescription}
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      {messages.giveaways.empty.loginButton}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
        </div>
      </div>
    </>
  );
}
