/**
 * Réponses fiables pour des formulations fréquentes mal interprétées par le modèle IA.
 * Court-circuite Ollama quand une réponse canonique est disponible.
 */

import type { ChatAiLocale } from '@/lib/chat-ai-locale';

const CRYPTO_TIMING_ANSWER_FR = `Bonne question ! Il y a deux délais distincts à ne pas confondre :

1. **Trade hold Steam (7 jours)** — imposé par Valve sur tous les trades. MoonSkin ne peut déclencher votre paiement qu'après ce délai, quelle que soit la méthode choisie (carte, SEPA ou crypto).

2. **Envoi du paiement crypto** — une fois le trade hold terminé et votre paiement déclenché, les virements crypto via Whitepay sont **quasi-instantanés** : en général sous 10 minutes, parfois quelques minutes selon le réseau blockchain (USDT, ETH, BTC…).

Les délais de 1 à 5 jours concernent uniquement les virements SEPA Europe, **pas** les cryptomonnaies.`;

const CRYPTO_TIMING_ANSWER_EN = `Good question! There are two separate timelines you shouldn't mix up:

1. **Steam trade hold (7 days)** — required by Valve on all trades. MoonSkin can only trigger your payout after this period, regardless of your chosen method (card, SEPA, or crypto).

2. **Crypto payout delivery** — once the trade hold ends and your payout is triggered, crypto transfers via Whitepay are **near-instant**: usually under 10 minutes, sometimes a few minutes depending on the blockchain network (USDT, ETH, BTC…).

The 1 to 5 day delays apply only to SEPA Europe transfers, **not** cryptocurrencies.`;

const CRYPTO_TIMING_ANSWER_CN = `好问题！有两个不同的时间线，请不要混淆：

1. **Steam 交易冷却（7 天）** — Valve 对所有交易强制要求。无论您选择哪种方式（银行卡、SEPA 或加密货币），MoonSkin 都必须在此期限之后才能触发您的付款。

2. **加密货币付款发送** — 交易冷却结束且付款触发后，通过 Whitepay 的加密货币转账**几乎即时**：通常 10 分钟内，有时根据区块链网络（USDT、ETH、BTC…）只需几分钟。

1 到 5 天的延迟仅适用于欧洲 SEPA 转账，**不适用于**加密货币。`;

const SCAM_VICTIM_ANSWER_FR = `C'est une question légitime — vous vous demandez si vous risquez de vous faire arnaquer, pas si vous pouvez arnaquer quelqu'un.

Sur MoonSkin, voici comment vous protéger :

• Vérifiez toujours le **Steam ID, le pseudo et la photo** du bot affichés sur notre site avant d'accepter un trade.
• Envoyez vos skins **uniquement** à notre bot officiel via la plateforme MoonSkin.
• Méfiez-vous des API scams : un site tiers malveillant peut annuler votre offre légitime et vous faire accepter une fausse offre.

MoonSkin ne vous demandera jamais de skins hors de la plateforme. Vos skins sont traités par notre bot sécurisé et vous recevez votre paiement après le trade hold de 7 jours.

Si vous pensez avoir envoyé vos skins au mauvais compte, décrivez votre situation ci-dessous — un modérateur pourra vous aider.`;

const SCAM_VICTIM_ANSWER_EN = `That's a fair question — you're wondering if you might get scammed, not whether you can scam someone.

On MoonSkin, here's how to stay safe:

• Always verify the bot's **Steam ID, username, and avatar** shown on our site before accepting a trade.
• Send your skins **only** to our official bot through the MoonSkin platform.
• Watch out for API scams: a malicious third-party site can cancel your legitimate offer and trick you into accepting a fake one.

MoonSkin will never ask for skins outside the platform. Your skins are handled by our secure bot and you receive your payout after the 7-day Steam trade hold.

If you think you sent your skins to the wrong account, describe your situation below — a moderator can help.`;

const SCAM_VICTIM_ANSWER_CN = `这是一个合理的问题 — 您担心的是是否会被骗，而不是如何骗人。

在 MoonSkin 上，以下是保护自己的方法：

• 在接受交易之前，请务必核实我们网站上显示的机器人 **Steam ID、用户名和头像**。
• **仅**通过 MoonSkin 平台将皮肤发送给我们的官方机器人。
• 警惕 API 诈骗：恶意第三方网站可能会取消您的合法报价并诱骗您接受虚假报价。

MoonSkin 绝不会在平台外索要皮肤。您的皮肤由我们的安全机器人处理，您在 7 天 Steam 交易冷却期后收到付款。

如果您认为将皮肤发送到了错误的账户，请在下方描述您的情况 — 客服人员可以为您提供帮助。`;

function pickLocalizedAnswer<T extends ChatAiLocale>(
  locale: T,
  answers: Record<ChatAiLocale, string>,
): string {
  return answers[locale] ?? answers.fr;
}

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
    /\b(me\s+faire|me\s+fais|je\s+me\s+fais|je\s+vais\s+me\s+faire|get\s+scammed|being\s+scammed|what\s+if\s+i\s+get\s+scammed)\b.*\b(scam|arnaqu)/.test(
      m,
    ) ||
    /\b(get\s+scammed|being\s+scammed|what\s+if\s+i\s+get\s+scammed)\b/.test(m) ||
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

export function resolveTrustedAiAnswer(
  message: string,
  locale: ChatAiLocale = 'fr',
): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (isScamVictimConcern(trimmed)) {
    return pickLocalizedAnswer(locale, {
      fr: SCAM_VICTIM_ANSWER_FR,
      en: SCAM_VICTIM_ANSWER_EN,
      cn: SCAM_VICTIM_ANSWER_CN,
    });
  }

  if (isCryptoTimingQuestion(trimmed)) {
    return pickLocalizedAnswer(locale, {
      fr: CRYPTO_TIMING_ANSWER_FR,
      en: CRYPTO_TIMING_ANSWER_EN,
      cn: CRYPTO_TIMING_ANSWER_CN,
    });
  }

  return null;
}
