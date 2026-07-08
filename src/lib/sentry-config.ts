function parseBooleanEnv(value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  return value === "true" || value === "1";
}

/** Active Sentry (monitoring + widget feedback). Désactivé par défaut. */
export function isSentryEnabled(): boolean {
  return (
    parseBooleanEnv(process.env.SHOW_SENTRY) ||
    parseBooleanEnv(process.env.NEXT_PUBLIC_SHOW_SENTRY)
  );
}

export function getSentryDsn(): string | undefined {
  if (!isSentryEnabled()) return undefined;
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
}
