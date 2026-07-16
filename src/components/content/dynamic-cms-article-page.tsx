'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/providers/locale-provider';
import {
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface DynamicCmsArticlePageProps {
  apiPath: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CmsArticleData {
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  updatedAt: string;
  publishedAt?: string;
  sourceName?: string;
  externalUrl?: string;
}

export function DynamicCmsArticlePage({
  apiPath,
  icon: Icon = DocumentTextIcon,
}: DynamicCmsArticlePageProps) {
  const { locale, messages } = useLocale();

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['cms-article', apiPath, locale],
    queryFn: async () => {
      const response = await fetch(`${apiPath}?lang=${locale}`);
      if (!response.ok) return null;
      const data = await response.json();
      return (data.article ?? null) as CmsArticleData | null;
    },
    staleTime: 10 * 60 * 1000,
  });

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
          <p className="text-muted-foreground">{messages.legalPage.pageNotAvailableDesc}</p>
        </div>
      </div>
    );
  }

  const dateSource = article.publishedAt ?? article.updatedAt;
  const formattedDate = new Date(dateSource).toLocaleDateString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <Icon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {article.title}
          </h1>
          {(article.subtitle || article.summary) && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              {article.subtitle ?? article.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {messages.legalPage.lastUpdated}: {formattedDate}
              </span>
            </div>
            {article.sourceName ? <span>{article.sourceName}</span> : null}
            {article.externalUrl ? (
              <a
                href={article.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-theme-accent hover:underline"
              >
                {messages.press.readOriginal}
              </a>
            ) : null}
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
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {article.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
