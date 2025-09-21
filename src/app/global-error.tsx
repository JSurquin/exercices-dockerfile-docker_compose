"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log l&apos;erreur globale pour le monitoring
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background text-foreground">
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
            <h1 className="text-2xl font-bold mb-4">Erreur critique</h1>
            <p className="text-muted-foreground mb-6">
              Une erreur critique s&apos;est produite. L&apos;application doit
              être rechargée.
            </p>

            {/* Error Details (en mode développement) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 text-sm">
                  Détails de l&apos;erreur :
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
              >
                Recharger l&apos;application
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full"
              >
                Retour à l&apos;accueil
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Si ce problème persiste, contactez notre support à{" "}
                <a
                  href="mailto:support@cashtrade.gg"
                  className="text-orange-600 hover:underline"
                >
                  support@cashtrade.gg
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
