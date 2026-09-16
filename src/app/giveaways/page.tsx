'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { useTourMode } from '@/components/providers/tour-provider';
import { GiveawaysTourDemo } from '@/components/tour-demos/giveaways-tour-demo';
import { useGiveaways, type GiveawayWithEntries } from '@/hooks/use-giveaways';
import { GiveawayNotifications } from '@/components/giveaway/giveaway-notifications';
import { GiveawaysCompactHeader } from '@/components/giveaway/giveaways-compact-header';
import { GiveawayHero } from '@/components/giveaway/giveaway-hero';
import { GiveawayCard } from '@/components/giveaway/giveaway-card';
import { GiveawayToolbar } from '@/components/giveaway/giveaway-toolbar';
import { useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { FragmentAmount } from '@/components/ui/level-badge';
import {
  GiftIcon,
  TrophyIcon,
  LockClosedIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  filterGiveawaysByTier,
  selectFeaturedGiveaway,
  sortGiveaways,
  type GiveawaySort,
  type GiveawayTierFilter,
} from '@/lib/giveaway-presentation';

const giveawayGridClass = 'grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3';

export default function GiveawaysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { messages } = useLocale();
  const { isTourMode } = useTourMode();
  const [selectedTab, setSelectedTab] = useState('active');
  const [tierFilter, setTierFilter] = useState<GiveawayTierFilter>('all');
  const [sort, setSort] = useState<GiveawaySort>('endingSoon');
  const { giveaways, loading, participateInGiveaway, refetch } = useGiveaways();
  const [userFragments, setUserFragments] = useState(0);
  const [giveawaysEnabled, setGiveawaysEnabled] = useState<boolean | null>(null);
  const now = useLiveNow();

  useEffect(() => {
    if (user) {
      setUserFragments(user.fragments ?? 0);
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/giveaways/status')
      .then((r) => r.json())
      .then((d) => setGiveawaysEnabled(d.enabled ?? true))
      .catch(() => setGiveawaysEnabled(true));
  }, []);

  useEffect(() => {
    const initGiveaway = async () => {
      try {
        await fetch('/api/giveaways/init', { method: 'POST' });
        refetch();
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
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
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
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

  const activeGiveaways = useMemo(
    () => giveaways.filter((g) => g.status === 'ACTIVE'),
    [giveaways]
  );
  const publicActive = useMemo(
    () => activeGiveaways.filter((g) => !g.isPrivate),
    [activeGiveaways]
  );
  const privateActive = useMemo(
    () => activeGiveaways.filter((g) => g.isPrivate),
    [activeGiveaways]
  );
  const endedGiveaways = useMemo(
    () => sortGiveaways(
      giveaways.filter((g) => g.status === 'ENDED'),
      sort
    ),
    [giveaways, sort]
  );
  const featured = useMemo(() => selectFeaturedGiveaway(publicActive), [publicActive]);
  const filteredPublic = useMemo(() => {
    const withoutFeatured = publicActive.filter((g) => g.id !== featured?.id);
    return sortGiveaways(filterGiveawaysByTier(withoutFeatured, tierFilter), sort);
  }, [publicActive, featured?.id, tierFilter, sort]);
  const filteredPrivate = useMemo(
    () => sortGiveaways(filterGiveawaysByTier(privateActive, tierFilter), sort),
    [privateActive, tierFilter, sort]
  );
  const myGiveaways = useMemo(
    () => sortGiveaways(
      giveaways.filter((g) => (g.myEntries ?? 0) > 0),
      sort
    ),
    [giveaways, sort]
  );

  if (giveawaysEnabled === null) {
    return (
      <PageLoading
        variant="compact"
        message={messages.giveawaysPage.loading}
        className="min-h-[50vh]"
      />
    );
  }

  if (authLoading) {
    return (
      <PageLoading
        variant="compact"
        message={messages.common.loading}
        className="min-h-[50vh]"
      />
    );
  }

  if (!user) {
    if (isTourMode) return <GiveawaysTourDemo />;
    return (
      <LoginRequiredBlock
        icon={<GiftIcon className="w-16 h-16" />}
        title={messages.giveaways.empty.loginRequired}
        description={messages.giveaways.empty.loginRequiredDescription}
        buttonLabel={messages.giveaways.empty.loginButton}
      />
    );
  }

  if (!giveawaysEnabled) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="relative mb-8 inline-block">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-theme-accent/30 bg-gradient-to-br from-theme-accent/20 to-theme-accent/30">
                <LockClosedIcon className="h-16 w-16 text-theme-accent" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                <span className="text-xs font-bold text-white">!</span>
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold md:text-4xl">
              <span className="bg-cta-gradient bg-clip-text text-transparent">
                {messages.giveaways.title}
              </span>{' '}
              {messages.giveawaysPage.comingSoon}
            </h1>
            <p className="mb-3 text-xl text-muted-foreground">
              {messages.giveawaysPage.temporarilyClosed}
            </p>
            <p className="mx-auto mb-10 max-w-md text-muted-foreground">
              {messages.giveawaysPage.comingSoonDescription}
            </p>

            <Card className="mb-8 border-theme-accent/20 bg-gradient-to-br from-theme-accent/5 to-theme-accent/10 dark:border-theme-accent/30 dark:from-theme-accent/10 dark:to-theme-accent/15">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <BellAlertIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-theme-accent" />
                  <div className="text-left">
                    <h3 className="mb-1 font-semibold text-theme-accent dark:text-theme-highlight">
                      {messages.giveawaysPage.keepAccumulating}
                    </h3>
                    <p className="text-sm text-theme-accent">
                      {messages.giveawaysPage.keepAccumulatingDescription}
                    </p>
                    <div className="mt-3">
                      <FragmentAmount
                        amount={user.fragments ?? 0}
                        size="xs"
                        className="font-bold text-theme-highlight"
                      />
                      <span className="ml-1 text-sm text-theme-highlight">
                        {messages.giveaways.card.fragmentsLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button variant="cta">
                  <TrophyIcon className="mr-2 h-4 w-4" />
                  {messages.giveawaysPage.viewDashboard}
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <GiftIcon className="mr-2 h-4 w-4" />
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
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GiveawaysCompactHeader
            messages={messages}
            user={user}
            userFragments={userFragments}
          />

          {featured && (
            <GiveawayHero
              giveaway={featured}
              messages={messages}
              userFragments={userFragments}
              onParticipate={handleParticipate}
              currentUser={{ username: user.username, avatar: user.avatar }}
            />
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-0">
            <GiveawayToolbar
              messages={messages}
              counts={{
                active: activeGiveaways.length,
                mine: myGiveaways.length,
                ended: endedGiveaways.length,
              }}
              selectedTab={selectedTab}
              tierFilter={tierFilter}
              onTierFilterChange={setTierFilter}
              sort={sort}
              onSortChange={setSort}
            />

            <TabsContent value="active">
              {loading ? (
                <PageLoading variant="compact" message={messages.giveawaysPage.loadingGiveaways} />
              ) : (
                <>
                  {filteredPublic.length > 0 && (
                    <div className={giveawayGridClass}>
                      {filteredPublic.map((giveaway, index) => (
                        <motion.div
                          key={giveaway.id}
                          className="h-full"
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                          <GiveawayCard
                            giveaway={giveaway}
                            onParticipate={handleParticipate}
                            messages={messages}
                            userFragments={userFragments}
                            now={now}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {filteredPublic.length === 0 &&
                    filteredPrivate.length === 0 &&
                    !featured && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <GiftIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                          <h3 className="mb-2 text-xl font-semibold">{messages.giveaways.empty.noActive}</h3>
                          <p className="text-muted-foreground">
                            {messages.giveaways.empty.noActiveDescription}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                  {filteredPublic.length === 0 && tierFilter !== 'all' && (
                    <p className="text-sm text-muted-foreground">
                      {messages.giveaways.layout.emptyFiltered}
                    </p>
                  )}

                  {filteredPrivate.length > 0 && (
                    <section className="mt-10">
                      <h2 className="mb-4 font-display text-lg font-semibold">
                        {messages.giveaways.layout.privateSectionTitle}
                      </h2>
                      <div className={giveawayGridClass}>
                        {filteredPrivate.map((giveaway, index) => (
                          <motion.div
                            key={giveaway.id}
                            className="h-full"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                          >
                            <GiveawayCard
                              giveaway={giveaway}
                              onParticipate={handleParticipate}
                              messages={messages}
                              userFragments={userFragments}
                              now={now}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="my-entries">
              {loading || loadingEntries ? (
                <PageLoading variant="compact" message={messages.giveawaysPage.loadingParticipations} />
              ) : myGiveaways.length > 0 ? (
                <div className={giveawayGridClass}>
                  {myGiveaways.map((giveaway, index) => (
                    <motion.div
                      key={giveaway.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <GiveawayCard
                        giveaway={giveaway}
                        onParticipate={handleParticipate}
                        messages={messages}
                        userFragments={userFragments}
                        now={now}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : myEntries.length > 0 ? (
                <Card>
                  <CardContent className="space-y-3 p-4 sm:p-6">
                    {myEntries.map(
                      (entry: {
                        id: string;
                        ticketsUsed: number;
                        enteredAt: string;
                        participationStatus: string;
                        giveaway: { id: string; title: string; status: string; endDate: string };
                      }) => (
                        <Link
                          key={entry.id}
                          href={`/giveaways/${entry.giveaway.id}`}
                          className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <h4 className="font-semibold">{entry.giveaway.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {entry.ticketsUsed}{' '}
                            {entry.ticketsUsed > 1
                              ? messages.giveawaysPage.ticketsUsed
                              : messages.giveawaysPage.ticketUsed}
                          </p>
                        </Link>
                      )
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <GiftIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold">{messages.giveawaysPage.noEntries}</h3>
                    <p className="mb-6 text-muted-foreground">
                      {messages.giveawaysPage.noEntriesDescription}
                    </p>
                    <Button onClick={() => setSelectedTab('active')}>
                      {messages.giveawaysPage.viewActive}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ended">
              {loading ? (
                <PageLoading variant="compact" message={messages.giveawaysPage.loadingEndedGiveaways} />
              ) : endedGiveaways.length > 0 ? (
                <div className={giveawayGridClass}>
                  {endedGiveaways.map((giveaway, index) => (
                    <motion.div
                      key={giveaway.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <GiveawayCard
                        giveaway={giveaway}
                        onParticipate={handleParticipate}
                        messages={messages}
                        userFragments={userFragments}
                        now={now}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <GiftIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold">{messages.giveaways.card.status.ended}</h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
