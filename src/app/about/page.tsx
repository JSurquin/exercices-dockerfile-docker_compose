'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeEuropeAfricaIcon,
  ChartBarIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { label: 'Utilisateurs actifs', value: '15,420+', icon: UserGroupIcon },
  { label: 'Volume traité', value: '€2.4M+', icon: CurrencyDollarIcon },
  { label: 'Trades réalisés', value: '8,967+', icon: ChartBarIcon },
  { label: 'Pays supportés', value: '25+', icon: GlobeEuropeAfricaIcon },
];

const team = [
  {
    name: 'Alexandre Martin',
    role: 'CEO & Fondateur',
    bio: 'Ex-ingénieur Steam, passionné de CS depuis 2003. Vision : démocratiser le trading de skins.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    skills: ['Leadership', 'Trading', 'Blockchain'],
  },
  {
    name: 'Sophie Chen',
    role: 'CTO',
    bio: 'Experte sécurité blockchain, ex-Binance. Garantit la sécurité de chaque transaction.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612d451?w=150&h=150&fit=crop&crop=face',
    skills: ['Blockchain', 'Sécurité', 'Architecture'],
  },
  {
    name: 'Thomas Dubois',
    role: 'Head of Product',
    bio: 'Designer UX/UI passionné. Créateur des interfaces les plus intuitives du gaming.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    skills: ['UX/UI', 'Product', 'Gaming'],
  },
  {
    name: 'Marie Leroy',
    role: 'Head of Compliance',
    bio: 'Ex-juriste fintech, spécialiste réglementation européenne. Assure la conformité légale.',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    skills: ['Compliance', 'Legal', 'RGPD'],
  },
];

const values = [
  {
    icon: ShieldCheckIcon,
    title: 'Sécurité avant tout',
    description: 'Chaque transaction est protégée par les plus hauts standards de sécurité. KYC obligatoire, chiffrement SSL, et conformité européenne.',
  },
  {
    icon: HeartIcon,
    title: 'Communauté first',
    description: 'Notre communauté de gamers est au cœur de tout ce que nous faisons. Support 24/7, écoute active, et amélioration continue.',
  },
  {
    icon: LightBulbIcon,
    title: 'Innovation continue',
    description: 'Nous repoussons constamment les limites de ce qui est possible dans le trading de skins avec les dernières technologies.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Simplicité',
    description: 'Rendre le trading de skins accessible à tous, du débutant au trader expérimenté, avec une interface intuitive.',
  },
];

const timeline = [
  {
    year: '2023',
    title: 'Fondation de CashTrade',
    description: 'Lancement de la startup avec une vision claire : révolutionner le trading de skins CS.',
  },
  {
    year: '2024 Q1',
    title: 'Première version',
    description: 'Lancement de la plateforme MVP avec support SEPA et premiers 1000 utilisateurs.',
  },
  {
    year: '2024 Q2',
    title: 'Expansion crypto',
    description: 'Ajout du support Bitcoin, Ethereum et stablecoins. Partenariat avec Binance.',
  },
  {
    year: '2024 Q3',
    title: 'Gamification',
    description: 'Lancement du système XP, tickets et giveaways. Engagement utilisateur +300%.',
  },
  {
    year: '2024 Q4',
    title: 'International',
    description: 'Expansion européenne, support multilingue, conformité RGPD complète.',
  },
  {
    year: '2025',
    title: 'Vision future',
    description: 'Application mobile, API publique, support multi-jeux (Dota 2, TF2).',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              À propos de{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                CashTrade
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Nous révolutionnons la façon dont les joueurs de Counter-Strike 2 transforment leurs skins en argent réel. 
              Une plateforme sécurisée, transparente et innovante créée par des passionnés pour des passionnés.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8">Notre Mission</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg text-muted-foreground mb-6">
                  Fondée en 2023 par une équipe de développeurs et de traders passionnés, CashTrade est née d'un constat simple : 
                  le trading de skins CS était trop complexe, peu sécurisé et souvent opaque.
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  Notre mission est de créer la plateforme de référence pour convertir vos skins en argent réel, 
                  en alliant sécurité maximale, transparence totale et expérience utilisateur exceptionnelle.
                </p>
                <p className="text-lg text-muted-foreground">
                  Nous croyons que chaque joueur devrait pouvoir monétiser facilement ses items virtuels, 
                  sans compromis sur la sécurité ou la simplicité.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop"
                  alt="Team working"
                  className="rounded-2xl relative z-10"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Nos Valeurs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Les principes qui guident chacune de nos décisions et innovations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <value.icon className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                    <h3 className="font-semibold mb-3">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Notre Équipe</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des experts passionnés qui travaillent chaque jour pour améliorer votre expérience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-orange-600 mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {member.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Notre Histoire</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              De l'idée initiale aux perspectives d'avenir
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 md:transform md:-translate-x-px h-full w-0.5 bg-gradient-to-b from-orange-500 to-red-600" />
              
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 md:transform md:-translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full border-4 border-background" />
                  
                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}>
                    <Card>
                      <CardContent className="p-6">
                        <Badge variant="secondary" className="mb-2">{item.year}</Badge>
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-2xl p-12 border">
              <h2 className="text-3xl font-bold mb-4">Rejoignez l'aventure CashTrade</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Faites partie de la révolution du trading de skins CS2. 
                Une communauté de plus de 15,000 traders vous attend.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all">
                  Commencer à trader
                </button>
                <button className="px-8 py-3 border border-muted-foreground rounded-lg font-medium hover:bg-muted transition-colors">
                  Rejoindre Discord
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
