'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
import {
  homeExpand,
  homeReveal,
  homeStagger,
} from '@/lib/home-animation-classes';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  GlobeEuropeAfricaIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  GiftIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { SectionBottomFade } from '@/components/home/section-bottom-fade';

const badgeVariantMap: Record<string, string> = {
  'certified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'popular': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'new': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'premium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'efficient': 'bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20 dark:text-theme-highlight',
  'global': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'fun': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'profitable': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'pro': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

const getBadgeStyle = (badge: string) => {
  const key = badge.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return badgeVariantMap[key] || badgeVariantMap.popular;
};

export function FeaturesSection() {
  const { messages } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const allFeatures = [
    {
      key: 'payments',
      category: messages.features.items.payments.category,
      icon: BanknotesIcon,
      title: messages.features.items.payments.title,
      description: messages.features.items.payments.description,
      highlights: messages.features.items.payments.highlights,
      badge: messages.features.items.payments.badge,
    },
    {
      key: 'support',
      category: messages.features.items.support.category,
      icon: ChatBubbleLeftRightIcon,
      title: messages.features.items.support.title,
      description: messages.features.items.support.description,
      highlights: messages.features.items.support.highlights,
      badge: messages.features.items.support.badge,
    },
    {
      key: 'gamification',
      category: messages.features.items.gamification.category,
      icon: GiftIcon,
      title: messages.features.items.gamification.title,
      description: messages.features.items.gamification.description,
      highlights: messages.features.items.gamification.highlights,
      badge: messages.features.items.gamification.badge,
    },
    {
      key: 'security',
      category: messages.features.items.security.category,
      icon: ShieldCheckIcon,
      title: messages.features.items.security.title,
      description: messages.features.items.security.description,
      highlights: messages.features.items.security.highlights,
      badge: messages.features.items.security.badge,
    },
    {
      key: 'estimation',
      category: messages.features.items.estimation.category,
      icon: CurrencyDollarIcon,
      title: messages.features.items.estimation.title,
      description: messages.features.items.estimation.description,
      highlights: messages.features.items.estimation.highlights,
      badge: messages.features.items.estimation.badge,
    },
    {
      key: 'speed',
      category: messages.features.items.speed.category,
      icon: ClockIcon,
      title: messages.features.items.speed.title,
      description: messages.features.items.speed.description,
      highlights: messages.features.items.speed.highlights,
      badge: messages.features.items.speed.badge,
    },
    {
      key: 'international',
      category: messages.features.items.international.category,
      icon: GlobeEuropeAfricaIcon,
      title: messages.features.items.international.title,
      description: messages.features.items.international.description,
      highlights: messages.features.items.international.highlights,
      badge: messages.features.items.international.badge,
    },
    {
      key: 'affiliation',
      category: messages.features.items.affiliation.category,
      icon: UserGroupIcon,
      title: messages.features.items.affiliation.title,
      description: messages.features.items.affiliation.description,
      highlights: messages.features.items.affiliation.highlights,
      badge: messages.features.items.affiliation.badge,
    },
    {
      key: 'analytics',
      category: messages.features.items.analytics.category,
      icon: ChartBarIcon,
      title: messages.features.items.analytics.title,
      description: messages.features.items.analytics.description,
      highlights: messages.features.items.analytics.highlights,
      badge: messages.features.items.analytics.badge,
    },
  ];

  const visibleFeatures = allFeatures.slice(0, 3);
  const hiddenFeatures = allFeatures.slice(3);

  const FeatureCard = ({ feature, index }: { feature: (typeof allFeatures)[0]; index: number }) => (
    <div className={`${homeReveal.up} ${homeStagger(index)}`}>
      <Card className="lunar-card surface h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-white/10 to-theme-accent/10 rounded-lg border border-border/50">
                <feature.icon className="w-6 h-6 text-theme-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {feature.category}
                </p>
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs ${getBadgeStyle(feature.badge)}`}
            >
              {feature.badge}
            </Badge>
          </div>

          <p className="text-muted-foreground mb-4 text-sm">
            {feature.description}
          </p>

          <div className="space-y-2">
            {feature.highlights.map((highlight, i) => (
              <div key={i} className="flex items-center text-xs">
                <div className="w-1.5 h-1.5 bg-theme-accent/70 rounded-full mr-2 flex-shrink-0" />
                <span className="text-muted-foreground">{highlight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="home-section-defer relative py-24">
      <SectionBottomFade to="muted" />
      <div className="relative z-10 container mx-auto px-4">
        <div className={`text-center mb-16 ${homeReveal.upSm}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wide">
            {messages.features.title.split('MoonSkin')[0]}
            <span className="text-chrome-gradient">
              MoonSkin
            </span>
            {messages.features.title.split('MoonSkin')[1] || ''}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {messages.features.subtitle}
          </p>
        </div>

        {/* Always-visible 3 features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleFeatures.map((feature, index) => (
            <FeatureCard key={feature.key} feature={feature} index={index} />
          ))}
        </div>

        {/* Toggle button */}
        <div className={`flex justify-center mt-10 ${homeReveal.upSm}`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="surface-interactive home-hover-scale inline-flex items-center gap-2 lunar-card px-6 py-3 rounded-full text-sm font-medium"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4 text-theme-accent" />
                <span>{messages.features.showLess}</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 text-theme-accent" />
                <span>{messages.features.showMore}</span>
              </>
            )}
          </button>
        </div>

        {/* Expandable 6 features */}
        <div
          className={homeExpand.grid}
          data-open={expanded ? 'true' : 'false'}
          aria-hidden={!expanded}
        >
          <div className="home-expand-grid-inner">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {hiddenFeatures.map((feature, index) => (
                <FeatureCard key={feature.key} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
