const CMS_IMAGE_FILENAME_PATTERN =
  /^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i;

/** Extrait le nom de fichier d'une URL CMS locale (/uploads/cms ou /api/cms-media). */
export function extractCmsImageFilename(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(
    /^(?:\/uploads\/cms|\/api\/cms-media)\/([a-f0-9-]+\.(?:jpg|jpeg|png|webp|gif))$/i,
  );
  if (!match) return null;
  const filename = match[1];
  return CMS_IMAGE_FILENAME_PATTERN.test(filename) ? filename : null;
}

/**
 * Normalise les URLs d'images CMS pour servir via /api/cms-media (compatible prod éphémère).
 */
export function normalizeCmsImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const filename = extractCmsImageFilename(trimmed);
  if (filename) {
    return `/api/cms-media/${filename}`;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
