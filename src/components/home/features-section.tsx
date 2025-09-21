'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const features = [
  {
    category: 'Sécurité',
    icon: ShieldCheckIcon,
    title: 'Sécurité renforcée',
    description: 'KYC obligatoire, chiffrement SSL 256-bit, et conformité RGPD européenne.',
    highlights: ['KYC obligatoire', 'SSL 256-bit', 'Conformité RGPD'],
    badge: 'Certifié',
  },
  {
    category: 'Paiements',
    icon: BanknotesIcon,
    title: 'Paiements multiples',
    description: 'SEPA instantané, Bitcoin, Ethereum, USDT, et autres cryptomonnaies supportées.',
    highlights: ['SEPA instantané', 'Bitcoin, ETH, USDT', 'Paiements rapides'],
    badge: 'Populaire',
  },
  {
    category: 'Estimation',
    icon: CurrencyDollarIcon,
    title: 'Prix en temps réel',
    description: 'API Skinplace intégrée pour des estimations précises et mises à jour en continu.',
    highlights: ['API Skinplace', 'Temps réel', 'Estimation précise'],
    badge: 'Nouveau',
  },
  {
    category: 'Support',
    icon: ChatBubbleLeftRightIcon,
    title: 'Support 24/7',
    description: 'Équipe dédiée disponible 24h/24 et 7j/7 pour répondre à toutes vos questions.',
    highlights: ['24h/24 - 7j/7', 'Équipe dédiée', 'Réponse rapide'],
    badge: 'Premium',
  },
  {
    category: 'Rapidité',
    icon: ClockIcon,
    title: 'Processus rapide',
    description: 'Trade hold Steam de 7 jours puis paiement automatique immédiat.',
    highlights: ['7 jours Steam', 'Paiement auto', 'Processus optimisé'],
    badge: 'Efficace',
  },
  {
    category: 'International',
    icon: GlobeEuropeAfricaIcon,
    title: 'Support multilingue',
    description: 'Interface disponible en français, anglais, et chinois pour tous nos utilisateurs.',
    highlights: ['Français', 'English', '中文'],
    badge: 'Global',
  },
  {
    category: 'Gamification',
    icon: GiftIcon,
    title: 'Système XP & Tickets',
    description: 'Gagnez de l\'XP à chaque trade et des tickets pour participer aux giveaways.',
    highlights: ['XP par trade', 'Système de niveaux', 'Giveaways'],
    badge: 'Fun',
  },
  {
    category: 'Affiliation',
    icon: UserGroupIcon,
    title: 'Programme d\'affiliation',
    description: 'Gagnez 2% de commission sur chaque utilisateur que vous parrainez.',
    highlights: ['2% commission', 'Paiements mensuels', 'Suivi détaillé'],
    badge: 'Lucratif',
  },
  {
    category: 'Analytics',
    icon: ChartBarIcon,
    title: 'Dashboard complet',
    description: 'Suivez vos trades, vos gains, et vos statistiques avec des graphiques détaillés.',
    highlights: ['Graphiques détaillés', 'Historique complet', 'Export CSV'],
    badge: 'Pro',
  },
];

const badgeVariants = {
  'Certifié': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Populaire': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Nouveau': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Premium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Efficace': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Global': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Fun': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Lucratif': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'Pro': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

export function FeaturesSection() {
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
            Pourquoi choisir{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              CashTrade
            </span>{' '}
            ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une plateforme complète avec toutes les fonctionnalités dont vous avez besoin
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
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-lg">
                        <feature.icon className="w-6 h-6 text-orange-600" />
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
                      className={`text-xs ${badgeVariants[feature.badge as keyof typeof badgeVariants]}`}
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
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 flex-shrink-0" />
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
          <div className="inline-flex items-center space-x-2 bg-muted/50 px-6 py-3 rounded-full">
            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">
              Plus de 15,000 utilisateurs nous font confiance
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
