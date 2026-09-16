'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { useTourMode } from '@/components/providers/tour-provider';
import { GiveawaysTourDemo } from '@/components/tour-demos/giveaways-tour-demo';
import { useGiveaways, type GiveawayWithEntries } from '@/hooks/use-giveaways';
import { GiveawayNotifications } from '@/components/giveaway/giveaway-notifications';
import { GiveawaysCompactHeader } from '@/components/giveaway/giveaways-compact-header';
import { GiveawayRecurringCarousel } from '@/components/giveaway/giveaway-recurring-carousel';
import { GiveawayCard } from '@/components/giveaway/giveaway-card';
import { GiveawayEarnFragments } from '@/components/giveaway/giveaway-earn-fragments';
import { GiveawayPastWinners } from '@/components/giveaway/giveaway-past-winners';
import {
  GiveawayMyParticipations,
  GiveawayMyWinnings,
} from '@/components/giveaway/giveaway-sidebar-lists';
import { GiveawayFaq } from '@/components/giveaway/giveaway-faq';
import { GiveawayWalletBar } from '@/components/giveaway/giveaway-wallet-bar';
import { GiveawayEmptyState } from '@/components/giveaway/giveaway-empty-state';
import {
  GiveawayCarouselSkeleton,
  GiveawayGridSkeleton,
} from '@/components/giveaway/giveaway-card-skeleton';
import { useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { FragmentAmount } from '@/components/ui/level-badge';
import { Handshake } from 'lucide-react';
import {
  GiftIcon,
  TrophyIcon,
  LockClosedIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  cheapestActiveTicketPrice,
  fragmentsUntilCheapestEntry,
  selectHighestValueIndex,
  selectRecurringActiveGiveaways,
  sortGiveawaysByTierThenEnd,
} from '@/lib/giveaway-presentation';

const giveawayGridClass = 'grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 min-[1200px]:grid-cols-3';

export default function GiveawaysPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { messages, locale } = useLocale();
  const { isTourMode } = useTourMode();
  const reduceMotion = useReducedMotion();
  const [carouselIndex, setCarouselIndex] = useState(0);
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
      await refreshUser();
      refetch();
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
  const listedPrivate = useMemo(
    () => sortGiveawaysByTierThenEnd(privateActive),
    [privateActive]
  );
  const recurringGiveaways = useMemo(
    () => selectRecurringActiveGiveaways(publicActive),
    [publicActive]
  );
  const otherPublic = useMemo(
    () =>
      sortGiveawaysByTierThenEnd(
        publicActive.filter((giveaway) => !recurringGiveaways.some((item) => item.id === giveaway.id))
      ),
    [publicActive, recurringGiveaways]
  );
  const recurringKey = recurringGiveaways.map((giveaway) => giveaway.id).join('|');
  const lastRecurringKey = useRef('');

  useEffect(() => {
    if (!recurringKey) {
      lastRecurringKey.current = '';
      setCarouselIndex(0);
      return;
    }
    if (lastRecurringKey.current !== recurringKey) {
      lastRecurringKey.current = recurringKey;
      setCarouselIndex(Math.max(0, selectHighestValueIndex(recurringGiveaways)));
      return;
    }
    if (carouselIndex >= recurringGiveaways.length) {
      setCarouselIndex(Math.max(0, recurringGiveaways.length - 1));
    }
  }, [carouselIndex, recurringGiveaways, recurringKey]);
  const fragmentsUntilNext = useMemo(
    () => fragmentsUntilCheapestEntry(activeGiveaways, userFragments),
    [activeGiveaways, userFragments]
  );
  const cheapestTicket = useMemo(
    () => cheapestActiveTicketPrice(activeGiveaways),
    [activeGiveaways]
  );

  const selectGiveaway = (giveaway: GiveawayWithEntries) => {
    const recurringIndex = recurringGiveaways.findIndex((item) => item.id === giveaway.id);
    if (recurringIndex >= 0) {
      setCarouselIndex(recurringIndex);
      document
        .getElementById('recurring-giveaways')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document
      .querySelector(`[data-giveaway="${giveaway.id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
      <div className="container mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <GiveawaysCompactHeader
            messages={messages}
            user={user}
            userFragments={userFragments}
            fragmentsUntilNext={fragmentsUntilNext}
            cheapestTicketPrice={cheapestTicket}
          />

          {loading ? (
            <GiveawayCarouselSkeleton label={messages.giveawaysPage.loadingGiveaways} />
          ) : (
            <GiveawayRecurringCarousel
              giveaways={recurringGiveaways}
              messages={messages}
              userFragments={userFragments}
              onParticipate={handleParticipate}
              now={now}
              activeIndex={carouselIndex}
              onActiveIndexChange={setCarouselIndex}
            />
          )}

          <div className="giveaway-board">
            <div className="giveaway-board-main">
              {loading ? (
                listedPrivate.length > 0 || otherPublic.length > 0 ? (
                  <GiveawayGridSkeleton
                    className={giveawayGridClass}
                    count={3}
                    label={messages.giveawaysPage.loadingGiveaways}
                  />
                ) : null
              ) : (
                <>
                  {listedPrivate.length > 0 && (
                    <section className="mb-10">
                      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                        <Handshake className="h-5 w-5 text-purple-300" aria-hidden />
                        {messages.giveaways.layout.privateSectionTitle}
                      </h2>
                      <div className={giveawayGridClass}>
                        {listedPrivate.map((giveaway, index) => (
                          <motion.div
                            key={giveaway.id}
                            className="h-full"
                            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                          >
                            <GiveawayCard
                              giveaway={giveaway}
                              messages={messages}
                              locale={locale}
                              now={now}
                              userFragments={userFragments}
                              onParticipate={handleParticipate}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {otherPublic.length > 0 && (
                    <section className="mb-10">
                      <h2 className="mb-4 font-display text-lg font-semibold">
                        {messages.giveaways.layout.specialSectionTitle}
                      </h2>
                      <div className={giveawayGridClass}>
                        {otherPublic.map((giveaway, index) => (
                          <motion.div
                            key={giveaway.id}
                            className="h-full"
                            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                          >
                            <GiveawayCard
                              giveaway={giveaway}
                              messages={messages}
                              locale={locale}
                              now={now}
                              userFragments={userFragments}
                              onParticipate={handleParticipate}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {recurringGiveaways.length === 0 &&
                    listedPrivate.length === 0 &&
                    otherPublic.length === 0 && (
                    <GiveawayEmptyState
                      title={messages.giveaways.empty.noActive}
                      description={messages.giveaways.empty.noActiveDescription}
                    />
                  )}
                </>
              )}
              <GiveawayPastWinners giveaways={giveaways} messages={messages} locale={locale} />
              <GiveawayFaq messages={messages} />
            </div>
            <aside className="giveaway-board-aside">
              <GiveawayEarnFragments messages={messages} />
              <GiveawayMyParticipations
                giveaways={activeGiveaways}
                messages={messages}
                locale={locale}
                now={now}
                onSelect={selectGiveaway}
              />
              <GiveawayMyWinnings
                giveaways={giveaways}
                messages={messages}
                username={user.username}
              />
            </aside>
          </div>
        </div>
      </div>
      <GiveawayWalletBar messages={messages} userFragments={userFragments} />
    </>
  );
}
