"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldExclamationIcon,
  EyeIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";

const riskFactors = [
  {
    category: "Facteurs géographiques",
    icon: FlagIcon,
    color: "text-red-600",
    factors: [
      "Pays sous sanctions internationales",
      "Juridictions à haut risque (liste GAFI)",
      "Paradis fiscaux non coopératifs",
      "Zones de conflit ou d'instabilité politique"
    ]
  },
  {
    category: "Comportements suspects",
    icon: EyeIcon,
    color: "text-orange-600",
    factors: [
      "Transactions inhabituellement importantes",
      "Fréquence anormale des opérations",
      "Utilisation de multiples comptes",
      "Refus de fournir des informations KYC"
    ]
  },
  {
    category: "Profils à risque",
    icon: UserGroupIcon,
    color: "text-yellow-600",
    factors: [
      "Personnes politiquement exposées (PPE)",
      "Activités dans des secteurs sensibles",
      "Historique de sanctions ou enquêtes",
      "Liens avec des entités sanctionnées"
    ]
  },
  {
    category: "Transactions suspectes",
    icon: BanknotesIcon,
    color: "text-purple-600",
    factors: [
      "Montants incohérents avec le profil",
      "Structuration pour éviter les seuils",
      "Origine des fonds non justifiée",
      "Destination finale inconnue"
    ]
  }
];

const monitoringMeasures = [
  {
    title: "Surveillance en temps réel",
    description: "Monitoring automatisé de toutes les transactions",
    features: [
      "Algorithmes de détection d'anomalies",
      "Alertes automatiques sur seuils",
      "Analyse comportementale avancée",
      "Corrélation avec bases de données externes"
    ],
    icon: EyeIcon,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
  },
  {
    title: "Contrôles renforcés",
    description: "Vérifications approfondies pour les cas sensibles",
    features: [
      "Due diligence renforcée (EDD)",
      "Vérification source des fonds",
      "Contrôle des listes de sanctions",
      "Validation manuelle par experts"
    ],
    icon: DocumentMagnifyingGlassIcon,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
  },
  {
    title: "Reporting réglementaire",
    description: "Déclarations aux autorités compétentes",
    features: [
      "Déclarations TRACFIN automatiques",
      "Rapports périodiques à l'ACPR",
      "Conservation des preuves 5 ans",
      "Coopération avec les enquêtes"
    ],
    icon: FlagIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
  }
];

const prohibitedActivities = [
  {
    activity: "Blanchiment d'argent",
    description: "Conversion d'argent d'origine illicite en fonds apparemment légaux",
    examples: [
      "Utilisation de skins pour blanchir des cryptomonnaies",
      "Transactions multiples pour masquer l'origine",
      "Collaboration avec des réseaux criminels"
    ],
    sanctions: "Jusqu'à 5 ans de prison et 375 000€ d'amende"
  },
  {
    activity: "Financement du terrorisme",
    description: "Fourniture de fonds ou ressources à des organisations terroristes",
    examples: [
      "Transferts vers des entités sanctionnées",
      "Collecte de fonds pour activités terroristes",
      "Soutien logistique à des groupes interdits"
    ],
    sanctions: "Jusqu'à 10 ans de prison et 750 000€ d'amende"
  },
  {
    activity: "Contournement de sanctions",
    description: "Évitement des mesures restrictives internationales",
    examples: [
      "Transactions avec des pays sanctionnés",
      "Utilisation de prête-noms pour masquer l'identité",
      "Contournement des embargos économiques"
    ],
    sanctions: "Sanctions administratives et pénales selon le cas"
  }
];

const reportingProcess = [
  {
    step: 1,
    title: "Détection automatique",
    description: "Nos systèmes identifient automatiquement les transactions suspectes",
    timeframe: "Temps réel",
    icon: EyeIcon
  },
  {
    step: 2,
    title: "Analyse manuelle",
    description: "Notre équipe compliance examine chaque alerte",
    timeframe: "< 2 heures",
    icon: DocumentMagnifyingGlassIcon
  },
  {
    step: 3,
    title: "Décision de signalement",
    description: "Évaluation du niveau de risque et nécessité de déclaration",
    timeframe: "< 24 heures",
    icon: CheckCircleIcon
  },
  {
    step: 4,
    title: "Déclaration TRACFIN",
    description: "Transmission sécurisée aux autorités si nécessaire",
    timeframe: "Immédiat",
    icon: FlagIcon
  }
];

const userObligations = [
  {
    obligation: "Fourniture d'informations exactes",
    description: "Vous devez fournir des informations véridiques lors de votre inscription et les maintenir à jour.",
    consequences: "Suspension de compte en cas de fausses déclarations"
  },
  {
    obligation: "Justification de l'origine des fonds",
    description: "Vous devez pouvoir justifier la provenance légale de vos skins et cryptomonnaies.",
    consequences: "Blocage des transactions jusqu'à justification"
  },
  {
    obligation: "Signalement d'activités suspectes",
    description: "Vous devez nous signaler toute tentative d'utilisation frauduleuse de votre compte.",
    consequences: "Responsabilité partagée en cas de non-signalement"
  },
  {
    obligation: "Respect des sanctions internationales",
    description: "Vous ne devez pas utiliser nos services pour contourner des sanctions ou embargos.",
    consequences: "Fermeture immédiate du compte et signalement"
  }
];

export default function AmlPolicyPage() {
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
            <ShieldExclamationIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Politique Anti-Blanchiment (AML)
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Notre engagement dans la lutte contre le blanchiment d'argent et le financement du terrorisme
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Tolérance zéro
            </Badge>
            <Badge variant="outline">
              Conforme directive UE 2018/843
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
              <h2 className="text-2xl font-semibold mb-4">Notre engagement</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    CashTrade applique une politique de tolérance zéro envers le blanchiment d'argent, 
                    le financement du terrorisme et toute activité illicite. Nous mettons en œuvre des 
                    mesures strictes conformes aux réglementations européennes et françaises.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Notre approche repose sur la prévention, la détection et le signalement de toute 
                    activité suspecte, en collaboration étroite avec les autorités compétentes.
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold mb-3 flex items-center space-x-2 text-red-800 dark:text-red-200">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>Avertissement important</span>
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Toute tentative de blanchiment d'argent ou de financement d'activités illicites 
                    entraînera la fermeture immédiate du compte, la saisie des fonds et le signalement 
                    aux autorités judiciaires et financières.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Factors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Facteurs de risque surveillés</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {riskFactors.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <category.icon className={`w-5 h-5 ${category.color}`} />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.factors.map((factor, factorIndex) => (
                      <li key={factorIndex} className="flex items-start space-x-2 text-sm">
                        <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Monitoring Measures */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Mesures de surveillance</h2>
          <div className="grid gap-6">
            {monitoringMeasures.map((measure, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${measure.color} flex items-center justify-center`}>
                      <measure.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3>{measure.title}</h3>
                      <p className="text-sm text-muted-foreground font-normal">{measure.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {measure.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Prohibited Activities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Activités interdites</h2>
              <div className="space-y-6">
                {prohibitedActivities.map((activity, index) => (
                  <Card key={index} className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-red-800 dark:text-red-200">
                        {activity.activity}
                      </CardTitle>
                      <p className="text-muted-foreground">{activity.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Exemples d'activités concernées :</h4>
                          <ul className="space-y-1">
                            {activity.examples.map((example, exampleIndex) => (
                              <li key={exampleIndex} className="flex items-start space-x-2 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                          <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Sanctions encourues :</h4>
                          <p className="text-sm text-red-700 dark:text-red-300">{activity.sanctions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Reporting Process */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Processus de signalement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportingProcess.map((step, index) => (
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
                              {step.timeframe}
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
            {/* User Obligations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Vos obligations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userObligations.map((obligation, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium text-sm">{obligation.obligation}</h4>
                      <p className="text-xs text-muted-foreground">{obligation.description}</p>
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded p-2 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          <strong>Conséquences :</strong> {obligation.consequences}
                        </p>
                      </div>
                      {index < userObligations.length - 1 && <hr />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Regulatory Framework */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Cadre réglementaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div>
                      <h4 className="font-medium">Directive européenne</h4>
                      <p className="text-muted-foreground text-xs">5ème directive anti-blanchiment (UE) 2018/843</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Code monétaire français</h4>
                      <p className="text-muted-foreground text-xs">Articles L561-1 à L561-55</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Autorité de contrôle</h4>
                      <p className="text-muted-foreground text-xs">ACPR - Banque de France</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Cellule de renseignement</h4>
                      <p className="text-muted-foreground text-xs">TRACFIN - Ministère des Finances</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Signaler une activité suspecte</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contactez immédiatement notre équipe compliance.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      🚨 compliance@cashtrade.gg
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      📞 +33 1 23 45 67 89
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Ligne d'urgence 24/7 - Confidentialité garantie
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