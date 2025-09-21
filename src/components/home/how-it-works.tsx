'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LinkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const steps = [
  {
    step: 1,
    icon: LinkIcon,
    title: 'Ajoutez votre Trade Link',
    description: 'Connectez-vous avec Steam et ajoutez votre lien de trade sécurisé.',
    details: ['Connexion Steam OpenID', 'Validation automatique du lien', 'Sécurité maximale'],
  },
  {
    step: 2,
    icon: CurrencyDollarIcon,
    title: 'Estimation instantanée',
    description: 'Notre IA analyse vos skins et vous donne le prix en temps réel.',
    details: ['Prix basés sur Skinplace API', 'Mise à jour en temps réel', 'Estimation précise'],
  },
  {
    step: 3,
    icon: ShieldCheckIcon,
    title: 'Vérification KYC',
    description: 'Vérifiez votre identité pour sécuriser les paiements.',
    details: ['Processus rapide et simple', 'Documents sécurisés', 'Conformité légale'],
  },
  {
    step: 4,
    icon: ClockIcon,
    title: 'Trade Hold Steam (7j)',
    description: 'Période de sécurité Steam obligatoire de 7 jours.',
    details: ['Sécurité Steam', 'Suivi en temps réel', 'Notifications automatiques'],
  },
  {
    step: 5,
    icon: BanknotesIcon,
    title: 'Paiement automatique',
    description: 'Recevez votre argent via SEPA ou crypto après la période.',
    details: ['Paiement SEPA rapide', 'Support crypto multiple', 'Frais transparents'],
  },
];

const benefits = [
  {
    icon: CheckCircleIcon,
    title: 'Processus entièrement automatisé',
    description: 'Du trade à la réception de l\'argent, tout est automatique.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Sécurité maximale',
    description: 'KYC obligatoire, chiffrement SSL, et conformité européenne.',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Frais transparents',
    description: 'Seulement 0,5% de frais de cashout, pas de frais cachés.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un processus simple et sécurisé pour vendre vos skins CS2 en quelques étapes
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  {/* Step Number */}
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <step.icon className="w-8 h-8 mx-auto text-orange-600" />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center justify-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-orange-500 to-red-600 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-orange-600 border-t-2 border-b-2 border-t-transparent border-b-transparent" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="mb-4">
                <benefit.icon className="w-12 h-12 mx-auto text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-2xl p-8 border">
            <h3 className="text-2xl font-bold mb-4">Prêt à commencer ?</h3>
            <p className="text-muted-foreground mb-6">
              Rejoignez des milliers d'utilisateurs qui ont déjà vendu leurs skins en toute sécurité
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                Commencer maintenant
              </Button>
              <Button variant="outline" size="lg">
                Voir nos tarifs
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
