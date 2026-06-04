"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Textes en fallback : global-error remplace le layout, useLocale n'est pas disponible
const messages = {
  title: "Erreur critique",
  message: "Une erreur critique s'est produite. L'application doit être rechargée.",
  errorDetails: "Détails de l'erreur :",
  reload: "Recharger l'application",
  home: "Retour à l'accueil",
  supportDesc: "Si ce problème persiste, contactez notre support",
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          <div className="max-w-md mx-auto text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold mb-4">{messages.title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{messages.message}</p>

            {/* Error Details (en mode développement) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 text-sm">
                  {messages.errorDetails}
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                className="w-full bg-cta-gradient hover:brightness-110 text-white"
              >
                {messages.reload}
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full"
              >
                {messages.home}
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {messages.supportDesc}{" "}
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg"}`}
                  className="text-theme-accent hover:underline"
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg"}
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
