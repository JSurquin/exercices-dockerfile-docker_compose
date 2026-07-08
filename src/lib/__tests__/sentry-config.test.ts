import { getSentryDsn, isSentryEnabled } from "@/lib/sentry-config";

describe("sentry-config", () => {
  const originalShowSentry = process.env.SHOW_SENTRY;
  const originalPublicShowSentry = process.env.NEXT_PUBLIC_SHOW_SENTRY;
  const originalSentryDsn = process.env.SENTRY_DSN;
  const originalPublicSentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  afterEach(() => {
    process.env.SHOW_SENTRY = originalShowSentry;
    process.env.NEXT_PUBLIC_SHOW_SENTRY = originalPublicShowSentry;
    process.env.SENTRY_DSN = originalSentryDsn;
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalPublicSentryDsn;
  });

  it("is désactivé par défaut", () => {
    delete process.env.SHOW_SENTRY;
    delete process.env.NEXT_PUBLIC_SHOW_SENTRY;

    expect(isSentryEnabled()).toBe(false);
    expect(getSentryDsn()).toBeUndefined();
  });

  it("active Sentry avec SHOW_SENTRY=true et un DSN", () => {
    process.env.SHOW_SENTRY = "true";
    process.env.SENTRY_DSN = "https://example@sentry.io/1";

    expect(isSentryEnabled()).toBe(true);
    expect(getSentryDsn()).toBe("https://example@sentry.io/1");
  });
});
