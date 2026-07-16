"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  NewspaperIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";
import { usePublicStats } from "@/hooks/use-public-stats";
import { useQuery } from "@tanstack/react-query";
import { isPressCoverageArticle } from "@/lib/press-article-content";

const PRESS_EMAIL = process.env.NEXT_PUBLIC_PRESS_EMAIL ?? "contact@moonskin.fun";

type PressArticleItem = {
  slug: string;
  title: string;
  summary?: string;
  sourceName?: string;
  publishedAt: string;
  externalUrl?: string;
};

const getMediaKit = (messages: { press: { mediaKitItems: {
  logos: { title: string; description: string };
  screenshots: { title: string; description: string };
  factsheet: { title: string; description: string };
} } }) => [
  {
    title: messages.press.mediaKitItems.logos.title,
    description: messages.press.mediaKitItems.logos.description,
    icon: PhotoIcon,
    downloadLink: null,
  },
  {
    title: messages.press.mediaKitItems.screenshots.title,
    description: messages.press.mediaKitItems.screenshots.description,
    icon: DocumentTextIcon,
    downloadLink: null,
  },
  {
    title: messages.press.mediaKitItems.factsheet.title,
    description: messages.press.mediaKitItems.factsheet.description,
    icon: ChartBarIcon,
    downloadLink: null,
  },
];

const getStats = (
  messages: { press: { stats: {
    activeUsers: string;
    volumeProcessed: string;
    completedTrades: string;
    satisfactionRate: string;
  } } },
  totalUsers: number,
  volumeMillions: number,
  completedTrades: number
) => [
  { label: messages.press.stats.activeUsers, value: `${totalUsers.toLocaleString()}+`, icon: UserGroupIcon },
  { label: messages.press.stats.volumeProcessed, value: `€${volumeMillions}M+`, icon: TrophyIcon },
  { label: messages.press.stats.completedTrades, value: `${completedTrades.toLocaleString()}+`, icon: ChartBarIcon },
  { label: messages.press.stats.satisfactionRate, value: "99.8%", icon: TrophyIcon },
];

export default function PressPage() {
  const { messages, locale } = useLocale();
  const { data: publicStats } = usePublicStats();
  const { data: pressArticles = [] } = useQuery({
    queryKey: ['press-articles', locale],
    queryFn: async () => {
      const response = await fetch(`/api/press-articles?lang=${locale}`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.articles ?? []) as PressArticleItem[];
    },
    staleTime: 10 * 60 * 1000,
  });
  const pressReleases = pressArticles.filter((article) => !isPressCoverageArticle(article.externalUrl));
  const mediaCoverage = pressArticles.filter((article) => isPressCoverageArticle(article.externalUrl));
  const stats = getStats(
    messages,
    publicStats?.totalUsers ?? 0,
    publicStats?.volumeMillions ?? 0,
    publicStats?.completedTrades ?? 0
  );
  const mediaKit = getMediaKit(messages);

  const localeTag = locale === "cn" ? "zh-CN" : locale === "en" ? "en-GB" : "fr-FR";
  const lastUpdateLabel = new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const formatArticleDate = (publishedAt: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(publishedAt));

  const renderArticleCard = (
    article: PressArticleItem,
    options: { external?: boolean },
  ) => (
    <Card key={article.slug} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground mb-2">
              {formatArticleDate(article.publishedAt)}
              {article.sourceName ? ` • ${article.sourceName}` : ""}
            </p>
            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
            {article.summary ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>
            ) : null}
          </div>
          <Button variant="outline" className="shrink-0" asChild>
            {options.external && article.externalUrl ? (
              <a href={article.externalUrl} target="_blank" rel="noopener noreferrer">
                {messages.press.readArticle}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </a>
            ) : (
              <Link href={`/press/${article.slug}`}>
                {messages.press.readRelease}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Link>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
            <NewspaperIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {messages.press.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {messages.press.subtitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {messages.press.lastUpdate} {lastUpdateLabel}
          </p>
        </motion.div>

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
                    <stat.icon className="w-8 h-8 mx-auto mb-2 text-theme-accent" />
                    <div className="text-2xl font-bold text-theme-accent">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-6">{messages.press.pressReleases}</h2>
              {pressReleases.length > 0 ? (
                <div className="space-y-4">
                  {pressReleases.map((article) => renderArticleCard(article, { external: false }))}
                </div>
              ) : (
              <Card className="border-dashed">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold mb-2">{messages.press.noPressReleasesTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{messages.press.noPressReleasesBody}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <EnvelopeIcon className="h-6 w-6 text-theme-accent shrink-0" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-foreground">{messages.press.pressContact}</p>
                      <a
                        href={`mailto:${PRESS_EMAIL}`}
                        className="text-theme-accent hover:underline font-medium break-all"
                      >
                        {PRESS_EMAIL}
                      </a>
                    </div>
                  </div>
                  <Button className="mt-6" asChild>
                    <a href={`mailto:${PRESS_EMAIL}`}>
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      {messages.press.contactPress}
                    </a>
                  </Button>
                </CardContent>
              </Card>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <h2 className="text-2xl font-semibold mb-6">{messages.press.inTheNews}</h2>
              {mediaCoverage.length > 0 ? (
                <div className="space-y-4">
                  {mediaCoverage.map((article) => renderArticleCard(article, { external: true }))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8">
                    <h3 className="text-lg font-semibold mb-2">{messages.press.noInTheNewsTitle}</h3>
                    <p className="text-muted-foreground leading-relaxed">{messages.press.noInTheNewsBody}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

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
                  <p className="text-muted-foreground leading-relaxed">{messages.press.aboutDescription1}</p>
                  <p className="text-muted-foreground leading-relaxed">{messages.press.aboutDescription2}</p>
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

          <div className="space-y-8">
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
                      <item.icon className="w-5 h-5 text-theme-accent flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        {item.downloadLink ? (
                          <Button variant="outline" size="sm" className="text-xs" asChild>
                            <a href={item.downloadLink}>{messages.press.download}</a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs" disabled>
                            {messages.press.comingSoon}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

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
                  {Object.values(messages.about.team.members).map((member, index, arr) => (
                    <div key={index} className="space-y-2">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-theme-accent">{member.role}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.bio}</p>
                      {index < arr.length - 1 && <hr className="my-3" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

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
                  <div className="flex items-start gap-3 text-sm">
                    <EnvelopeIcon className="h-5 w-5 text-theme-accent shrink-0" aria-hidden />
                    <div>
                      <a href={`mailto:${PRESS_EMAIL}`} className="text-theme-accent hover:underline font-medium break-all">
                        {PRESS_EMAIL}
                      </a>
                    </div>
                  </div>
                  {process.env.NEXT_PUBLIC_SUPPORT_PHONE && (
                    <div className="flex items-center space-x-2 text-sm">
                      <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{process.env.NEXT_PUBLIC_SUPPORT_PHONE}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ClockIcon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{messages.press.workingHours}</span>
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <a href={`mailto:${PRESS_EMAIL}`}>
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      {messages.press.contactPress}
                    </a>
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
