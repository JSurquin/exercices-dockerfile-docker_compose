function buildExternalArticleContent(summary: string | null | undefined, externalUrl: string): string {
  const parts: string[] = [];
  const trimmedSummary = summary?.trim();
  if (trimmedSummary) {
    parts.push(trimmedSummary);
    parts.push('');
  }
  parts.push(`[Lire l'article original](${externalUrl})`);
  return parts.join('\n');
}

export function isPressCoverageArticle(externalUrl: string | null | undefined): boolean {
  return Boolean(externalUrl?.trim());
}

export function normalizePressArticleContent(input: {
  contentFr?: string | null;
  contentEn?: string | null;
  contentCn?: string | null;
  summaryFr?: string | null;
  summaryEn?: string | null;
  summaryCn?: string | null;
  externalUrl?: string | null;
}): { contentFr: string; contentEn: string; contentCn: string | null } {
  const externalUrl = input.externalUrl?.trim() ?? '';
  const isCoverage = Boolean(externalUrl);

  const contentFr = input.contentFr?.trim()
    || (isCoverage ? buildExternalArticleContent(input.summaryFr, externalUrl) : '');
  const contentEn = input.contentEn?.trim()
    || (isCoverage ? buildExternalArticleContent(input.summaryEn, externalUrl) : '');
  const contentCn = input.contentCn?.trim()
    || (isCoverage && input.summaryCn?.trim()
      ? buildExternalArticleContent(input.summaryCn, externalUrl)
      : input.contentCn?.trim() || null);

  return { contentFr, contentEn, contentCn };
}

export function validatePressArticlePayload(input: {
  slug?: string;
  titleFr?: string;
  titleEn?: string;
  contentFr?: string;
  contentEn?: string;
  externalUrl?: string;
  sourceName?: string;
}): string | null {
  if (!input.slug?.trim() || !input.titleFr?.trim() || !input.titleEn?.trim()) {
    return 'Champs obligatoires manquants: slug, titleFr, titleEn';
  }

  const externalUrl = input.externalUrl?.trim() ?? '';
  if (externalUrl) {
    if (!input.sourceName?.trim()) {
      return 'Le nom du média est obligatoire pour une retombée presse';
    }
    return null;
  }

  if (!input.contentFr?.trim() || !input.contentEn?.trim()) {
    return 'Champs obligatoires manquants: contentFr, contentEn';
  }

  return null;
}
