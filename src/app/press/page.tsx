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
import { useLocale } from "@/components/providers/locale-provider";

const pressReleases = [
  {
    date: "2024-09-15",
    title: "MoonSkin lève 2M€ pour révolutionner le trading de skins CS2",
    description: "La startup française annonce une levée de fonds pour accélérer son développement international et renforcer sa sécurité.",
    category: "Financement",
    link: "/press/moonskin-leve-2m-euros",
  },
  {
    date: "2024-08-20",
    title: "Partenariat stratégique avec Skinplace pour l&apos;estimation des skins",
    description: "MoonSkin s&apos;associe à Skinplace pour offrir les estimations les plus précises du marché.",
    category: "Partenariat",
    link: "/press/partenariat-skinplace",
  },
  {
    date: "2024-07-10",
    title: "MoonSkin atteint 15 000 utilisateurs actifs",
    description: "La plateforme française de trading de skins franchit un nouveau cap avec plus de 2,4M€ de volume traité.",
    category: "Croissance",
    link: "/press/15k-utilisateurs",
  },
];

const getMediaKit = (messages: any) => [
  {
    title: messages.press.mediaKitItems.logos.title,
    description: messages.press.mediaKitItems.logos.description,
    icon: PhotoIcon,
    downloadLink: "/media-kit/logos.zip",
  },
  {
    title: messages.press.mediaKitItems.screenshots.title,
    description: messages.press.mediaKitItems.screenshots.description,
    icon: DocumentTextIcon,
    downloadLink: "/media-kit/screenshots.zip",
  },
  {
    title: messages.press.mediaKitItems.factsheet.title,
    description: messages.press.mediaKitItems.factsheet.description,
    icon: ChartBarIcon,
    downloadLink: "/media-kit/factsheet.pdf",
  },
];

const getStats = (messages: any) => [
  { label: messages.press.stats.activeUsers, value: "15,420+", icon: UserGroupIcon },
  { label: messages.press.stats.volumeProcessed, value: "€2.4M+", icon: TrophyIcon },
  { label: messages.press.stats.completedTrades, value: "8,967+", icon: ChartBarIcon },
  { label: messages.press.stats.satisfactionRate, value: "99.8%", icon: TrophyIcon },
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
  const { messages } = useLocale();
  const stats = getStats(messages);
  const mediaKit = getMediaKit(messages);
  
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
            {messages.press.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {messages.press.subtitle}
          </p>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {messages.press.lastUpdate} 15 septembre 2024
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
              <CardTitle>{messages.press.statsTitle}</CardTitle>
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
              <h2 className="text-2xl font-semibold mb-6">{messages.press.pressReleases}</h2>
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
                        {messages.press.readRelease}
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
                  <CardTitle>{messages.press.aboutTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {messages.press.aboutDescription1}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {messages.press.aboutDescription2}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="font-medium mb-2">{messages.press.sector}</h4>
                      <p className="text-sm text-muted-foreground">{messages.press.sectorValue}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{messages.press.founded}</h4>
                      <p className="text-sm text-muted-foreground">{messages.press.foundedValue}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{messages.press.employees}</h4>
                      <p className="text-sm text-muted-foreground">{messages.press.employeesValue}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{messages.press.funding}</h4>
                      <p className="text-sm text-muted-foreground">{messages.press.fundingValue}</p>
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
                  <CardTitle>{messages.press.mediaKit}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mediaKit.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <item.icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        <Button variant="outline" size="sm" className="text-xs">
                          {messages.press.download}
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
                  <CardTitle>{messages.press.managementTeam}</CardTitle>
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
                  <CardTitle>{messages.press.pressContact}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">Marie Dubois</h4>
                    <p className="text-sm text-muted-foreground">Responsable Communication</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span>press@moonskin.gg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>+33 1 23 45 67 89</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🕐</span>
                      <span>{messages.press.workingHours}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    {messages.press.contactPress}
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