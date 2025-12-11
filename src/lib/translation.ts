/**
 * Service de traduction automatique pour les pages légales
 * Utilise l'API DeepL (gratuite jusqu'à 500k caractères/mois)
 * Fallback sur Google Translate si DeepL non disponible
 */

export type SupportedLanguage = 'fr' | 'en' | 'cn';

interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface TranslationError {
  error: string;
  code: string;
}

/**
 * Traduit un texte d'une langue source vers une langue cible
 * Utilise DeepL API si disponible, sinon fallback sur Google Translate
 */
export async function translateText(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<TranslationResult | TranslationError> {
  // Si les langues sont identiques, retourner le texte tel quel
  if (sourceLang === targetLang) {
    return { translatedText: text };
  }

  // Essayer DeepL d'abord
  const deeplApiKey = process.env.DEEPL_API_KEY;
  if (deeplApiKey) {
    try {
      const result = await translateWithDeepL(text, sourceLang, targetLang, deeplApiKey);
      return result;
    } catch (error) {
      console.warn('DeepL translation failed, trying fallback:', error);
    }
  }

  // Fallback sur LibreTranslate (open source et gratuit)
  const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
  try {
    const result = await translateWithLibreTranslate(text, sourceLang, targetLang, libreTranslateUrl);
    return result;
  } catch (error) {
    console.error('All translation services failed:', error);
    return {
      error: 'Translation service unavailable',
      code: 'TRANSLATION_FAILED'
    };
  }
}

/**
 * Traduction via DeepL API
 */
async function translateWithDeepL(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage,
  apiKey: string
): Promise<TranslationResult> {
  // DeepL utilise des codes de langue différents
  // Note: DeepL utilise 'ZH' pour le chinois simplifié
  const langMap: Record<SupportedLanguage, string> = {
    'fr': 'FR',
    'en': 'EN',
    'cn': 'ZH'
  };

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: langMap[sourceLang],
      target_lang: langMap[targetLang],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    translatedText: data.translations[0].text,
    detectedSourceLanguage: data.translations[0].detected_source_language,
  };
}

/**
 * Traduction via LibreTranslate (alternative gratuite open source)
 */
async function translateWithLibreTranslate(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage,
  apiUrl: string
): Promise<TranslationResult> {
  // LibreTranslate utilise 'zh' pour le chinois
  const langMap: Record<SupportedLanguage, string> = {
    'fr': 'fr',
    'en': 'en',
    'cn': 'zh'
  };

  const response = await fetch(`${apiUrl}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: langMap[sourceLang],
      target: langMap[targetLang],
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    translatedText: data.translatedText,
  };
}

/**
 * Traduit automatiquement le contenu d'une page légale
 * Prend le contenu source et génère la traduction pour l'autre langue
 */
export async function translateLegalPageContent(
  content: {
    title: string;
    subtitle?: string;
    content: string;
  },
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<{
  title: string;
  subtitle?: string;
  content: string;
} | TranslationError> {
  // Traduire le titre
  const titleResult = await translateText(content.title, sourceLang, targetLang);
  if ('error' in titleResult) {
    return titleResult;
  }

  // Traduire le sous-titre si présent
  let subtitleTranslated: string | undefined;
  if (content.subtitle) {
    const subtitleResult = await translateText(content.subtitle, sourceLang, targetLang);
    if ('error' in subtitleResult) {
      return subtitleResult;
    }
    subtitleTranslated = subtitleResult.translatedText;
  }

  // Traduire le contenu principal
  const contentResult = await translateText(content.content, sourceLang, targetLang);
  if ('error' in contentResult) {
    return contentResult;
  }

  return {
    title: titleResult.translatedText,
    subtitle: subtitleTranslated,
    content: contentResult.translatedText,
  };
}

/**
 * Détecte la langue d'un texte (basique, basé sur des mots communs et caractères)
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Détection du chinois par caractères
  const chineseCharRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  const chineseCharCount = (text.match(chineseCharRegex) || []).length;
  
  // Si plus de 10% des caractères sont chinois, c'est probablement du chinois
  if (chineseCharCount > text.length * 0.1) {
    return 'cn';
  }

  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'en', 'un', 'une', 'que', 'qui', 'dans', 'pour', 'sur', 'avec', 'sont', 'est', 'nous', 'vous'];
  const englishWords = ['the', 'a', 'an', 'of', 'and', 'in', 'to', 'for', 'on', 'with', 'is', 'are', 'we', 'you', 'that', 'this', 'it', 'from', 'by', 'as'];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let frenchCount = 0;
  let englishCount = 0;
  
  for (const word of words) {
    if (frenchWords.includes(word)) frenchCount++;
    if (englishWords.includes(word)) englishCount++;
  }
  
  return frenchCount > englishCount ? 'fr' : 'en';
}

