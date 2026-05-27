'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
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
} from '@heroicons/react/24/outline';

// Map badge type (from i18n) to style classes - using normalized keys
const badgeVariantMap: Record<string, string> = {
  'certified': 'bg-white/10 text-[#e0e0e8] border-[rgba(200,205,220,0.2)]',
  'popular': 'bg-white/8 text-[#c8c8d8] border-[rgba(200,205,220,0.15)]',
  'new': 'bg-white/10 text-[#e8e8f0] border-[rgba(200,205,220,0.2)]',
  'premium': 'bg-white/12 text-[#ffffff] border-[rgba(220,220,240,0.25)]',
  'efficient': 'bg-white/8 text-[#a8b8cc] border-[rgba(168,184,204,0.2)]',
  'global': 'bg-white/8 text-[#b0b8c8] border-[rgba(200,205,220,0.15)]',
  'fun': 'bg-white/8 text-[#c0c0d0] border-[rgba(200,205,220,0.15)]',
  'profitable': 'bg-white/10 text-[#e0e0e8] border-[rgba(200,205,220,0.2)]',
  'pro': 'bg-white/12 text-[#e8e8f0] border-[rgba(200,205,220,0.25)]',
};

// Helper function to get badge style
const getBadgeStyle = (badge: string) => {
  const key = badge.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
  return badgeVariantMap[key] || badgeVariantMap.popular;
};

export function FeaturesSection() {
  const { messages } = useLocale();
  
  const features = [
    {
      category: messages.features.items.security.category,
      icon: ShieldCheckIcon,
      title: messages.features.items.security.title,
      description: messages.features.items.security.description,
      highlights: messages.features.items.security.highlights,
      badge: messages.features.items.security.badge,
    },
    {
      category: messages.features.items.payments.category,
      icon: BanknotesIcon,
      title: messages.features.items.payments.title,
      description: messages.features.items.payments.description,
      highlights: messages.features.items.payments.highlights,
      badge: messages.features.items.payments.badge,
    },
    {
      category: messages.features.items.estimation.category,
      icon: CurrencyDollarIcon,
      title: messages.features.items.estimation.title,
      description: messages.features.items.estimation.description,
      highlights: messages.features.items.estimation.highlights,
      badge: messages.features.items.estimation.badge,
    },
    {
      category: messages.features.items.support.category,
      icon: ChatBubbleLeftRightIcon,
      title: messages.features.items.support.title,
      description: messages.features.items.support.description,
      highlights: messages.features.items.support.highlights,
      badge: messages.features.items.support.badge,
    },
    {
      category: messages.features.items.speed.category,
      icon: ClockIcon,
      title: messages.features.items.speed.title,
      description: messages.features.items.speed.description,
      highlights: messages.features.items.speed.highlights,
      badge: messages.features.items.speed.badge,
    },
    {
      category: messages.features.items.international.category,
      icon: GlobeEuropeAfricaIcon,
      title: messages.features.items.international.title,
      description: messages.features.items.international.description,
      highlights: messages.features.items.international.highlights,
      badge: messages.features.items.international.badge,
    },
    {
      category: messages.features.items.gamification.category,
      icon: GiftIcon,
      title: messages.features.items.gamification.title,
      description: messages.features.items.gamification.description,
      highlights: messages.features.items.gamification.highlights,
      badge: messages.features.items.gamification.badge,
    },
    {
      category: messages.features.items.affiliation.category,
      icon: UserGroupIcon,
      title: messages.features.items.affiliation.title,
      description: messages.features.items.affiliation.description,
      highlights: messages.features.items.affiliation.highlights,
      badge: messages.features.items.affiliation.badge,
    },
    {
      category: messages.features.items.analytics.category,
      icon: ChartBarIcon,
      title: messages.features.items.analytics.title,
      description: messages.features.items.analytics.description,
      highlights: messages.features.items.analytics.highlights,
      badge: messages.features.items.analytics.badge,
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {messages.features.title.split('MoonSkin')[0]}
            <span className="text-chrome-gradient">
              MoonSkin
            </span>
            {messages.features.title.split('MoonSkin')[1] || ''}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {messages.features.subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="lunar-card h-full weapon-card-hover">
                <CardContent className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-white/10 to-[#a8b8cc]/10 rounded-lg border border-[rgba(200,205,220,0.1)]">
                        <feature.icon className="w-6 h-6 text-[#a8b8cc]" />
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

                  {/* Description */}
                  <p className="text-muted-foreground mb-4 text-sm">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 bg-[#c0c0d0] rounded-full mr-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 lunar-card px-6 py-3 rounded-full">
            <ShieldCheckIcon className="w-5 h-5 text-[#a8b8cc]" />
            <span className="text-sm font-medium">
              {messages.features.trustIndicators}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
