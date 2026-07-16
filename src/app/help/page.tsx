"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { useQuery } from "@tanstack/react-query";

function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesQuery(query: string, title: string, body: string) {
  const q = query.trim();
  if (!q) return true;
  const n = normalizeSearch(q);
  return normalizeSearch(title).includes(n) || normalizeSearch(body).includes(n);
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { messages, locale } = useLocale();

  const t = messages.helpPage;

  const { data: cmsArticles = [] } = useQuery({
    queryKey: ["help-articles", locale],
    queryFn: async () => {
      const response = await fetch(`/api/help-articles?lang=${locale}`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.articles ?? []) as Array<{
        slug: string;
        title: string;
        subtitle?: string;
        category?: string;
      }>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories = useMemo(
    () => [
      {
        title: messages.help.categories.gettingStarted,
        icon: CheckCircleIcon,
        color: "text-green-600",
        articles: [
          {
            id: "gs-createAccount",
            title: t.articles.gettingStarted.createAccount,
            body: t.articleBodies.gettingStarted.createAccount,
          },
          {
            id: "gs-steamConnection",
            title: t.articles.gettingStarted.steamConnection,
            body: t.articleBodies.gettingStarted.steamConnection,
          },
          {
            id: "gs-kycStepByStep",
            title: t.articles.gettingStarted.kycStepByStep,
            body: t.articleBodies.gettingStarted.kycStepByStep,
          },
          {
            id: "gs-firstTrade",
            title: t.articles.gettingStarted.firstTrade,
            body: t.articleBodies.gettingStarted.firstTrade,
          },
        ],
      },
      {
        title: messages.help.categories.trading,
        icon: CurrencyEuroIcon,
        color: "text-theme-accent",
        articles: [
          {
            id: "tr-howToSell",
            title: t.articles.trading.howToSell,
            body: t.articleBodies.trading.howToSell,
          },
          {
            id: "tr-priceEstimation",
            title: t.articles.trading.priceEstimation,
            body: t.articleBodies.trading.priceEstimation,
          },
          {
            id: "tr-tradeHold",
            title: t.articles.trading.tradeHold,
            body: t.articleBodies.trading.tradeHold,
          },
          {
            id: "tr-fees",
            title: t.articles.trading.fees,
            body: t.articleBodies.trading.fees,
          },
        ],
      },
      {
        title: messages.help.categories.payments,
        icon: ShieldCheckIcon,
        color: "text-blue-600",
        articles: [
          {
            id: "pay-methods",
            title: t.articles.payments.methods,
            body: t.articleBodies.payments.methods,
          },
          {
            id: "pay-delays",
            title: t.articles.payments.delays,
            body: t.articleBodies.payments.delays,
          },
          {
            id: "pay-ibanVerification",
            title: t.articles.payments.ibanVerification,
            body: t.articleBodies.payments.ibanVerification,
          },
          {
            id: "pay-paymentIssue",
            title: t.articles.payments.paymentIssue,
            body: t.articleBodies.payments.paymentIssue,
          },
        ],
      },
      {
        title: messages.help.categories.security,
        icon: ExclamationTriangleIcon,
        color: "text-red-600",
        articles: [
          {
            id: "sec-secureAccount",
            title: t.articles.security.secureAccount,
            body: t.articleBodies.security.secureAccount,
          },
          {
            id: "sec-accountSuspended",
            title: t.articles.security.accountSuspended,
            body: t.articleBodies.security.accountSuspended,
          },
          {
            id: "sec-reportSuspicious",
            title: t.articles.security.reportSuspicious,
            body: t.articleBodies.security.reportSuspicious,
          },
          {
            id: "sec-accountRecovery",
            title: t.articles.security.accountRecovery,
            body: t.articleBodies.security.accountRecovery,
          },
        ],
      },
      {
        title: messages.help.categories.technical,
        icon: DocumentTextIcon,
        color: "text-purple-600",
        articles: [
          {
            id: "tec-siteNotLoading",
            title: t.articles.technical.siteNotLoading,
            body: t.articleBodies.technical.siteNotLoading,
          },
          {
            id: "tec-steamTradeError",
            title: t.articles.technical.steamTradeError,
            body: t.articleBodies.technical.steamTradeError,
          },
          {
            id: "tec-steamConnectionIssue",
            title: t.articles.technical.steamConnectionIssue,
            body: t.articleBodies.technical.steamConnectionIssue,
          },
          {
            id: "tec-buggyInterface",
            title: t.articles.technical.buggyInterface,
            body: t.articleBodies.technical.buggyInterface,
          },
        ],
      },
    ],
    [messages.help.categories, t]
  );

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) =>
          matchesQuery(searchQuery, a.title, a.body)
        ),
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [categories, searchQuery]);

  const popularItems = useMemo(
    () => [
      {
        id: "pop-sell",
        headline: t.popularArticles.sellGuide,
        categoryLabel: messages.help.categories.trading,
        readTime: "5 min",
        views: "5.2k",
        helpful: 96,
        title: t.articles.trading.howToSell,
        body: t.articleBodies.trading.howToSell,
      },
      {
        id: "pop-kyc",
        headline: t.popularArticles.kycGuide,
        categoryLabel: messages.help.categories.gettingStarted,
        readTime: "3 min",
        views: "4.1k",
        helpful: 94,
        title: t.articles.gettingStarted.kycStepByStep,
        body: t.articleBodies.gettingStarted.kycStepByStep,
      },
      {
        id: "pop-fees",
        headline: t.popularArticles.feesGuide,
        categoryLabel: messages.help.categories.payments,
        readTime: "4 min",
        views: "3.8k",
        helpful: 91,
        title: t.articles.trading.fees,
        body: t.articleBodies.trading.fees,
      },
    ],
    [messages.help.categories, t]
  );

  const getSupportOptions = () => [
    {
      title: t.supportOptions.liveChat.title,
      description: t.supportOptions.liveChat.description,
      availability: t.supportOptions.liveChat.availability,
      responseTime: t.supportOptions.liveChat.responseTime,
      icon: ChatBubbleLeftRightIcon,
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    },
    {
      title: t.supportOptions.ticket.title,
      description: t.supportOptions.ticket.description,
      availability: t.supportOptions.ticket.availability,
      responseTime: t.supportOptions.ticket.responseTime,
      icon: DocumentTextIcon,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    },
    {
      title: t.supportOptions.phone.title,
      description: t.supportOptions.phone.description,
      availability: t.supportOptions.phone.availability,
      responseTime: t.supportOptions.phone.responseTime,
      icon: ClockIcon,
      color: "bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20 dark:text-theme-highlight",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <QuestionMarkCircleIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {messages.help.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {messages.help.subtitle}
          </p>

          <div className="max-w-md mx-auto relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={messages.help.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-center"
              aria-label={messages.help.searchPlaceholder}
            />
          </div>
        </motion.div>

        {cmsArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-2xl font-semibold mb-6">{t.cmsArticlesTitle}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {cmsArticles.map((article) => (
                <Card key={article.slug} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {article.category ? (
                          <Badge variant="outline" className="mb-2">
                            {article.category}
                          </Badge>
                        ) : null}
                        <h3 className="font-semibold mb-1">{article.title}</h3>
                        {article.subtitle ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">{article.subtitle}</p>
                        ) : null}
                      </div>
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link href={`/help/${article.slug}`}>→</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">{messages.help.popularArticles}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {popularItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{item.categoryLabel}</Badge>
                      <span className="text-xs text-muted-foreground">{item.readTime}</span>
                    </div>
                    <h3 className="font-semibold mb-3 line-clamp-2">{item.headline}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>
                        {item.views} {messages.help.views}
                      </span>
                      <div className="flex items-center space-x-1">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span>
                          {item.helpful}% {messages.help.helpful}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full px-6 pb-4">
                    <AccordionItem value={item.id} className="border-0">
                      <AccordionTrigger className="py-2 text-theme-accent hover:text-theme-accent hover:no-underline text-sm font-medium">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed pt-1">{item.body}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">{t.browseByCategory}</h2>
          {filteredCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.searchNoResults}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.title} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <category.icon className={`w-6 h-6 ${category.color}`} />
                      <span>{category.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      {category.articles.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                            {article.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground leading-relaxed pr-2">{article.body}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">{messages.help.stillNeedHelp}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {getSupportOptions().map((option, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mx-auto mb-4`}
                  >
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
                      <span>
                        {t.response} {option.responseTime}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/contact">{t.contactSupport}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">{t.cantFindAnswer}</h3>
              <p className="text-muted-foreground mb-6">{t.teamAvailable247}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button className="flex-1" asChild>
                  <Link href="/contact">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    {t.liveChat}
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/contact">
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    {t.createTicket}
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{t.supportOnline}</span>
                </div>
                <span>{t.avgResponseTime}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
