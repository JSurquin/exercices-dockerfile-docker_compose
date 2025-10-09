"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const categories = [
  {
    title: "Premiers pas",
    icon: CheckCircleIcon,
    color: "text-green-600",
    articles: [
      { title: "Comment créer un compte ?", views: "2.3k", helpful: 95 },
      { title: "Connexion Steam et Trade Link", views: "1.8k", helpful: 92 },
      { title: "Vérification KYC étape par étape", views: "1.5k", helpful: 89 },
      { title: "Premier trade : guide complet", views: "2.1k", helpful: 96 },
    ]
  },
  {
    title: "Trading & Ventes",
    icon: CurrencyEuroIcon,
    color: "text-orange-600",
    articles: [
      { title: "Comment vendre mes skins CS2 ?", views: "3.2k", helpful: 94 },
      { title: "Estimation des prix : comment ça marche ?", views: "1.9k", helpful: 88 },
      { title: "Qu&apos;est-ce que le trade hold Steam ?", views: "2.7k", helpful: 91 },
      { title: "Frais de transaction et calculs", views: "1.4k", helpful: 87 },
    ]
  },
  {
    title: "Paiements",
    icon: ShieldCheckIcon,
    color: "text-blue-600",
    articles: [
      { title: "Méthodes de paiement disponibles", views: "2.8k", helpful: 93 },
      { title: "Délais de paiement SEPA vs Crypto", views: "2.1k", helpful: 90 },
      { title: "Vérification IBAN et sécurité", views: "1.7k", helpful: 85 },
      { title: "Problème de paiement : que faire ?", views: "1.2k", helpful: 82 },
    ]
  },
  {
    title: "Sécurité & Compte",
    icon: ExclamationTriangleIcon,
    color: "text-red-600",
    articles: [
      { title: "Sécuriser mon compte CashTrade", views: "1.9k", helpful: 97 },
      { title: "Que faire si mon compte est suspendu ?", views: "0.8k", helpful: 79 },
      { title: "Signaler une activité suspecte", views: "0.6k", helpful: 84 },
      { title: "Récupération de compte perdu", views: "0.9k", helpful: 81 },
    ]
  },
];

const popularArticles = [
  {
    title: "Guide complet : Vendre ses skins CS2 en 5 étapes",
    category: "Trading",
    readTime: "5 min",
    views: "5.2k",
    helpful: 96,
  },
  {
    title: "KYC : Pourquoi et comment valider son identité ?",
    category: "Sécurité",
    readTime: "3 min",
    views: "4.1k",
    helpful: 94,
  },
  {
    title: "Comprendre les frais et délais de paiement",
    category: "Paiements",
    readTime: "4 min",
    views: "3.8k",
    helpful: 91,
  },
];

const supportOptions = [
  {
    title: "Chat en direct",
    description: "Support instantané avec notre équipe",
    availability: "24/7",
    responseTime: "< 2 min",
    icon: ChatBubbleLeftRightIcon,
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  },
  {
    title: "Ticket de support",
    description: "Pour les questions complexes nécessitant un suivi",
    availability: "24/7",
    responseTime: "< 2h",
    icon: DocumentTextIcon,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  },
  {
    title: "Support téléphonique",
    description: "Assistance vocale pour les cas urgents",
    availability: "Lun-Ven 9h-18h",
    responseTime: "Immédiat",
    icon: ClockIcon,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
            <QuestionMarkCircleIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Centre d&apos;aide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Trouvez rapidement les réponses à vos questions sur CashTrade
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans l&apos;aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-center"
            />
          </div>
        </motion.div>

        {/* Popular Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Articles populaires</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <h3 className="font-semibold mb-3 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{article.views} vues</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span>{article.helpful}% utile</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Parcourir par catégorie</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                    <span>{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <div key={articleIndex} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span>{article.views} vues</span>
                            <div className="flex items-center space-x-1">
                              <CheckCircleIcon className="w-3 h-3 text-green-600" />
                              <span>{article.helpful}% utile</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3">
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Support Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Besoin d&apos;aide personnalisée ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mx-auto mb-4`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                  <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center justify-center space-x-2">
                      <ClockIcon className="w-3 h-3" />
                      <span>{option.availability}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-600" />
                      <span>Réponse {option.responseTime}</span>
                    </div>
                  </div>
                  <Button className="w-full">
                    Contacter le support
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* FAQ Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">
                Vous ne trouvez pas votre réponse ?
              </h3>
              <p className="text-muted-foreground mb-6">
                Notre équipe support est disponible 24/7 pour vous aider avec toutes vos questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button className="flex-1">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                  Chat en direct
                </Button>
                <Button variant="outline" className="flex-1">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Créer un ticket
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Support en ligne</span>
                </div>
                <span>Temps de réponse moyen : 1.5 min</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}