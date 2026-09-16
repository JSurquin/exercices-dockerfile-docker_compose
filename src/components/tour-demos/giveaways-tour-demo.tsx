'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/components/providers/locale-provider';
import {
  GiftIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  SparklesIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { TourDemoBanner } from './tour-demo-banner';
import { FragmentAmount } from '@/components/ui/level-badge';

type DemoIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const DEMO_GIVEAWAYS: Array<{
  title: string;
  prize: string;
  participants: number;
  ticketPrice: number;
  endIn: string;
  icon: DemoIcon;
}> = [
  {
    title: 'AWP | Dragon Lore (FT)',
    prize: '~€ 1 200',
    participants: 248,
    ticketPrice: 50,
    endIn: '3j 12h',
    icon: SparklesIcon,
  },
  {
    title: 'Knife | Karambit Doppler',
    prize: '~€ 450',
    participants: 91,
    ticketPrice: 25,
    endIn: '6j 4h',
    icon: GiftIcon,
  },
  {
    title: 'Cash Reward 50€',
    prize: '€ 50',
    participants: 430,
    ticketPrice: 10,
    endIn: '1j 18h',
    icon: BanknotesIcon,
  },
];

export function GiveawaysTourDemo() {
  const { messages } = useLocale();
  const td = messages.tourDemo;
  const g = messages.giveaways;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <TourDemoBanner />

        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <GiftIcon className="h-6 w-6 shrink-0 text-theme-accent" />
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {g.title}
              </h1>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{g.subtitle}</p>
            <button
              type="button"
              data-tour="giveaways-how"
              className="text-sm text-theme-accent underline-offset-4 hover:underline"
            >
              {g.layout.howItWorksLink}
            </button>
          </div>

          <div
            data-tour="giveaways-fragments"
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cta-gradient-br text-white">
              <UserIcon className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <FragmentAmount
                  amount={340}
                  size="sm"
                  className="font-display text-2xl font-semibold leading-none"
                />
                <span className="text-xs text-muted-foreground">{g.layout.availableFragments}</span>
              </div>
              <Progress value={97} className="mt-2 h-1 bg-muted/60 [&>div]:bg-theme-accent" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="active" data-tour="giveaways-tabs">
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="active">{g.tabs.active}</TabsTrigger>
            <TabsTrigger value="ended">{g.tabs.ended}</TabsTrigger>
            <TabsTrigger value="mine">{g.tabs.myEntries}</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-4">
            {DEMO_GIVEAWAYS.map((giveaway, i) => (
              <Card key={i} className="border-theme-accent/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <giveaway.icon className="h-8 w-8 shrink-0 text-theme-accent" aria-hidden />
                      <div>
                        <h4 className="font-semibold">{giveaway.title}</h4>
                        <p className="text-sm font-medium text-theme-accent">{giveaway.prize}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="outline" className="mb-1 text-xs">
                        <ClockIcon className="mr-1 h-3 w-3" />
                        {giveaway.endIn}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserGroupIcon className="h-3 w-3" />
                        {giveaway.participants} {g.card.participants}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <FragmentAmount amount={giveaway.ticketPrice} size="xs" className="text-xs" />
                        <span>{td.perEntry}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    disabled
                  >
                    {td.participateDemo}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="ended">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">{td.endedEmpty}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mine">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">{td.myEntriesEmpty}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
