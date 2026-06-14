import * as Sentry from "@sentry/nextjs";
import { isRemovedTestApiPath } from "./lib/sentry-filters";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    const { startCronWorker } = await import("./lib/cron-jobs/start-worker");
    startCronWorker();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors from Server Components, middleware, and proxies
export const onRequestError: typeof Sentry.captureRequestError = (
  error,
  request,
  errorContext,
) => {
  if (isRemovedTestApiPath(request.path)) {
    return;
  }

  Sentry.captureRequestError(error, request, errorContext);
};
