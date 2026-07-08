import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "./lib/sentry-config";
import { shouldIgnoreSentryEvent } from "./lib/sentry-filters";

const sentryDsn = getSentryDsn();

if (isSentryEnabled() && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Performance monitoring côté serveur
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Environnement
    environment: process.env.NODE_ENV,

    enabled: true,

    beforeSend(event) {
      return shouldIgnoreSentryEvent(event) ? null : event;
    },
  });
}
