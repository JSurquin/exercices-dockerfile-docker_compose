"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NewspaperIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookOpenIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
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

function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function BlogCoverImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-muted/80 via-muted/40 to-theme-accent/10 ${className ?? ""}`}
      >
        <PhotoIcon className="w-10 h-10 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function BlogPage() {
  const { messages, locale } = useLocale();
  const t = messages.blogPage;
  const [activeCategory, setActiveCategory] = useState<BlogCategoryKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const getCategoryLabel = (category?: string) => {
    if (!category || !isBlogCategoryKey(category)) return null;
    return messages.blogPage.categories[category];
  };

  const searchFilteredArticles = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return allArticles;
    const n = normalizeSearch(q);
    const categories = messages.blogPage.categories;
    return allArticles.filter((article) => {
      const categoryLabel =
        article.category && isBlogCategoryKey(article.category)
          ? categories[article.category]
          : null;
      return (
        normalizeSearch(article.title).includes(n) ||
        (article.summary ? normalizeSearch(article.summary).includes(n) : false) ||
        (categoryLabel ? normalizeSearch(categoryLabel).includes(n) : false)
      );
    });
  }, [allArticles, searchQuery, messages.blogPage.categories]);

  const featuredArticles = useMemo(
    () => searchFilteredArticles.filter((a) => a.isFeatured).slice(0, 3),
    [searchFilteredArticles],
  );

  const heroArticle = featuredArticles[0] ?? null;
  const secondaryFeatured = featuredArticles.slice(1);
  const isSearching = searchQuery.trim().length > 0;

  const filteredArticles = useMemo(() => {
    let articles = searchFilteredArticles;
    if (activeCategory !== "all") {
      articles = articles.filter((a) => a.category === activeCategory);
    }
    return articles;
  }, [searchFilteredArticles, activeCategory]);

  const localeTag = locale === "cn" ? "zh-CN" : locale === "en" ? "en-GB" : "fr-FR";

  const formatDate = (publishedAt: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(publishedAt));

  const renderMetaRow = (article: BlogArticleItem, featured = false) => (
    <div className="flex flex-wrap items-center gap-2">
      {article.category && getCategoryLabel(article.category) ? (
        <Badge variant="secondary" className="text-xs font-medium">
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
  );

  const renderHeroCard = (article: BlogArticleItem) => (
    <Link href={`/blog/${article.slug}`} className="group block">
      <Card className="overflow-hidden border-theme-accent/20 bg-gradient-to-br from-theme-accent/5 via-card to-card hover:shadow-xl hover:border-theme-accent/40 transition-all duration-300">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
            <BlogCoverImage
              src={article.coverImageUrl}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/10 pointer-events-none" />
          </div>
          <CardContent className="p-6 sm:p-8 flex flex-col justify-center gap-4">
            {renderMetaRow(article, true)}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{formatDate(article.publishedAt)}</p>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3 group-hover:text-theme-accent transition-colors">
                {article.title}
              </h2>
              {article.summary ? (
                <p className="text-muted-foreground leading-relaxed line-clamp-4">{article.summary}</p>
              ) : null}
            </div>
            <span className="inline-flex items-center text-sm font-medium text-theme-accent group-hover:gap-2 transition-all">
              {t.readMore}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </span>
          </CardContent>
        </div>
      </Card>
    </Link>
  );

  const renderCompactFeaturedCard = (article: BlogArticleItem) => (
    <Link href={`/blog/${article.slug}`} className="group block h-full">
      <Card className="overflow-hidden h-full hover:shadow-lg hover:border-theme-accent/30 transition-all duration-300">
        <div className="aspect-[16/10] overflow-hidden">
          <BlogCoverImage
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-5 flex flex-col gap-3">
          {renderMetaRow(article, true)}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">{formatDate(article.publishedAt)}</p>
            <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-theme-accent transition-colors">
              {article.title}
            </h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderArticleRow = (article: BlogArticleItem) => (
    <Link href={`/blog/${article.slug}`} className="group block">
      <Card className="overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-300">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-56 md:w-64 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[160px] overflow-hidden">
            <BlogCoverImage
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <CardContent className="p-5 sm:p-6 flex flex-col justify-center gap-3 flex-1 min-w-0">
            {renderMetaRow(article)}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{formatDate(article.publishedAt)}</p>
              <h3 className="font-semibold text-lg sm:text-xl mb-2 leading-snug group-hover:text-theme-accent transition-colors">
                {article.title}
              </h3>
              {article.summary ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{article.summary}</p>
              ) : null}
            </div>
            <span className="inline-flex items-center text-sm text-theme-accent opacity-0 group-hover:opacity-100 transition-opacity">
              {t.readMore}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </span>
          </CardContent>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            <NewspaperIcon className="w-8 h-8 md:w-10 md:h-10 inline-block mr-2 text-theme-accent" />
            {t.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{t.subtitle}</p>

          <div className="max-w-lg mx-auto relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3"
              aria-label={t.searchPlaceholder}
            />
          </div>
        </motion.div>

        {!isSearching ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-10"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 text-center sm:text-left">
              {t.popularGuides}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {t.popularGuideLinks.map((link: { slug: string; label: string }) => (
                <Link
                  key={link.slug}
                  href={`/blog/${link.slug}`}
                  className="inline-flex items-center rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-foreground/90 transition-colors hover:border-theme-accent/50 hover:bg-theme-accent/5 hover:text-theme-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}

        {!isSearching && heroArticle ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-muted-foreground uppercase tracking-wide text-sm">
              <SparklesIcon className="w-5 h-5 text-theme-accent" />
              {t.featuredPosts}
            </h2>
            {renderHeroCard(heroArticle)}
            {secondaryFeatured.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {secondaryFeatured.map((article) => renderCompactFeaturedCard(article))}
              </div>
            ) : null}
          </motion.div>
        ) : null}

        <div className="grid lg:grid-cols-4 gap-8">
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-24">
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
                {filteredArticles.map((article) => renderArticleRow(article))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {isSearching ? t.searchNoResults : t.noArticles}
                  </p>
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
