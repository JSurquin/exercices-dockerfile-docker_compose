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
    // Widget de feedback utilisateur (bouton flottant « Report a Bug » + formulaire)
    Sentry.feedbackIntegration({
      colorScheme: "system",
      showBranding: false,
      themeLight: {
        accentBackground: "#ea580c",
        accentForeground: "#ffffff",
        boxShadow: "0 12px 40px -12px rgba(234, 88, 12, 0.22)",
        outline: "1px auto #ea580c",
      },
      themeDark: {
        accentBackground: "#f97316",
        accentForeground: "#ffffff",
        boxShadow: "0 12px 48px -16px rgba(0, 0, 0, 0.55)",
        outline: "1px auto #f97316",
      },
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
