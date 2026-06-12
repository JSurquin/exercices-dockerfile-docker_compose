import { isOllamaConfigured } from '@/lib/ollama';

export const OFF_TOPIC_REFUSAL_MESSAGE =
  "Je suis l'assistant MoonSkin et je ne peux répondre qu'aux questions liées à la plateforme : vente de skins CS2, trades Steam, paiements, KYC ou support. Pour toute autre demande, merci de contacter un modérateur humain.";

const MOONSKIN_KEYWORDS =
  /\b(moonskin|moon\s*skin|skin(?:s)?|cs2|csgo|counter[\s-]?strike|steam|trade(?:\s*link|\s*hold|\s*offer)?|payout|paiement|pay(?:er|ement)?|sepa|crypto|bitcoin|ethereum|usdt|kyc|iban|cashout|retrait|estimation|giveaway|ticket|xp|mod[ée]rateur|bot|inventaire|skinplace|vendre|vente|frais|commission|affiliation|fragment|trade\s*link|steam\s*guard|carte|visa|mastercard|flexify|whitepay|trade\s*offer|offre\s*steam|d[ée]lai|remboursement|litige|bug|probl[èe]me|aide|support|compte|connexion|login|d[ée]p[ôo]t|retrait|wallet|portefeuille)\b/i;

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(recette|tarte|cuisine|cuire|p[âa]tisserie|gateau|g[âa]teau|repas|restaurant|manger|boire)\b/i,
  /\b(devine|blague|raconte(?:r)?(?:\s+\w+){0,3}\s+histoire|po[èe]me|devinette)\b/i,
  /\b(devoir|homework|dissertation|r[ée]daction|exercice\s+de\s+math)\b/i,
  /\b(m[ée]t[ée]o|weather|football|match|politique|actualit[ée]|news)\b/i,
  /\b(code(?:r)?|programme(?:r)?|python|javascript|script)\b/i,
  /\b(fais(?:es)?|donne(?:z)?|écris|ecris|write|make|give)\s+(?:moi|me)\s+(?:une|un|la|le)\s+(?:recette|po[èe]me|histoire|blague|devinette)/i,
];

const GREETING_ONLY =
  /^(?:bonjour|salut|hello|hi|hey|bonsoir|coucou|merci|thanks|thank you|ok|d'accord|daccord|oui|non|help|aide)[\s!.?]*$/i;

const SUPPORT_CATEGORIES = new Set([
  'trade',
  'payment',
  'paiement',
  'support',
  'kyc',
  'general',
  'estimation',
  'giveaway',
  'affiliation',
]);

export function shouldAiReplyToConversation(input: {
  assignedTo: string | null;
  status: string;
  hasModeratorMessage: boolean;
}): boolean {
  if (!isOllamaConfigured()) return false;
  if (input.status === 'CLOSED' || input.status === 'ARCHIVED' || input.status === 'DELETED') return false;
  if (input.assignedTo) return false;
  if (input.hasModeratorMessage) return false;
  return true;
}

function normalizeMessage(content: string): string {
  return content.trim().replace(/\s+/g, ' ');
}

function hasMoonSkinContext(input: {
  message: string;
  category?: string | null;
  priorUserMessages?: string[];
}): boolean {
  if (input.category && SUPPORT_CATEGORIES.has(input.category.toLowerCase())) {
    return true;
  }

  if (MOONSKIN_KEYWORDS.test(input.message)) {
    return true;
  }

  const prior = input.priorUserMessages ?? [];
  return prior.some((msg) => MOONSKIN_KEYWORDS.test(msg));
}

export function evaluateUserMessageForAi(input: {
  message: string;
  category?: string | null;
  priorUserMessages?: string[];
}): { allowed: boolean; refusalMessage?: string } {
  const message = normalizeMessage(input.message);

  if (!message) {
    return { allowed: false, refusalMessage: OFF_TOPIC_REFUSAL_MESSAGE };
  }

  if (GREETING_ONLY.test(message)) {
    return { allowed: true };
  }

  const hasContext = hasMoonSkinContext(input);

  const isOffTopic = OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
  if (isOffTopic && !hasContext) {
    return { allowed: false, refusalMessage: OFF_TOPIC_REFUSAL_MESSAGE };
  }

  if (MOONSKIN_KEYWORDS.test(message)) {
    return { allowed: true };
  }

  if (hasContext) {
    return { allowed: true };
  }

  // Questions courtes ambiguës dans un ticket support (ex. "comment ça marche ?")
  if (message.length <= 120 && /\?/.test(message)) {
    return { allowed: true };
  }

  return { allowed: false, refusalMessage: OFF_TOPIC_REFUSAL_MESSAGE };
}
