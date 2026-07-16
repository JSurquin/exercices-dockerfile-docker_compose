'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/providers/locale-provider';
import {
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelpArticleFeedback } from '@/components/content/help-article-feedback';
import { formatViewCount } from '@/lib/help-articles-config';

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a
      href={href}
      className="text-theme-accent hover:underline"
      target={href?.startsWith('/') ? undefined : '_blank'}
      rel={href?.startsWith('/') ? undefined : 'noopener noreferrer'}
    >
      {children}
    </a>
  ),
};

interface HelpArticleDetailPageProps {
  slug: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface HelpArticleData {
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  viewCount: number;
  helpfulPercent: number | null;
  updatedAt?: string;
  source: 'static' | 'cms';
}

export function HelpArticleDetailPage({
  slug,
  icon: Icon = DocumentTextIcon,
}: HelpArticleDetailPageProps) {
  const { locale, messages } = useLocale();
  const viewRecorded = useRef(false);

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['help-article', slug, locale],
    queryFn: async () => {
      const response = await fetch(`/api/help-articles/${slug}?lang=${locale}`);
      if (!response.ok) return null;
      const data = await response.json();
      return (data.article ?? null) as HelpArticleData | null;
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!slug || viewRecorded.current) return;
    viewRecorded.current = true;
    fetch(`/api/help-articles/${slug}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  const localeMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    cn: 'zh-CN',
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-4">{messages.legalPage.pageNotAvailable}</h1>
          <p className="text-muted-foreground mb-6">{messages.legalPage.pageNotAvailableDesc}</p>
          <Link href="/help" className="text-theme-accent hover:underline">
            ← {messages.help.title}
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString(localeMap[locale] || 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const isMarkdown = article.source === 'cms' || /^#{1,3}\s/m.test(article.content);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/help" className="hover:text-theme-accent transition-colors">
            {messages.help.title}
          </Link>
          <ChevronRightIcon className="w-4 h-4 shrink-0" />
          <span className="text-foreground truncate">{article.title}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Badge variant="outline" className="mb-4">
            {article.category}
          </Badge>
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <Icon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{article.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <EyeIcon className="w-4 h-4" />
              <span>
                {formatViewCount(article.viewCount)} {messages.help.views}
              </span>
            </div>
            {article.helpfulPercent !== null && (
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>
                  {article.helpfulPercent}% {messages.help.helpful}
                </span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {messages.legalPage.lastUpdated}: {formattedDate}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {isMarkdown ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                    {article.content}
                  </ReactMarkdown>
                ) : (
                  <p className="leading-relaxed whitespace-pre-line">{article.content}</p>
                )}
              </div>
              <HelpArticleFeedback slug={slug} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
