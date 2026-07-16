"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  EyeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { useQuery } from "@tanstack/react-query";
import {
  HELP_CATEGORY_KEYS,
  formatViewCount,
  type HelpCategoryKey,
} from "@/lib/help-articles-config";

interface HelpArticleListItem {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  categoryKey: HelpCategoryKey;
  viewCount: number;
  helpfulPercent: number | null;
}

function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesQuery(query: string, article: HelpArticleListItem) {
  const q = query.trim();
  if (!q) return true;
  const n = normalizeSearch(q);
  return (
    normalizeSearch(article.title).includes(n) ||
    normalizeSearch(article.excerpt).includes(n) ||
    normalizeSearch(article.category).includes(n) ||
    (article.subtitle ? normalizeSearch(article.subtitle).includes(n) : false)
  );
}

const CATEGORY_ICONS: Record<HelpCategoryKey, React.ComponentType<{ className?: string }>> = {
  gettingStarted: CheckCircleIcon,
  trading: CurrencyEuroIcon,
  payments: ShieldCheckIcon,
  security: ExclamationTriangleIcon,
  technical: DocumentTextIcon,
};

const CATEGORY_COLORS: Record<HelpCategoryKey, string> = {
  gettingStarted: "text-green-600",
  trading: "text-theme-accent",
  payments: "text-blue-600",
  security: "text-red-600",
  technical: "text-purple-600",
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { messages, locale } = useLocale();
  const t = messages.helpPage;

  const { data: allArticles = [] } = useQuery({
    queryKey: ["help-articles", locale],
    queryFn: async () => {
      const response = await fetch(`/api/help-articles?lang=${locale}`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.articles ?? []) as HelpArticleListItem[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filteredArticles = useMemo(
    () => allArticles.filter((a) => matchesQuery(searchQuery, a)),
    [allArticles, searchQuery],
  );

  const popularArticles = useMemo(
    () =>
      [...allArticles]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 3),
    [allArticles],
  );

  const categories = useMemo(() => {
    const categoryLabels = messages.help.categories;
    return HELP_CATEGORY_KEYS.map((key) => ({
      key,
      title: categoryLabels[key],
      icon: CATEGORY_ICONS[key],
      color: CATEGORY_COLORS[key],
      articles: filteredArticles.filter((a) => a.categoryKey === key),
    })).filter((cat) => cat.articles.length > 0);
  }, [filteredArticles, messages.help.categories]);

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

        {!searchQuery && popularArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-2xl font-semibold mb-6">{messages.help.popularArticles}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                >
                  <Link href={`/help/${article.slug}`} className="group block h-full">
                    <Card className="h-full border-border/60 transition-all duration-300 group-hover:border-theme-accent/60 group-hover:shadow-lg group-hover:shadow-theme-accent/10 group-hover:-translate-y-1 group-hover:bg-theme-accent/[0.03]">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            variant="outline"
                            className="transition-colors duration-300 group-hover:border-theme-accent/50 group-hover:text-theme-accent"
                          >
                            {article.category}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-3 line-clamp-2 transition-colors duration-300 group-hover:text-theme-accent">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                          <span className="flex items-center gap-1">
                            <EyeIcon className="w-4 h-4 transition-colors duration-300 group-hover:text-theme-accent" />
                            {formatViewCount(article.viewCount)} {messages.help.views}
                          </span>
                          {article.helpfulPercent !== null && (
                            <div className="flex items-center space-x-1">
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                              <span>
                                {article.helpfulPercent}% {messages.help.helpful}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-theme-accent opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                          <span>{messages.helpPage.readArticle}</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">{t.browseByCategory}</h2>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.searchNoResults}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <Card key={category.key} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <category.icon className={`w-6 h-6 ${category.color}`} />
                      <span>{category.title}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {category.articles.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {category.articles.map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/help/${article.slug}`}
                            className="flex items-center justify-between gap-2 py-2 px-2 -mx-2 rounded-md text-sm hover:bg-muted/60 transition-colors group"
                          >
                            <span className="font-medium group-hover:text-theme-accent transition-colors line-clamp-1">
                              {article.title}
                            </span>
                            <ArrowRightIcon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-theme-accent transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
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
