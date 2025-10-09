"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const kycLevels = [
  {
    level: "Niveau 1 - Basique",
    description: "Vérification d&apos;identité de base",
    requirements: [
      "Pièce d&apos;identité valide (CNI, passeport)",
      "Selfie de vérification",
      "Confirmation d&apos;email et téléphone"
    ],
    limits: {
      daily: "500€",
      monthly: "2,000€"
    },
    processingTime: "2-24 heures",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircleIcon,
  },
  {
    level: "Niveau 2 - Avancé", 
    description: "Vérification d&apos;adresse et revenus",
    requirements: [
      "Tous les documents du Niveau 1",
      "Justificatif de domicile (< 3 mois)",
      "Déclaration de revenus ou fiche de paie"
    ],
    limits: {
      daily: "5,000€",
      monthly: "20,000€"
    },
    processingTime: "24-72 heures",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: ShieldCheckIcon,
  },
  {
    level: "Niveau 3 - Premium",
    description: "Vérification complète pour gros volumes",
    requirements: [
      "Tous les documents des niveaux précédents",
      "Entretien vidéo avec notre équipe",
      "Vérification source de fonds"
    ],
    limits: {
      daily: "Illimité",
      monthly: "Illimité"
    },
    processingTime: "3-7 jours",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: UserCircleIcon,
  },
];

const documents = [
  {
    category: "Pièces d&apos;identité acceptées",
    icon: DocumentTextIcon,
    items: [
      "Carte nationale d&apos;identité française",
      "Passeport français ou européen",
      "Permis de conduire français",
      "Titre de séjour (pour les résidents)"
    ],
    requirements: [
      "Document en cours de validité",
      "Photo lisible et non floue",
      "Toutes les informations visibles",
      "Format JPEG, PNG ou PDF (max 10MB)"
    ]
  },
  {
    category: "Justificatifs de domicile",
    icon: LockClosedIcon,
    items: [
      "Facture d&apos;électricité, gaz ou eau",
      "Facture de téléphone fixe ou internet",
      "Relevé bancaire",
      "Attestation d&apos;assurance habitation",
      "Quittance de loyer"
    ],
    requirements: [
      "Document daté de moins de 3 mois",
      "Nom et adresse clairement visibles",
      "Correspondance avec l&apos;identité fournie",
      "Document original (non modifié)"
    ]
  }
];

const processSteps = [
  {
    step: 1,
    title: "Soumission des documents",
    description: "Téléchargez vos documents via votre espace personnel",
    duration: "5 minutes",
    icon: DocumentTextIcon,
  },
  {
    step: 2,
    title: "Vérification automatique",
    description: "Notre système IA vérifie l&apos;authenticité des documents",
    duration: "Instantané",
    icon: EyeIcon,
  },
  {
    step: 3,
    title: "Contrôle manuel",
    description: "Notre équipe valide manuellement votre dossier",
    duration: "2-24h",
    icon: UserCircleIcon,
  },
  {
    step: 4,
    title: "Validation finale",
    description: "Votre compte est activé et les limites appliquées",
    duration: "Immédiat",
    icon: CheckCircleIcon,
  },
];

const dataProtection = [
  {
    title: "Chiffrement de bout en bout",
    description: "Tous vos documents sont chiffrés avec AES-256",
    icon: LockClosedIcon,
  },
  {
    title: "Stockage sécurisé",
    description: "Hébergement en France, conforme RGPD",
    icon: ShieldCheckIcon,
  },
  {
    title: "Accès restreint",
    description: "Seule l&apos;équipe KYC peut consulter vos documents",
    icon: EyeIcon,
  },
  {
    title: "Suppression automatique",
    description: "Documents supprimés après validation (sauf obligations légales)",
    icon: ClockIcon,
  },
];

export default function KycPolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <ShieldCheckIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Politique KYC
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Processus de vérification d&apos;identité conforme aux réglementations européennes
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Conforme RGPD
            </Badge>
            <Badge variant="outline">
              Dernière mise à jour : 21 septembre 2024
            </Badge>
          </div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold mb-4">Pourquoi le KYC ?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Le processus KYC (Know Your Customer) est une obligation légale pour tous les 
                    prestataires de services financiers. Il nous permet de :
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Lutter contre le blanchiment d&apos;argent</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Prévenir le financement du terrorisme</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Protéger nos utilisateurs contre la fraude</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Respecter les réglementations ACPR et AMF</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                    <span>Important à savoir</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• La vérification KYC est obligatoire avant tout paiement</li>
                    <li>• Vos documents sont traités de manière confidentielle</li>
                    <li>• Le processus est généralement finalisé en 24h</li>
                    <li>• Aucun paiement n&apos;est effectué sans validation KYC</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KYC Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Niveaux de vérification</h2>
          <div className="grid gap-6">
            {kycLevels.map((level, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <level.icon className="w-6 h-6 text-orange-600" />
                      <span>{level.level}</span>
                    </CardTitle>
                    <Badge className={level.color}>
                      {level.processingTime}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{level.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Documents requis :</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {level.requirements.map((req, reqIndex) => (
                          <li key={reqIndex} className="flex items-start space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Limites de paiement :</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quotidien :</span>
                          <span className="font-medium">{level.limits.daily}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mensuel :</span>
                          <span className="font-medium">{level.limits.monthly}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button className="w-full">
                        Commencer la vérification
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Documents */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Documents acceptés</h2>
              <div className="space-y-6">
                {documents.map((docCategory, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <docCategory.icon className="w-5 h-5 text-orange-600" />
                        <span>{docCategory.category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Types acceptés :</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {docCategory.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Exigences :</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {docCategory.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-start space-x-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Process Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Processus de vérification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {processSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">{step.step}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{step.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        <step.icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Protection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LockClosedIcon className="w-5 h-5" />
                    <span>Protection des données</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataProtection.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <item.icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQ Quick */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Questions fréquentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Combien de temps prend la vérification ?</h4>
                      <p className="text-muted-foreground">Entre 2 et 24 heures pour le niveau 1, jusqu&apos;à 72h pour les niveaux supérieurs.</p>
                    </div>
                    <hr />
                    <div>
                      <h4 className="font-medium mb-1">Mes documents sont-ils sécurisés ?</h4>
                      <p className="text-muted-foreground">Oui, ils sont chiffrés et stockés conformément au RGPD. Suppression après validation.</p>
                    </div>
                    <hr />
                    <div>
                      <h4 className="font-medium mb-1">Puis-je trader sans KYC ?</h4>
                      <p className="text-muted-foreground">Non, la vérification KYC est obligatoire avant tout paiement selon la réglementation.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Besoin d&apos;aide ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Notre équipe KYC est disponible pour vous accompagner.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      📧 kyc@cashtrade.gg
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      💬 Chat support
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Réponse sous 2h en moyenne
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}