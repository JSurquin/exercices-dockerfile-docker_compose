"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  EyeIcon,
  UserCircleIcon,
  DocumentTextIcon,
  LockClosedIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const dataTypes = [
  {
    category: "Données d'identification",
    icon: UserCircleIcon,
    data: [
      "Nom et prénom",
      "Date de naissance",
      "Adresse email",
      "Steam ID",
      "Adresse IP",
    ],
    purpose: "Authentification et vérification d&apos;identité (KYC)",
    retention: "5 ans après fermeture du compte",
  },
  {
    category: "Données KYC",
    icon: DocumentTextIcon,
    data: [
      "Pièce d&apos;identité",
      "Selfie de vérification",
      "Justificatif de domicile",
    ],
    purpose: "Conformité réglementaire anti-blanchiment",
    retention: "10 ans (obligation légale)",
  },
  {
    category: "Données financières",
    icon: LockClosedIcon,
    data: ["IBAN (haché)", "Adresses crypto", "Historique transactions"],
    purpose: "Traitement des paiements et audit",
    retention: "7 ans (obligation comptable)",
  },
  {
    category: "Données d'usage",
    icon: EyeIcon,
    data: [
      "Logs de connexion",
      "Activité de trading",
      "Préférences utilisateur",
    ],
    purpose: "Amélioration du service et sécurité",
    retention: "2 ans maximum",
  },
];

const rights = [
  {
    title: "Droit d'accès",
    description: "Demander une copie de toutes vos données personnelles",
    icon: EyeIcon,
    action: "Télécharger mes données",
  },
  {
    title: "Droit de rectification",
    description: "Corriger ou mettre à jour vos informations personnelles",
    icon: DocumentTextIcon,
    action: "Modifier mes données",
  },
  {
    title: "Droit à l&apos;effacement",
    description: "Supprimer vos données (sauf obligations légales)",
    icon: TrashIcon,
    action: "Supprimer mon compte",
  },
  {
    title: "Droit à la portabilité",
    description: "Récupérer vos données dans un format lisible",
    icon: ArrowDownTrayIcon,
    action: "Exporter mes données",
  },
];

export default function PrivacyPage() {
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
            <ShieldCheckIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Politique de confidentialité
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Comment nous collectons, utilisons et protégeons vos données
            personnelles
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Conforme RGPD
            </Badge>
            <span>Dernière mise à jour : 21 septembre 2024</span>
          </div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Notre engagement</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chez CashTrade, la protection de vos données personnelles est
                notre priorité absolue. Cette politique explique comment nous
                collectons, utilisons, stockons et protégeons vos informations
                en conformité avec le Règlement Général sur la Protection des
                Données (RGPD) et les lois françaises.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Nous appliquons le principe de minimisation des données : nous
                ne collectons que les informations strictement nécessaires au
                fonctionnement de notre service et à nos obligations légales.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Types de données */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">
            Types de données collectées
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {dataTypes.map((type, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <type.icon className="w-5 h-5 text-orange-600" />
                    <span>{type.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Données collectées :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.data.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Finalité :</h4>
                    <p className="text-sm text-muted-foreground">
                      {type.purpose}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Conservation :</h4>
                    <Badge variant="outline" className="text-xs">
                      {type.retention}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Base légale */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Base légale du traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Contrat</h4>
                  <p className="text-sm text-muted-foreground">
                    Exécution de nos services de trading et paiement
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Obligation légale</h4>
                  <p className="text-sm text-muted-foreground">
                    Conformité KYC, lutte anti-blanchiment, obligations fiscales
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <UserCircleIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium mb-2">Intérêt légitime</h4>
                  <p className="text-sm text-muted-foreground">
                    Sécurité, prévention fraude, amélioration du service
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vos droits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Vos droits RGPD</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {rights.map((right, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <right.icon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{right.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {right.description}
                      </p>
                      <Button variant="outline" size="sm">
                        {right.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Sécurité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LockClosedIcon className="w-5 h-5" />
                <span>Sécurité des données</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité strictes pour
                protéger vos données :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Mesures techniques :</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Chiffrement SSL/TLS 256-bit</li>
                    <li>• Chiffrement des données sensibles en base</li>
                    <li>• Authentification à deux facteurs</li>
                    <li>• Surveillance 24/7 des accès</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Mesures organisationnelles :</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Accès limité aux données (need-to-know)</li>
                    <li>• Formation sécurité des employés</li>
                    <li>• Audits de sécurité réguliers</li>
                    <li>• Plan de réponse aux incidents</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Partage des données */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Partage des données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nous ne vendons jamais vos données personnelles. Nous pouvons
                les partager uniquement dans les cas suivants :
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">Prestataires de services</h4>
                  <p className="text-sm text-muted-foreground">
                    Qonto (paiements SEPA), prestataire KYC, hébergeur cloud -
                    sous contrat de confidentialité strict
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">Obligations légales</h4>
                  <p className="text-sm text-muted-foreground">
                    Autorités fiscales, TRACFIN (lutte anti-blanchiment),
                    autorités judiciaires sur réquisition
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">Votre consentement</h4>
                  <p className="text-sm text-muted-foreground">
                    Avec votre accord explicite pour des services additionnels
                    (partenariats, etc.)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact DPO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">
                Contact Délégué à la Protection des Données
              </h3>
              <p className="text-muted-foreground mb-6">
                Pour toute question concernant vos données personnelles ou pour
                exercer vos droits, contactez notre DPO.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Badge variant="outline" className="px-4 py-2">
                  📧 dpo@cashtrade.gg
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  📮 CashTrade - DPO, 123 Rue de la Tech, 75001 Paris
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Vous avez également le droit de déposer une plainte auprès de la
                CNIL en cas de manquement.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
