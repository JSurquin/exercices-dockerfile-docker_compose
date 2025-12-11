'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/providers/locale-provider';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DynamicLegalPageProps {
  slug: string;
  fallbackContent?: {
    title: string;
    subtitle?: string;
    content: React.ReactNode;
  };
  icon?: React.ComponentType<{ className?: string }>;
  showWarning?: boolean;
  warningText?: string;
}

interface LegalPageData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  version: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function DynamicLegalPage({
  slug,
  fallbackContent,
  icon: Icon = DocumentTextIcon,
  showWarning = false,
  warningText,
}: DynamicLegalPageProps) {
  const { locale, messages } = useLocale();
  const [page, setPage] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/legal-pages/${slug}?lang=${locale}`);
        
        if (!response.ok) {
          // Page non trouvée, utiliser le fallback
          setError(true);
          return;
        }
        
        const data = await response.json();
        setPage(data.page);
        setError(false);
      } catch (err) {
        console.error('Error fetching legal page:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, locale]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Si erreur ou pas de données, utiliser le fallback
  if (error || !page) {
    if (fallbackContent) {
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
                <Icon className="w-8 h-8 inline-block mr-2 text-orange-600" />
                {fallbackContent.title}
              </h1>
              {fallbackContent.subtitle && (
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {fallbackContent.subtitle}
                </p>
              )}
            </motion.div>
            {fallbackContent.content}
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-4">{messages.legalPage.pageNotAvailable}</h1>
          <p className="text-muted-foreground">
            {messages.legalPage.pageNotAvailableDesc}
          </p>
        </div>
      </div>
    );
  }

  // Format date
  const localeMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    cn: 'zh-CN'
  };
  const formattedDate = new Date(page.updatedAt).toLocaleDateString(
    localeMap[locale] || 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <Icon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              {page.subtitle}
            </p>
          )}

          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{messages.legalPage.lastUpdated}: {formattedDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Version {page.version}</span>
            </div>
          </div>
        </motion.div>

        {/* Warning if needed */}
        {showWarning && warningText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      {messages.legalPage.importantNotice}
                    </h3>
                    <p className="text-orange-800 dark:text-orange-200 text-sm leading-relaxed">
                      {warningText}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                    p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                    a: ({children, href}) => (
                      <a href={href} className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-orange-500 pl-4 my-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-8 border-border" />,
                  }}
                >
                  {page.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        {(page.contactEmail || page.contactPhone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">
                  {messages.legalPage.questions}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {messages.legalPage.teamAvailable}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {page.contactEmail && (
                    <Badge variant="outline" className="px-4 py-2">
                      📧 {page.contactEmail}
                    </Badge>
                  )}
                  {page.contactPhone && (
                    <Badge variant="outline" className="px-4 py-2">
                      📞 {page.contactPhone}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

