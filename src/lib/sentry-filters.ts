/** Routes de test supprimées (pentest) — ne pas remonter à Sentry. */
export function isRemovedTestApiPath(path: string): boolean {
  return path.startsWith("/api/test");
}

export function shouldIgnoreSentryEvent(event: unknown): boolean {
  if (!event || typeof event !== "object") {
    return false;
  }

  const request = (event as { request?: { url?: string } | null }).request;
  const requestUrl = request?.url;
  if (requestUrl && isRemovedTestApiPath(requestUrl)) {
    return true;
  }

  const transaction = (event as { tags?: { transaction?: unknown } }).tags?.transaction;
  if (typeof transaction === "string" && isRemovedTestApiPath(transaction)) {
    return true;
  }

  return false;
}
