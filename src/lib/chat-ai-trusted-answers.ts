/**
 * Réponses fiables pour des formulations fréquentes mal interprétées par le modèle IA.
 * Court-circuite Ollama quand une réponse canonique est disponible.
 */

const CRYPTO_TIMING_ANSWER = `Bonne question ! Il y a deux délais distincts à ne pas confondre :

1. **Trade hold Steam (7 jours)** — imposé par Valve sur tous les trades. MoonSkin ne peut déclencher votre paiement qu'après ce délai, quelle que soit la méthode choisie (carte, SEPA ou crypto).

2. **Envoi du paiement crypto** — une fois le trade hold terminé et votre paiement déclenché, les virements crypto via Whitepay sont **quasi-instantanés** : en général sous 10 minutes, parfois quelques minutes selon le réseau blockchain (USDT, ETH, BTC…).

Les délais de 1 à 5 jours concernent uniquement les virements SEPA Europe, **pas** les cryptomonnaies.`;

const SCAM_VICTIM_ANSWER = `C'est une question légitime — vous vous demandez si vous risquez de vous faire arnaquer, pas si vous pouvez arnaquer quelqu'un.

Sur MoonSkin, voici comment vous protéger :

• Vérifiez toujours le **Steam ID, le pseudo et la photo** du bot affichés sur notre site avant d'accepter un trade.
• Envoyez vos skins **uniquement** à notre bot officiel via la plateforme MoonSkin.
• Méfiez-vous des API scams : un site tiers malveillant peut annuler votre offre légitime et vous faire accepter une fausse offre.

MoonSkin ne vous demandera jamais de skins hors de la plateforme. Vos skins sont traités par notre bot sécurisé et vous recevez votre paiement après le trade hold de 7 jours.

Si vous pensez avoir envoyé vos skins au mauvais compte, décrivez votre situation ci-dessous — un modérateur pourra vous aider.`;

function normalizeForMatch(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** L'utilisateur craint d'être victime d'une arnaque (pas qu'il veut frauder). */
export function isScamVictimConcern(message: string): boolean {
  const m = normalizeForMatch(message);

  if (/\b(faire\s+du\s+scam|scammer\s+les\s+gens|arnaquer\s+(les\s+)?(gens|utilisateurs|clients))\b/.test(m)) {
    return false;
  }

  return (
    /\b(me\s+faire|me\s+fais|je\s+me\s+fais|je\s+vais\s+me\s+faire|get\s+scammed|being\s+scammed)\b.*\b(scam|arnaqu)/.test(
      m,
    ) ||
    /\b(et\s+si\s+)?(je\s+)?(me\s+fais|me\s+faire)\s+(scam|arnaqu)/.test(m) ||
    /\b(peur|crainte|risque|inquiet|inquiete)\b.*\b(arnaqu|scam|fraude)/.test(m) ||
    /\b(arnaqu|scam)\b.*\b(moi|moi-meme|victime|prot[ée]g|s[ée]cur|fiable|confiance|moon\s*skin|moonskin)\b/.test(
      m,
    ) ||
    /\b(c[ée]s\s+s[ûu]r|est-ce\s+s[ûu]r|safe)\b.*\b(scam|arnaqu)/.test(m)
  );
}

/** Question sur la rapidité des paiements crypto (souvent confondue avec SEPA ou trade hold). */
export function isCryptoTimingQuestion(message: string): boolean {
  const m = normalizeForMatch(message);

  const mentionsCrypto =
    /\b(crypto|cryptomonnaie|cryptomonnaies|bitcoin|btc|ethereum|eth|usdt|usdc|whitepay)\b/.test(
      m,
    ) || /\bvirement\s+crypto\b/.test(m);

  const asksTiming =
    /\b(instantan|rapide|delai|délai|combien\s+de\s+temps|how\s+long|fast|quick|temps\s+dattente|temps\s+d'attente|sous\s+combien)\b/.test(
      m,
    ) || /\b(1\s+a\s+5|1-5|plusieurs\s+jours)\b.*\b(jour|day)/.test(m);

  return mentionsCrypto && (asksTiming || /\binstantan/.test(m));
}

export function resolveTrustedAiAnswer(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (isScamVictimConcern(trimmed)) {
    return SCAM_VICTIM_ANSWER;
  }

  if (isCryptoTimingQuestion(trimmed)) {
    return CRYPTO_TIMING_ANSWER;
  }

  return null;
}
