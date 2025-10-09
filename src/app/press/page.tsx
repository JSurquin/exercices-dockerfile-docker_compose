"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NewspaperIcon,
  DocumentTextIcon,
  PhotoIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const pressReleases = [
  {
    date: "2024-09-15",
    title: "CashTrade lève 2M€ pour révolutionner le trading de skins CS2",
    description: "La startup française annonce une levée de fonds pour accélérer son développement international et renforcer sa sécurité.",
    category: "Financement",
    link: "/press/cashtrade-leve-2m-euros",
  },
  {
    date: "2024-08-20",
    title: "Partenariat stratégique avec Skinplace pour l&apos;estimation des skins",
    description: "CashTrade s&apos;associe à Skinplace pour offrir les estimations les plus précises du marché.",
    category: "Partenariat",
    link: "/press/partenariat-skinplace",
  },
  {
    date: "2024-07-10",
    title: "CashTrade atteint 15 000 utilisateurs actifs",
    description: "La plateforme française de trading de skins franchit un nouveau cap avec plus de 2,4M€ de volume traité.",
    category: "Croissance",
    link: "/press/15k-utilisateurs",
  },
];

const mediaKit = [
  {
    title: "Logo & Identité visuelle",
    description: "Logos haute résolution, couleurs officielles, guidelines",
    icon: PhotoIcon,
    downloadLink: "/media-kit/logos.zip",
  },
  {
    title: "Screenshots & Captures",
    description: "Interface utilisateur, fonctionnalités, dashboard",
    icon: DocumentTextIcon,
    downloadLink: "/media-kit/screenshots.zip",
  },
  {
    title: "Fact Sheet",
    description: "Données clés, statistiques, informations entreprise",
    icon: ChartBarIcon,
    downloadLink: "/media-kit/factsheet.pdf",
  },
];

const stats = [
  { label: "Utilisateurs actifs", value: "15,420+", icon: UserGroupIcon },
  { label: "Volume traité", value: "€2.4M+", icon: TrophyIcon },
  { label: "Trades complétés", value: "8,967+", icon: ChartBarIcon },
  { label: "Taux de satisfaction", value: "99.8%", icon: TrophyIcon },
];

const teamMembers = [
  {
    name: "Alexandre Dubois",
    role: "CEO & Co-fondateur",
    bio: "Ex-développeur chez Ubisoft, passionné d&apos;esport depuis 10 ans",
    image: "/team/alexandre.jpg",
  },
  {
    name: "Marie Laurent",
    role: "CTO & Co-fondatrice", 
    bio: "Ancienne ingénieure blockchain chez Ledger, experte en sécurité",
    image: "/team/marie.jpg",
  },
  {
    name: "Thomas Martin",
    role: "Head of Business Development",
    bio: "15 ans d&apos;expérience dans l&apos;industrie du gaming et de l&apos;esport",
    image: "/team/thomas.jpg",
  },
];

export default function PressPage() {
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
            <NewspaperIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Espace Presse
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Ressources médias, communiqués de presse et informations sur CashTrade
          </p>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Dernière mise à jour : 15 septembre 2024
          </Badge>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>CashTrade en chiffres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Press Releases */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Communiqués de presse</h2>
              <div className="space-y-4">
                {pressReleases.map((release, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline">{release.category}</Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(release.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{release.title}</h3>
                      <p className="text-muted-foreground mb-4">{release.description}</p>
                      <Button variant="outline" size="sm">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Lire le communiqué
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>À propos de CashTrade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    CashTrade est la première plateforme française dédiée au trading sécurisé de skins Counter-Strike 2. 
                    Fondée en 2024, l&apos;entreprise révolutionne l&apos;écosystème du gaming en permettant aux joueurs de 
                    monétiser facilement leurs inventaires virtuels.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Grâce à des partenariats stratégiques avec Skinplace pour l&apos;estimation et Qonto pour les paiements SEPA, 
                    CashTrade garantit transparence, sécurité et conformité réglementaire. La plateforme respecte 
                    scrupuleusement les obligations KYC et anti-blanchiment.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="font-medium mb-2">Secteur d&apos;activité</h4>
                      <p className="text-sm text-muted-foreground">Gaming, Fintech, Esport</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Fondation</h4>
                      <p className="text-sm text-muted-foreground">2024, Paris, France</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Employés</h4>
                      <p className="text-sm text-muted-foreground">12 personnes</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Financement</h4>
                      <p className="text-sm text-muted-foreground">2M€ (Série A)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Media Kit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Kit Média</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mediaKit.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <item.icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        <Button variant="outline" size="sm" className="text-xs">
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Équipe dirigeante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="space-y-2">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-orange-600">{member.role}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.bio}</p>
                      {index < teamMembers.length - 1 && <hr className="my-3" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Press */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>Contact Presse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">Marie Dubois</h4>
                    <p className="text-sm text-muted-foreground">Responsable Communication</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span>press@cashtrade.gg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>+33 1 23 45 67 89</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🕐</span>
                      <span>Lun-Ven 9h-18h</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    Contacter la presse
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}