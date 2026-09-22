"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { defaultLocale, getMessages, locales, type Locale } from "@/lib/i18n";
import { LOCALE_STORAGE_KEY, parseAcceptLanguage } from "@/lib/locale-detection";
import { isSentryEnabled } from "@/lib/sentry-config";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function detectErrorLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale && locales.includes(storedLocale as Locale)) {
    return storedLocale as Locale;
  }

  return parseAcceptLanguage(navigator.language);
}

function detectThemeClass(): string {
  if (typeof window === "undefined") return "moonskin";

  const storedTheme = localStorage.getItem("moonskin-theme");
  if (storedTheme && ["moonskin", "light", "cs2"].includes(storedTheme)) {
    return storedTheme;
  }

  return "moonskin";
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const locale = detectErrorLocale();
  const messages = getMessages(locale);
  const t = messages.globalError;
  const errorMessages = messages.error;
  const links = messages.notFound;
  const themeClass = detectThemeClass();

  useEffect(() => {
    if (isSentryEnabled()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang={locale} className={themeClass} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Error Code */}
              <div className="mb-8">
                <div className="text-8xl md:text-9xl font-bold bg-cta-gradient bg-clip-text text-transparent">
                  {t.code}
                </div>
                <div className="text-2xl md:text-3xl font-semibold text-muted-foreground mt-2">
                  {errorMessages.serverError}
                </div>
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="w-24 h-24 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-12 h-12 text-theme-accent" />
                </div>
              </motion.div>

              {/* Error Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8"
              >
                <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
                <p className="text-muted-foreground mb-6 leading-relaxed">{t.message}</p>
              </motion.div>

              {/* Error Details (en mode développement) */}
              {process.env.NODE_ENV === "development" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8"
                >
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        {t.errorDetails}
                      </h3>
                      <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto bg-red-100 dark:bg-red-900/20 p-2 rounded">
                        {error.message}
                      </pre>
                      {error.digest && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          {errorMessages.errorId} {error.digest}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={reset} className="bg-cta-gradient hover:brightness-110">
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    {t.reload}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <HomeIcon className="w-4 h-4 mr-2" />
                      {t.home}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/help">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                      {errorMessages.contactSupport}
                    </Link>
                  </Button>
                </div>

                {/* Quick Links */}
                <Card className="mt-8">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4 flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                      {links.usefulLinks}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Link
                        href="/sell"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {links.sellSkins}
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {links.myDashboard}
                      </Link>
                      <Link
                        href="/giveaways"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {links.giveaways}
                      </Link>
                      <Link
                        href="/help"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {links.support}
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Support Info */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4">{t.supportTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t.supportDesc}{" "}
                      <a
                        href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg"}`}
                        className="text-theme-accent hover:underline"
                      >
                        {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg"}
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-12"
              >
                <p className="text-sm text-muted-foreground">
                  {errorMessages.checkStatus}{" "}
                  <a
                    href={process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.moonskin.gg"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-accent hover:underline"
                  >
                    {(process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.moonskin.gg").replace(
                      "https://",
                      ""
                    )}
                  </a>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </body>
    </html>
  );
}
