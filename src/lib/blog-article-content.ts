export function validateBlogArticlePayload(input: {
  slug?: string;
  titleFr?: string;
  titleEn?: string;
  contentFr?: string;
  contentEn?: string;
}): string | null {
  if (!input.slug?.trim() || !input.titleFr?.trim() || !input.titleEn?.trim()) {
    return 'Champs obligatoires manquants: slug, titleFr, titleEn';
  }

  if (!input.contentFr?.trim() || !input.contentEn?.trim()) {
    return 'Champs obligatoires manquants: contentFr, contentEn';
  }

  return null;
}
