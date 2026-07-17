"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NewspaperIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";
import { useQuery } from "@tanstack/react-query";
import { BLOG_CATEGORY_KEYS, isBlogCategoryKey, type BlogCategoryKey } from "@/lib/blog-articles-config";
import { useMemo, useState } from "react";

type BlogArticleItem = {
  slug: string;
  title: string;
  summary?: string;
  category?: string;
  coverImageUrl?: string | null;
  readTimeMinutes: number;
  isFeatured: boolean;
  publishedAt: string;
};

export default function BlogPage() {
  const { messages, locale } = useLocale();
  const t = messages.blogPage;
  const [activeCategory, setActiveCategory] = useState<BlogCategoryKey | "all">("all");

  const { data: allArticles = [] } = useQuery({
    queryKey: ["blog-articles", locale],
    queryFn: async () => {
      const response = await fetch(`/api/blog-articles?lang=${locale}`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.articles ?? []) as BlogArticleItem[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const featuredArticles = useMemo(
    () => allArticles.filter((a) => a.isFeatured).slice(0, 3),
    [allArticles],
  );

  const filteredArticles = useMemo(() => {
    if (activeCategory === "all") return allArticles;
    return allArticles.filter((a) => a.category === activeCategory);
  }, [allArticles, activeCategory]);

  const localeTag = locale === "cn" ? "zh-CN" : locale === "en" ? "en-GB" : "fr-FR";

  const formatDate = (publishedAt: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(publishedAt));

  const getCategoryLabel = (category?: string) => {
    if (!category || !isBlogCategoryKey(category)) return null;
    return messages.blogPage.categories[category];
  };

  const renderArticleCard = (article: BlogArticleItem, featured = false) => (
    <Card
      key={article.slug}
      className={`overflow-hidden hover:shadow-md transition-shadow ${featured ? "border-theme-accent/30 bg-theme-accent/5" : ""}`}
    >
      {article.coverImageUrl ? (
        <div className="aspect-[16/9] overflow-hidden border-b border-border/50">
          <img
            src={article.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {article.category && getCategoryLabel(article.category) ? (
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(article.category)}
              </Badge>
            ) : null}
            {featured ? (
              <Badge className="bg-theme-accent/15 text-theme-accent border-theme-accent/30 text-xs">
                <SparklesIcon className="w-3 h-3 mr-1" />
                {t.featured}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {article.readTimeMinutes} {t.readTime}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">{formatDate(article.publishedAt)}</p>
            <h3 className={`font-semibold mb-2 ${featured ? "text-xl" : "text-lg"}`}>{article.title}</h3>
            {article.summary ? (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{article.summary}</p>
            ) : null}
          </div>
          <Button variant="outline" className="w-fit" asChild>
            <Link href={`/blog/${article.slug}`}>
              {t.readMore}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Link>
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <NewspaperIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </motion.div>

        {featuredArticles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-theme-accent" />
              {t.featuredPosts}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredArticles.map((article) => renderArticleCard(article, true))}
            </div>
          </motion.div>
        ) : null}

        <div className="grid lg:grid-cols-4 gap-8">
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-theme-accent" />
                  {t.categoriesTitle}
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                      activeCategory === "all"
                        ? "bg-theme-accent/15 text-theme-accent font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t.allCategories}
                  </button>
                  {BLOG_CATEGORY_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                        activeCategory === key
                          ? "bg-theme-accent/15 text-theme-accent font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {messages.blogPage.categories[key]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{t.popularGuides}</h3>
                <ul className="space-y-2">
                  {t.popularGuideLinks.map((link: { slug: string; label: string }) => (
                    <li key={link.slug}>
                      <Link
                        href={`/blog/${link.slug}`}
                        className="text-sm text-theme-accent hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <h2 className="text-2xl font-semibold mb-6">{t.allPosts}</h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-4">
                {filteredArticles.map((article) => renderArticleCard(article))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{t.noArticles}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-theme-accent/10 to-primary/10 border-theme-accent/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">{t.ctaTitle}</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{t.ctaSubtitle}</p>
              <Button size="lg" asChild>
                <Link href="/sell">{t.ctaButton}</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
