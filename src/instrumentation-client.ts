import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajoute les headers et l'IP pour le contexte utilisateur
  sendDefaultPii: true,

  // Performance monitoring : 100% en dev, 10% en production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  integrations: [
    // Session Replay pour reproduire les sessions utilisateur
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
    // Widget de feedback utilisateur
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
  ],

  // 10% des sessions normales, 100% des sessions avec erreur
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environnement (dev, staging, production)
  environment: process.env.NODE_ENV,

  // Désactiver en développement si pas de DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Instrumentation des navigations pour le tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
