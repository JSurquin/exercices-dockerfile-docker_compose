import * as Sentry from "@sentry/nextjs";
import { shouldIgnoreSentryEvent } from "./lib/sentry-filters";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring côté serveur
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Environnement
  environment: process.env.NODE_ENV,

  // Désactiver si pas de DSN configuré
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  beforeSend(event) {
    return shouldIgnoreSentryEvent(event) ? null : event;
  },
});
