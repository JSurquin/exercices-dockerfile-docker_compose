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
  PhotoIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CMS_MARKDOWN_COMPONENTS } from '@/components/content/markdown-components';
import { normalizeCmsImageUrl } from '@/lib/cms-image-url';
import { useMemo, useState } from 'react';

interface DynamicCmsArticlePageProps {
  apiPath: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CmsArticleData {
  title: string;
  subtitle?: string;
  summary?: string;
  content: string;
  coverImageUrl?: string | null;
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

  const coverImageUrl = useMemo(
    () => normalizeCmsImageUrl(article?.coverImageUrl),
    [article?.coverImageUrl],
  );
  const [coverFailed, setCoverFailed] = useState(false);

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
          <Card className="overflow-hidden">
            {coverImageUrl && !coverFailed ? (
              <figure className="m-0">
                <img
                  src={coverImageUrl}
                  alt=""
                  className="w-full max-h-[480px] object-cover"
                  onError={() => setCoverFailed(true)}
                />
              </figure>
            ) : coverImageUrl && coverFailed ? (
              <div className="flex items-center justify-center h-48 bg-muted/30">
                <PhotoIcon className="w-10 h-10 text-muted-foreground/40" />
              </div>
            ) : null}
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={CMS_MARKDOWN_COMPONENTS}>
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
