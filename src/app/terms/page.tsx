'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptation des conditions',
    content: `En utilisant CashTrade, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.

Ces conditions peuvent être modifiées à tout moment. Les modifications entreront en vigueur dès leur publication sur notre site. Il est de votre responsabilité de consulter régulièrement ces conditions.`,
  },
  {
    id: 'eligibility',
    title: '2. Conditions d\'éligibilité',
    content: `Pour utiliser CashTrade, vous devez :
• Être âgé d'au moins 18 ans
• Avoir la capacité juridique de conclure des contrats
• Résider dans un pays où nos services sont légalement disponibles
• Posséder un compte Steam en règle
• Compléter avec succès notre processus KYC (Know Your Customer)

Nous nous réservons le droit de refuser ou de suspendre l'accès à tout utilisateur ne respectant pas ces critères.`,
  },
  {
    id: 'services',
    title: '3. Description des services',
    content: `CashTrade fournit une plateforme permettant de :
• Vendre des skins Counter-Strike 2 contre de l'argent réel
• Recevoir des paiements via SEPA ou cryptomonnaies
• Participer à des giveaways et concours
• Accéder à des statistiques de trading

Nos services sont fournis "en l'état" et nous ne garantissons pas leur disponibilité ininterrompue.`,
  },
  {
    id: 'trading',
    title: '4. Processus de trading',
    content: `Le processus de vente comprend :
• Connexion Steam et ajout du Trade Link
• Estimation automatique des skins via API Skinplace
• Acceptation des conditions de vente
• Trade automatique avec notre bot
• Période de trade hold Steam (7 jours obligatoires)
• Paiement automatique après validation

Les prix sont indicatifs et peuvent varier selon les conditions de marché. Une fois le trade accepté sur Steam, la vente est définitive.`,
  },
  {
    id: 'payments',
    title: '5. Paiements et frais',
    content: `Frais applicables :
• Frais de cashout : 0,5% du montant brut
• Frais de réseau variables selon la méthode de paiement
• Aucun frais caché

Délais de paiement :
• SEPA : 24-48h ouvrées après trade hold
• Crypto : Quelques heures après trade hold

Tous les montants sont calculés en centimes pour éviter les erreurs d'arrondi.`,
  },
  {
    id: 'kyc',
    title: '6. Vérification KYC',
    content: `La vérification KYC est obligatoire pour :
• Effectuer tout paiement
• Respecter la réglementation anti-blanchiment
• Assurer la sécurité de la plateforme

Documents requis :
• Pièce d'identité valide (carte d'identité, passeport)
• Selfie de vérification
• Justificatif de domicile (optionnel)

Vos documents sont traités par un prestataire certifié et nous ne conservons que les références de vérification.`,
  },
  {
    id: 'security',
    title: '7. Sécurité et protection',
    content: `Nous mettons en place :
• Chiffrement SSL 256-bit pour toutes les communications
• Authentification à deux facteurs recommandée
• Surveillance anti-fraude 24/7
• Conformité aux standards de sécurité bancaires

L'utilisateur s'engage à :
• Protéger ses identifiants de connexion
• Signaler immédiatement toute activité suspecte
• Ne pas partager son compte avec des tiers`,
  },
  {
    id: 'restrictions',
    title: '8. Utilisations interdites',
    content: `Il est strictement interdit de :
• Utiliser la plateforme pour blanchir de l'argent
• Créer plusieurs comptes pour contourner les limites
• Utiliser des bots ou scripts automatisés
• Tenter de manipuler les prix ou le système
• Violer les conditions d'utilisation de Steam
• Effectuer des activités frauduleuses

Toute violation peut entraîner la suspension immédiate du compte.`,
  },
  {
    id: 'liability',
    title: '9. Limitation de responsabilité',
    content: `CashTrade ne peut être tenu responsable :
• Des fluctuations de prix des skins
• Des interruptions de service temporaires
• Des décisions de Steam concernant les trades
• Des pertes indirectes ou consécutives
• Des erreurs d'estimation dues aux conditions de marché

Notre responsabilité est limitée au montant des frais payés pour le service concerné.`,
  },
  {
    id: 'data',
    title: '10. Protection des données',
    content: `Conformément au RGPD, vous avez le droit de :
• Accéder à vos données personnelles
• Demander leur rectification ou suppression
• Vous opposer à leur traitement
• Demander la portabilité de vos données

Nous conservons vos données uniquement le temps nécessaire aux obligations légales et réglementaires.`,
  },
  {
    id: 'termination',
    title: '11. Résiliation',
    content: `Vous pouvez résilier votre compte à tout moment via les paramètres.

Nous pouvons suspendre ou résilier votre compte en cas de :
• Violation des présentes conditions
• Activité frauduleuse ou suspecte
• Non-respect des exigences KYC
• Demande des autorités compétentes

En cas de résiliation, les trades en cours seront finalisés selon les conditions acceptées.`,
  },
  {
    id: 'governing',
    title: '12. Droit applicable',
    content: `Ces conditions sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux de Paris.

En cas de litige, nous encourageons la résolution amiable via notre service client avant toute action judiciaire.`,
  },
];

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <DocumentTextIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Conditions d'utilisation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Conditions générales d'utilisation de la plateforme CashTrade
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Dernière mise à jour : 21 septembre 2024</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Version 1.2</span>
            </div>
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Information importante
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 text-sm leading-relaxed">
                    Ces conditions d'utilisation constituent un contrat légalement contraignant entre vous et CashTrade. 
                    En utilisant nos services, vous acceptez d'être lié par l'ensemble de ces conditions. 
                    Veuillez les lire attentivement avant d'utiliser notre plateforme.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Table des matières</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block p-2 rounded hover:bg-muted transition-colors text-sm"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 leading-relaxed whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Questions sur ces conditions ?</h3>
              <p className="text-muted-foreground mb-6">
                Notre équipe légale est disponible pour répondre à toutes vos questions
                concernant ces conditions d'utilisation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Badge variant="outline" className="px-4 py-2">
                  📧 legal@cashtrade.gg
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  📞 +33 1 23 45 67 89
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  💬 Support 24/7
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
