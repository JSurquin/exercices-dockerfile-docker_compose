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

const HOW_TO_SELL_ANSWER_FR = `Voici comment vendre vos skins CS2 sur MoonSkin :

1. **Connectez-vous** sur MoonSkin avec votre compte **Steam ou Discord** — pas de création de compte séparée.
2. Rendez-vous sur la [page Vendre](/sell) : votre inventaire CS2 s'affiche automatiquement (Trade Link Steam requis si vous utilisez Discord).
3. **Sélectionnez les skins** à vendre : MoonSkin calcule automatiquement leur valeur via notre système de pricing analytique. Le montant affiché est ce que vous recevrez (frais déduits). Pas de prix à fixer, pas d'attente d'acheteur — la vente est instantanée côté plateforme.
4. Cliquez sur **Créer la vente** pour lancer le processus.
5. **Acceptez l'offre d'échange** envoyée par notre bot Steam et vérifiez le Steam ID, le pseudo et la photo du bot affichés sur le site, pour vous assurer d'envoyer vos skins au bon compte.
6. Après le **trade hold Steam de 7 jours**, récupérez votre argent via l'une de nos [options de retrait](/payout) (carte, SEPA, crypto, etc.). Un KYC validé est requis avant le premier payout.`;

const HOW_TO_SELL_ANSWER_EN = `Here is how to sell your CS2 skins on MoonSkin:

1. **Sign in** to MoonSkin with your **Steam or Discord** account — no separate account creation.
2. Go to the [Sell page](/sell): your CS2 inventory loads automatically (Steam Trade Link required if you use Discord).
3. **Select the skins** you want to sell: MoonSkin automatically prices them using our analytics pricing system. The amount shown is what you will receive (fees deducted). No manual pricing, no waiting for a buyer — the sale is instant on our platform.
4. Click **Create sale** to start the process.
5. **Accept the trade offer** sent by our Steam bot and verify the Steam ID, username and avatar shown on the site, to make sure you send your skins to the right account.
6. After Steam's **7-day trade hold**, withdraw your money via one of our [cashout options](/payout) (card, SEPA, crypto, etc.). Validated KYC is required before your first payout.`;

const HOW_TO_SELL_ANSWER_CN = `在 MoonSkin 上出售 CS2 饰品的步骤如下：

1. 使用 **Steam 或 Discord** 账号**登录** MoonSkin — 无需单独注册账号。
2. 前往[出售页面](/sell)：CS2 库存会自动加载（若使用 Discord，需填写 Steam 交易链接）。
3. **选择要出售的饰品**：MoonSkin 通过分析定价系统自动估算价值。显示金额为扣除费用后您将收到的净额。无需手动定价，无需等待买家 — 平台侧出售即时完成。
4. 点击 **创建出售** 启动流程。
5. **接受**我们的 Steam 机器人发送的交易报价，并核对网站上显示的 Steam ID、昵称和头像，确保饰品发送到正确账号。
6. **Steam 7 天交易冷却**结束后，通过我们的[提现选项](/payout)（银行卡、SEPA、加密货币等）领取款项。首次提现前需完成 KYC 验证。`;

const SCAM_VICTIM_ANSWER_CN = `这是一个合理的问题 — 您担心的是是否会被骗，而不是如何骗人。

在 MoonSkin 上，以下是保护自己的方法：

• 在接受交易之前，请务必核实我们网站上显示的机器人 **Steam ID、用户名和头像**。
• **仅**通过 MoonSkin 平台将皮肤发送给我们的官方机器人。
• 警惕 API 诈骗：恶意第三方网站可能会取消您的合法报价并诱骗您接受虚假报价。

MoonSkin 绝不会在平台外索要皮肤。您的皮肤由我们的安全机器人处理，您在 7 天 Steam 交易冷却期后收到付款。

如果您认为将皮肤发送到了错误的账户，请在下方描述您的情况 — 客服人员可以为您提供帮助。`;

const SELL_OTHER_ACCOUNT_ANSWER_FR = `Rien de plus simple ! Sur MoonSkin, vous pouvez vendre les skins d'un **autre compte Steam** tout en restant connecté sur votre compte principal MoonSkin :

1. Rendez-vous sur la [page Vendre](/sell).
2. Dans le **panneau de droite**, modifiez votre **Trade Link** pour celui du compte Steam cible — l'inventaire de ce compte se charge automatiquement.
3. Sélectionnez les skins et finalisez la vente comme d'habitude : les paiements arrivent sur **votre compte MoonSkin principal** (KYC, IBAN, retraits).

C'est idéal pour vendre les skins de vos smurfs ou de vos clients sans éparpiller votre argent sur plusieurs comptes.

Pour aller plus loin : consultez notre [article d'aide](/help/sell-multiple-steam-accounts) ou le [guide blog](/blog/vendre-skins-plusieurs-comptes-steam).`;

const SELL_OTHER_ACCOUNT_ANSWER_EN = `It's straightforward! On MoonSkin, you can sell skins from **another Steam account** while staying signed in to your main MoonSkin account:

1. Go to the [Sell page](/sell).
2. In the **right-hand panel**, update your **Trade Link** to the target Steam account — that account's inventory loads automatically.
3. Select the skins and complete the sale as usual: payouts go to **your main MoonSkin account** (KYC, IBAN, withdrawals).

This is perfect for selling skins from smurf accounts or client accounts without splitting your earnings across multiple MoonSkin profiles.

Learn more in our [help article](/help/sell-multiple-steam-accounts) or this [blog guide](/blog/vendre-skins-plusieurs-comptes-steam).`;

const SELL_OTHER_ACCOUNT_ANSWER_CN = `非常简单！在 MoonSkin 上，您可以**保持主 MoonSkin 账号登录**的同时，出售**另一个 Steam 账号**的饰品：

1. 前往[出售页面](/sell)。
2. 在**右侧面板**中，将 **Trade Link** 更换为目标 Steam 账号的链接 — 该账号的库存会自动加载。
3. 选择饰品并完成出售：款项会进入**您的主 MoonSkin 账号**（KYC、IBAN、提现）。

非常适合出售小号或客户账号的饰品，而无需把资金分散在多个 MoonSkin 账号上。

延伸阅读：[帮助文章](/help/sell-multiple-steam-accounts) 或 [博客指南](/blog/vendre-skins-plusieurs-comptes-steam)。`;

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

/** Question « comment vendre mes skins » (flux MoonSkin, pas marketplace P2P). */
export function isHowToSellQuestion(message: string): boolean {
  const m = normalizeForMatch(message);

  if (
    /\b(pas\s+pu|ne\s+(peux|peut|pouvons|pouvez)\s+pas|cannot|can't|cant|unable|impossible|erreur|error|bug|bloque|blocked|restriction|lock|probleme|problem|marche\s+pas|doesn'?t\s+work)\b/.test(
      m,
    )
  ) {
    return false;
  }

  if (/[\u4e00-\u9fff]/.test(message)) {
    return /(如何|怎么|怎样).*(出售|卖|售出)/.test(message) || /(出售|卖).*(皮肤|饰品|cs2)/.test(message);
  }

  return (
    /\b(how\s+to\s+sell|how\s+do\s+i\s+sell|how\s+can\s+i\s+sell)\b/.test(m) ||
    /\b(comment|how)\b.*\b(vendre|sell|selling)\b.*\b(skin|skins|cs2|csgo|counter[\s-]?strike)\b/.test(
      m,
    ) ||
    /\b(vendre|sell)\b.*\b(mes|my)\b.*\b(skin|skins)\b/.test(m) ||
    /\bcomment\s+vendre\b/.test(m)
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

/** Vendre depuis un autre compte Steam (smurf, client, trade link alternatif). */
export function isSellFromOtherAccountQuestion(message: string): boolean {
  const m = normalizeForMatch(message);

  if (/[\u4e00-\u9fff]/.test(message)) {
    return (
      /(其他|别的|另一个|多个).*(steam|账号|账户).*(出售|卖|售出)/.test(message) ||
      /(出售|卖).*(其他|别的|另一个|多个).*(steam|账号|账户)/.test(message)
    );
  }

  return (
    /\b(sell|selling|vendre|vend)\b.*\b(other|another|different|second|alt)\b.*\b(account|compte|steam)\b/.test(
      m,
    ) ||
    /\b(other|another|different|second)\b.*\b(account|compte|steam)\b.*\b(sell|selling|vendre|vend)\b/.test(
      m,
    ) ||
    /\b(from|via|depuis|avec)\b.*\b(other|another|autre|different)\b.*\b(account|compte|steam)\b/.test(
      m,
    ) ||
    /\b(multiple|several|plusieurs)\b.*\b(steam\s*)?(account|accounts|compte|comptes)\b/.test(m) ||
    /\b(smurf|smurfs|alt\s+account|alt\s+accounts)\b.*\b(sell|selling|vendre|vend|skin|skins)\b/.test(
      m,
    ) ||
    /\b(sell|selling|vendre|vend)\b.*\b(smurf|smurfs|alt\s+account|alt\s+accounts)\b/.test(m) ||
    /\bchange\b.*\btrade\s*link\b.*\b(other|another|different|autre)\b/.test(m) ||
    /\b(other|another|autre)\b.*\btrade\s*link\b/.test(m)
  );
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

  if (isHowToSellQuestion(trimmed)) {
    return pickLocalizedAnswer(locale, {
      fr: HOW_TO_SELL_ANSWER_FR,
      en: HOW_TO_SELL_ANSWER_EN,
      cn: HOW_TO_SELL_ANSWER_CN,
    });
  }

  if (isCryptoTimingQuestion(trimmed)) {
    return pickLocalizedAnswer(locale, {
      fr: CRYPTO_TIMING_ANSWER_FR,
      en: CRYPTO_TIMING_ANSWER_EN,
      cn: CRYPTO_TIMING_ANSWER_CN,
    });
  }

  if (isSellFromOtherAccountQuestion(trimmed)) {
    return pickLocalizedAnswer(locale, {
      fr: SELL_OTHER_ACCOUNT_ANSWER_FR,
      en: SELL_OTHER_ACCOUNT_ANSWER_EN,
      cn: SELL_OTHER_ACCOUNT_ANSWER_CN,
    });
  }

  return null;
}
