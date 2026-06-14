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
  TrophyIcon,
  UserIcon,
  SparklesIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { TourDemoBanner } from './tour-demo-banner';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';

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
      <div className="max-w-7xl mx-auto">
        <TourDemoBanner />

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            <GiftIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {g.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {g.subtitle}
          </p>
        </div>

        <div data-tour="giveaways-fragments" className="mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 rounded-full bg-cta-gradient-br flex items-center justify-center text-white">
                    <UserIcon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold">CS_Player</h3>
                    <p className="text-sm text-muted-foreground">
                      {g.userTickets.level} 5
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <FragmentAmount amount={340} size="sm" className="text-2xl font-bold" />
                    <span className="text-muted-foreground">{g.card.fragmentsLabel}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-left min-w-[180px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{g.card.nextGiveaway}</span>
                      <span className="text-theme-stat font-medium">{td.moreNeededShort}</span>
                    </div>
                    <Progress value={97} className="h-1.5 bg-muted [&>div]:bg-theme-stat" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div data-tour="giveaways-how" className="mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-theme-accent/5 to-theme-accent/10 border-theme-accent/20">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-theme-accent" />
                {g.howTicketsWork.title}
              </h3>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">1.</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1 flex-wrap">
                    {td.howStep1}
                    <FragmentBadge size="xs" />
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">2.</span>
                  <span className="text-muted-foreground">{td.howStep2}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">3.</span>
                  <span className="text-muted-foreground">{td.howStep3}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" data-tour="giveaways-tabs">
          <TabsList className="grid grid-cols-3 mb-4">
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
                      <giveaway.icon className="h-8 w-8 text-theme-accent shrink-0" aria-hidden />
                      <div>
                        <h4 className="font-semibold">{giveaway.title}</h4>
                        <p className="text-sm text-theme-accent font-medium">{giveaway.prize}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="mb-1 text-xs">
                        <ClockIcon className="w-3 h-3 mr-1" />{giveaway.endIn}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserGroupIcon className="w-3 h-3" />
                        {giveaway.participants} {g.card.participants}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <FragmentAmount amount={giveaway.ticketPrice} size="xs" className="text-xs" />
                        <span>{td.perEntry}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
                    {td.participateDemo}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="ended">
            <Card><CardContent className="p-8 text-center text-muted-foreground">{td.endedEmpty}</CardContent></Card>
          </TabsContent>
          <TabsContent value="mine">
            <Card><CardContent className="p-8 text-center text-muted-foreground">{td.myEntriesEmpty}</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
