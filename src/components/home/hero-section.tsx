'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { value: 15420, label: 'Utilisateurs actifs', prefix: '', suffix: '+' },
  { value: 2.4, label: 'Millions d\'€ traités', prefix: '€', suffix: 'M+' },
  { value: 8967, label: 'Trades réalisés', prefix: '', suffix: '+' },
  { value: 99.8, label: 'Taux de satisfaction', prefix: '', suffix: '%' },
];

const features = [
  {
    icon: ClockIcon,
    title: 'Estimation instantanée',
    description: 'Prix en temps réel via notre API Skinplace intégrée',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Paiements sécurisés',
    description: 'SEPA, crypto, et KYC obligatoire pour votre sécurité',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Frais transparents',
    description: 'Seulement 0,5% de frais de cashout, pas de frais cachés',
  },
];

const testimonials = [
  {
    name: 'ProGamer2024',
    rating: 5,
    comment: 'Super rapide, j\'ai reçu mon paiement en 2 jours !',
    amount: '1,234€',
  },
  {
    name: 'SkinMaster',
    rating: 5,
    comment: 'Interface très claire, processus simple et sécurisé.',
    amount: '987€',
  },
  {
    name: 'CSGOKing',
    rating: 5,
    comment: 'Meilleur site pour vendre ses skins, je recommande !',
    amount: '2,156€',
  },
];

export function HeroSection() {
  const { messages } = useLocale();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjU3MjIiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                Plateforme certifiée et sécurisée
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-3 sm:space-y-4"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Vendez vos skins{' '}
                <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  CS2
                </span>{' '}
                facilement
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                {messages.hero.subtitle}
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <feature.icon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature.title}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                <Link href={user ? '/sell' : '/login'}>
                  {user ? 'Vendre maintenant' : messages.hero.cta}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#how-it-works">
                  Comment ça marche
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-orange-600">
                    {stat.prefix}
                    <CountUp
                      end={stat.value}
                      duration={2}
                      delay={0.5}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative bg-card rounded-2xl border p-8 shadow-2xl">
              {/* Fake Trade Interface */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Estimation instantanée</h3>
                  <Badge variant="secondary" className="text-green-600">
                    En ligne
                  </Badge>
                </div>

                {/* Skin Items */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AK</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">AK-47 | Redline</p>
                      <p className="text-sm text-muted-foreground">Field-Tested</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">85.00€</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AWP</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">AWP | Dragon Lore</p>
                      <p className="text-sm text-muted-foreground">Factory New</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">1,250.00€</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total brut</span>
                    <span>1,335.00€</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais de cashout (0.5%)</span>
                    <span>-6.68€</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais réseau</span>
                    <span>-20.00€</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total net</span>
                    <span className="text-green-600">1,308.32€</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  Confirmer la vente
                </Button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Testimonial Cards */}
            <div className="absolute -bottom-6 -left-6 w-72 bg-card rounded-xl border p-4 shadow-lg hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">PG</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm font-medium">{testimonials[0].name}</p>
                  <p className="text-xs text-muted-foreground">{testimonials[0].comment}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{testimonials[0].amount}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
