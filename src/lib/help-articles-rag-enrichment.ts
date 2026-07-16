import type { Locale } from '@/lib/i18n';

/**
 * Contenu enrichi issu du RAG (scripts/seed-rag.ts) pour alimenter les articles d'aide CMS.
 * Clé = slug article help ; valeur = contenu Markdown à fusionner avec le texte i18n.
 */
export const HELP_ARTICLE_RAG_ENRICHMENT_FR: Record<string, string> = {
  'create-account': `## Connexion Steam

MoonSkin utilise **Steam OpenID** — il n'y a pas de création de compte manuelle ni de mot de passe séparé.`,

  'steam-connection': `## Trade Link Steam

Si ton trade link est rejeté :
1. Va sur Steam → Paramètres → Confidentialité → Mon profil de trades
2. Génère un nouveau lien de trade
3. Vérifie que ton profil Steam n'est pas en mode « Privé »
4. Assure-toi que tu n'as pas de restriction de trade active

## Steam Guard

Pour vendre sur MoonSkin, ton compte Steam doit avoir **Steam Guard mobile activé** (obligatoire).`,

  'kyc-step-by-step': `## Documents demandés

- Pièce d'identité (carte d'identité ou passeport)
- Selfie avec la pièce d'identité
- Justificatif de domicile (si requis)

**Délai de traitement :** généralement sous 24–48 h.
MoonSkin ne stocke pas tes documents bruts, uniquement des références fournies par notre prestataire KYC certifié.`,

  'first-trade': `## Processus de vente étape par étape

1. Connecte-toi avec Steam OpenID
2. Entre ton Trade Link Steam
3. Ton inventaire CS2 s'affiche automatiquement — sélectionne les skins à vendre
4. MoonSkin estime leur valeur en temps réel via l'API Skinplace
5. Confirme la vente — un ticket de suivi est créé avec un ID unique
6. Notre bot Steam envoie une offre d'échange — accepte-la dans les 15 minutes
7. Le trade hold Steam de 7 jours commence
8. Le paiement est déclenché automatiquement le 8ème jour`,

  'how-to-sell': `## Processus complet

Il n'y a **PAS** de bouton « Ajouter un skin », PAS de fixation de prix manuelle — tout est automatique via Skinplace.

Pour chaque vente : estimation → ticket → acceptation du trade Steam → attente du hold → encaissement.`,

  'price-estimation': `## Calcul du prix

MoonSkin utilise l'API Skinplace pour estimer la valeur marchande de chaque skin.
Le montant affiché prend en compte :
- Le prix brut basé sur le marché Steam
- Les frais de cashout (0,5 % du montant brut)
- Les frais réseau selon la méthode de paiement choisie
- Le montant net final que tu recevras

Les prix sont mis à jour toutes les **5 minutes** maximum.`,

  'trade-hold': `## Pourquoi 7 jours ?

Steam impose un « trade hold » de **7 jours** sur tous les échanges d'objets entre comptes.
Ce délai est obligatoire et fixé par Valve, indépendamment de MoonSkin.
Le paiement est déclenché automatiquement le **8ème jour**.

Si tu as Steam Guard mobile activé depuis plus de 7 jours, certains trades peuvent être instantanés.`,

  fees: `## Détail des frais

**Frais de cashout :** 0,5 % du montant brut de la vente.

**Frais réseau selon la méthode :**
- Carte bancaire (Visa/Mastercard) : variable (~0,5–1 %)
- Virement SEPA France : 0 € en général
- Virement SEPA Europe : entre 0 et 2 €
- Cryptomonnaies : frais réseau blockchain (variable)

**Exemple :** pour 100 € brut, frais cashout = 0,50 €, montant net ≈ 99,50 € (hors frais réseau).`,

  'payment-methods': `## Méthodes disponibles

1. **Carte bancaire** (Visa / Mastercard) via Flexify — paiement rapide, quelques minutes à 24 h
2. **Virement SEPA** :
   - SEPA France (via Qonto) : traitement chaque jour vers 18 h
   - SEPA Europe : 1 à 3 jours ouvrés
3. **Cryptomonnaies** (via Whitepay) — USDT, ETH, BTC — quasi-instantané après confirmation blockchain

Un **KYC** est obligatoire pour tous les paiements.`,

  'payment-delays': `## Délais SEPA

**SEPA France :** traitement chaque jour vers 18 h (Paris), réception le jour même ou le lendemain.

**SEPA Europe :** 1 à 3 jours ouvrés. Si non reçu après 5 jours, contacte le support.

## Délais Crypto

Une fois le trade hold terminé, le virement crypto est **quasi-instantané** — en général sous 10 minutes.`,

  'iban-verification': `## Vérification renforcée

Le premier virement SEPA et tout changement d'IBAN nécessitent une vérification renforcée :
- OTP par email ou SMS
- Micro-virement avec code dans le libellé

**Cooldown de 7 jours** après changement d'IBAN (sauf si micro-vérification validée).`,

  'payment-issue': `## Que vérifier ?

- KYC validé ?
- IBAN correct ?
- Trade hold terminé ?

Pour la crypto : vérifie l'adresse wallet **et** le bon réseau blockchain.`,

  'secure-account': `## Protection contre les arnaques

- Vérifie le Steam ID, pseudo et photo du bot affichés sur MoonSkin avant chaque trade
- MoonSkin ne te demandera **jamais** de skins hors de la plateforme
- Active Steam Guard et surveille les e-mails Steam`,

  scam: `## Est-ce que je risque de me faire arnaquer ?

Si tu crains d'être **victime** d'une arnaque, voici les protections MoonSkin :

- Tu vends tes skins uniquement via notre plateforme et notre bot officiel Steam
- Le Steam ID, pseudo et photo du bot sont affichés sur le site — vérifie-les avant chaque trade
- MoonSkin ne te demandera **jamais** de skins hors de la plateforme
- Paiement automatique après le trade hold de 7 jours

## API Scam — le risque principal

Un API scam Steam est une arnaque où un site malveillant a obtenu ta clé API Steam.
Le bot malveillant annule ton offre légitime et t'envoie une fausse offre vers un compte frauduleux.

**Signes :**
- L'offre de trade est annulée et une nouvelle apparaît
- Le compte destinataire a un profil similaire à notre bot mais un Steam ID différent
- Tu envoies les skins mais ils n'apparaissent pas sur MoonSkin

**Comment vérifier :**
- Vérifie le Steam ID, le pseudo et la photo de profil du bot sur MoonSkin

**Si victime :**
- Effectue un « reverse trade » pour tenter de récupérer tes items
- Change ton mot de passe Steam immédiatement
- Révoque toutes les autorisations API Steam`,

  'report-suspicious': `## API Scam Steam

Un API scam est une arnaque où un site malveillant a obtenu ta clé API Steam.

**Signes :**
- L'offre de trade est annulée et une nouvelle apparaît
- Le compte destinataire a un profil similaire à notre bot mais un Steam ID différent

**Si tu as été victime :**
- Effectue un « reverse trade »
- Change ton mot de passe Steam immédiatement
- Révoque toutes les autorisations API Steam`,

  'steam-trade-error': `## Skin non détecté ?

- Vérifie que ton inventaire Steam est en mode **Public**
- Actualise la page (cache 5 minutes)
- Assure-toi que les skins ne sont pas en cours de trade
- Certains items non-tradables ne peuvent pas être vendus`,

  'steam-connection-issue': `## Trade link invalide ?

1. Steam → Paramètres → Confidentialité → Mon profil de trades
2. Génère un nouveau lien de trade
3. Vérifie que ton profil n'est pas « Privé »
4. Vérifie l'absence de restriction de trade active`,

  'sell-multiple-steam-accounts': `## Changer de Trade Link sur la page Vendre

1. Connecte-toi sur MoonSkin avec ton compte principal (Steam ou Discord).
2. Va sur la page **Vendre** — le panneau de droite affiche ton compte Steam connecté et ton Trade Link actuel.
3. Clique sur **Modifier** à côté du Trade Link et colle le lien du compte Steam cible.
4. L'inventaire CS2 de ce compte se charge automatiquement — sélectionne les skins et finalise la vente.
5. Les paiements (SEPA, carte, crypto) arrivent sur **ton compte MoonSkin principal**, pas sur le compte Steam source.

## Cas d'usage

- Vendre les skins d'un **smurf** ou d'un second compte Steam
- Vendre pour un **client** sans créer un compte MoonSkin séparé
- Centraliser tous tes revenus sur un seul compte (KYC, IBAN, historique)

## Points importants

- Tu restes connecté sur ton compte MoonSkin principal pendant toute l'opération.
- Le Trade Link doit appartenir au compte dont tu veux vendre l'inventaire.
- Le compte Steam source doit avoir un inventaire **public** et Steam Guard activé.`,
};

export const HELP_ARTICLE_RAG_ENRICHMENT_EN: Record<string, string> = {
  'create-account': `## Steam sign-in

MoonSkin uses **Steam OpenID** — there is no manual account creation or separate password.`,

  'steam-connection': `## Steam Trade Link

If your trade link is rejected:
1. Go to Steam → Settings → Privacy → My trade offers profile
2. Generate a new trade link
3. Make sure your Steam profile is not set to "Private"
4. Check that you have no active trade restriction

## Steam Guard

To sell on MoonSkin, your Steam account must have **Steam Guard Mobile enabled** (required).`,

  'kyc-step-by-step': `## Required documents

- ID document (national ID card or passport)
- Selfie with the ID document
- Proof of address (if required)

**Processing time:** usually within 24–48 hours.
MoonSkin does not store your raw documents, only references provided by our certified KYC provider.`,

  'first-trade': `## Step-by-step selling process

1. Sign in with Steam OpenID
2. Enter your Steam Trade Link
3. Your CS2 inventory loads automatically — select the skins to sell
4. MoonSkin estimates their value in real time via the Skinplace API
5. Confirm the sale — a tracking ticket is created with a unique ID
6. Our Steam bot sends a trade offer — accept it within 15 minutes
7. Steam's 7-day trade hold begins
8. Payment is triggered automatically on day 8`,

  'how-to-sell': `## Full process

There is **NO** "Add a skin" button and **NO** manual price setting — everything is automatic via Skinplace.

For each sale: quote → ticket → accept the Steam trade → wait for the hold → get paid.`,

  'price-estimation': `## Price calculation

MoonSkin uses the Skinplace API to estimate the market value of each skin.
The amount shown includes:
- Gross price based on the Steam market
- Cashout fees (0.5% of gross amount)
- Network fees depending on the payout method chosen
- Final net amount you will receive

Prices are updated at most every **5 minutes**.`,

  'trade-hold': `## Why 7 days?

Steam enforces a **7-day trade hold** on all item exchanges between accounts.
This delay is mandatory and set by Valve, independent of MoonSkin.
Payment is triggered automatically on **day 8**.

If you have had Steam Guard Mobile enabled for more than 7 days, some trades may be instant.`,

  fees: `## Fee breakdown

**Cashout fee:** 0.5% of the gross sale amount.

**Network fees by method:**
- Bank card (Visa/Mastercard): variable (~0.5–1%)
- SEPA transfer France: usually €0
- SEPA transfer Europe: €0 to €2
- Cryptocurrencies: blockchain network fees (variable)

**Example:** for €100 gross, cashout fee = €0.50, net amount ≈ €99.50 (excluding network fees).`,

  'payment-methods': `## Available methods

1. **Bank card** (Visa / Mastercard) via Flexify — fast payout, from a few minutes to 24 h
2. **SEPA bank transfer**:
   - SEPA France (via Qonto): processed daily around 6 p.m.
   - SEPA Europe: 1 to 3 business days
3. **Cryptocurrencies** (via Whitepay) — USDT, ETH, BTC — near-instant after blockchain confirmation

**KYC** is required for all payouts.`,

  'payment-delays': `## SEPA timing

**SEPA France:** processed daily around 6 p.m. (Paris), received the same day or next day.

**SEPA Europe:** 1 to 3 business days. If not received after 5 days, contact support.

## Crypto timing

Once the trade hold ends, crypto payouts are **near-instant** — usually within 10 minutes.`,

  'iban-verification': `## Enhanced verification

Your first SEPA payout and any IBAN change require enhanced verification:
- OTP by email or SMS
- Micro-deposit with a code in the reference

**7-day cooldown** after an IBAN change (unless micro-verification is completed).`,

  'payment-issue': `## What to check

- Is KYC approved?
- Is the IBAN correct?
- Is the trade hold finished?

For crypto: verify the wallet address **and** the correct blockchain network.`,

  'secure-account': `## Scam protection

- Verify the Steam ID, username and avatar of the bot shown on MoonSkin before every trade
- MoonSkin will **never** ask for your skins outside the platform
- Enable Steam Guard and watch for Steam emails`,

  scam: `## Could I get scammed?

If you are worried about being a **victim** of a scam, here is how MoonSkin protects you:

- You sell your skins only through our platform and our official Steam bot
- The bot's Steam ID, username and avatar are shown on the site — verify them before every trade
- MoonSkin will **never** ask for your skins outside the platform
- Automatic payout after the 7-day trade hold

## API scam — the main risk

A Steam API scam happens when a malicious site has obtained your Steam API key.
The malicious bot cancels your legitimate offer and sends a fake one to a fraudulent account.

**Warning signs:**
- The trade offer is cancelled and a new one appears
- The recipient account looks like our bot but has a different Steam ID
- You send the skins but they do not appear on MoonSkin

**How to verify:**
- Check the Steam ID, username and profile picture of the bot on MoonSkin

**If you are a victim:**
- Perform a "reverse trade" to try to recover your items
- Change your Steam password immediately
- Revoke all Steam API authorisations`,

  'report-suspicious': `## Steam API scam

An API scam is a fraud where a malicious site has obtained your Steam API key.

**Warning signs:**
- The trade offer is cancelled and a new one appears
- The recipient account looks like our bot but has a different Steam ID

**If you were a victim:**
- Perform a "reverse trade"
- Change your Steam password immediately
- Revoke all Steam API authorisations`,

  'steam-trade-error': `## Skin not detected?

- Make sure your Steam inventory is set to **Public**
- Refresh the page (5-minute cache)
- Ensure the skins are not already in a pending trade
- Some non-tradable items cannot be sold`,

  'steam-connection-issue': `## Invalid trade link?

1. Steam → Settings → Privacy → My trade offers profile
2. Generate a new trade link
3. Make sure your profile is not "Private"
4. Check that you have no active trade restriction`,

  'sell-multiple-steam-accounts': `## Change Trade Link on the Sell page

1. Sign in to MoonSkin with your main account (Steam or Discord).
2. Go to the **Sell** page — the right-hand panel shows your connected Steam account and current Trade Link.
3. Click **Edit** next to the Trade Link and paste the target Steam account's link.
4. That account's CS2 inventory loads automatically — select skins and complete the sale.
5. Payouts (SEPA, card, crypto) go to **your main MoonSkin account**, not the source Steam account.

## Use cases

- Sell skins from a **smurf** or secondary Steam account
- Sell for a **client** without creating a separate MoonSkin account
- Centralize all earnings on one account (KYC, IBAN, history)

## Important notes

- You stay signed in to your main MoonSkin account throughout.
- The Trade Link must belong to the account whose inventory you want to sell.
- The source Steam account must have a **public** inventory and Steam Guard enabled.`,
};

export const HELP_ARTICLE_RAG_ENRICHMENT_CN: Record<string, string> = {
  'create-account': `## Steam 登录

MoonSkin 使用 **Steam OpenID** — 无需手动注册账号，也没有单独的密码。`,

  'steam-connection': `## Steam 交易链接

如果交易链接被拒绝：
1. 打开 Steam → 设置 → 隐私 → 我的交易报价资料
2. 生成新的交易链接
3. 确认 Steam 个人资料未设为「私密」
4. 确认没有交易限制

## Steam 令牌

在 MoonSkin 上出售饰品，您的 Steam 账号必须启用 **Steam 手机令牌**（必填）。`,

  'kyc-step-by-step': `## 所需文件

- 身份证件（身份证或护照）
- 手持证件自拍
- 地址证明（如需要）

**处理时间：** 通常 24–48 小时内。
MoonSkin 不存储原始文件，仅保存认证 KYC 服务商提供的参考编号。`,

  'first-trade': `## 逐步出售流程

1. 使用 Steam OpenID 登录
2. 填写 Steam 交易链接
3. CS2 库存自动加载 — 选择要出售的饰品
4. MoonSkin 通过 Skinplace API 实时估算价值
5. 确认出售 — 创建带唯一 ID 的跟踪工单
6. 我们的 Steam 机器人发送交易报价 — 请在 15 分钟内接受
7. Steam 7 天交易冷却开始
8. 第 8 天自动触发付款`,

  'how-to-sell': `## 完整流程

**没有**「添加饰品」按钮，**不能**手动定价 — 一切通过 Skinplace 自动完成。

每次出售：估价 → 工单 → 接受 Steam 交易 → 等待冷却 → 收款。`,

  'price-estimation': `## 价格计算

MoonSkin 使用 Skinplace API 估算每件饰品的市场价值。
显示金额包括：
- 基于 Steam 市场的毛价
- 提现手续费（毛额的 0.5%）
- 根据所选付款方式的网络费用
- 您将收到的最终净额

价格最多每 **5 分钟** 更新一次。`,

  'trade-hold': `## 为什么是 7 天？

Steam 对所有账号间物品交换强制 **7 天交易冷却**。
此延迟由 Valve 规定，与 MoonSkin 无关。
付款在 **第 8 天** 自动触发。

若 Steam 手机令牌已启用超过 7 天，部分交易可能即时完成。`,

  fees: `## 费用明细

**提现手续费：** 出售毛额的 0.5%。

**各方式网络费用：**
- 银行卡（Visa/Mastercard）：浮动（约 0.5–1%）
- 法国 SEPA 转账：通常为 0 €
- 欧洲 SEPA 转账：0 至 2 €
- 加密货币：区块链网络费（浮动）

**示例：** 毛额 100 €，提现费 = 0,50 €，净额 ≈ 99,50 €（不含网络费）。`,

  'payment-methods': `## 可用方式

1. **银行卡**（Visa / Mastercard）经 Flexify — 快速到账，数分钟至 24 小时
2. **SEPA 银行转账**：
   - 法国 SEPA（经 Qonto）：每天约 18 点处理
   - 欧洲 SEPA：1 至 3 个工作日
3. **加密货币**（经 Whitepay）— USDT、ETH、BTC — 区块链确认后近乎即时

所有付款均需完成 **KYC**。`,

  'payment-delays': `## SEPA 时效

**法国 SEPA：** 每天约 18 点（巴黎）处理，当天或次日到账。

**欧洲 SEPA：** 1 至 3 个工作日。超过 5 天未收到请联系客服。

## 加密货币时效

交易冷却结束后，加密货币转账 **近乎即时** — 通常 10 分钟内。`,

  'iban-verification': `## 加强验证

首次 SEPA 提现及每次更改 IBAN 均需加强验证：
- 邮件或短信 OTP
- 带验证码的小额转账

更改 IBAN 后 **7 天冷却期**（完成微验证可例外）。`,

  'payment-issue': `## 请检查

- KYC 是否已通过？
- IBAN 是否正确？
- 交易冷却是否已结束？

加密货币：请核对钱包地址 **及** 正确的区块链网络。`,

  'secure-account': `## 防骗提示

- 每次交易前核对 MoonSkin 上显示的机器人 Steam ID、昵称和头像
- MoonSkin **绝不会** 在平台外索要您的饰品
- 启用 Steam 令牌并留意 Steam 邮件`,

  scam: `## 我会被骗吗？

如果您担心成为诈骗 **受害者**，MoonSkin 的保护措施如下：

- 您仅通过我们的平台和官方 Steam 机器人出售饰品
- 网站上显示机器人的 Steam ID、昵称和头像 — 每次交易前请核对
- MoonSkin **绝不会** 在平台外索要您的饰品
- 7 天交易冷却结束后自动付款

## API 骗局 — 主要风险

Steam API 骗局是指恶意网站获取了您的 Steam API 密钥。
恶意机器人会取消您的合法报价，并向诈骗账号发送虚假报价。

**警示信号：**
- 交易报价被取消后出现新报价
- 接收方账号看似我们的机器人但 Steam ID 不同
- 您发送了饰品但未在 MoonSkin 上显示

**如何验证：**
- 在 MoonSkin 上核对机器人的 Steam ID、昵称和头像

**若已成为受害者：**
- 尝试「反向交易」以找回物品
- 立即更改 Steam 密码
- 撤销所有 Steam API 授权`,

  'report-suspicious': `## Steam API 骗局

API 骗局是指恶意网站获取了您的 Steam API 密钥。

**警示信号：**
- 交易报价被取消后出现新报价
- 接收方账号看似我们的机器人但 Steam ID 不同

**若已成为受害者：**
- 执行「反向交易」
- 立即更改 Steam 密码
- 撤销所有 Steam API 授权`,

  'steam-trade-error': `## 饰品未检测到？

- 确认 Steam 库存设为 **公开**
- 刷新页面（5 分钟缓存）
- 确认饰品未处于交易中
- 部分不可交易物品无法出售`,

  'steam-connection-issue': `## 交易链接无效？

1. Steam → 设置 → 隐私 → 我的交易报价资料
2. 生成新的交易链接
3. 确认个人资料未设为「私密」
4. 确认没有交易限制`,

  'sell-multiple-steam-accounts': `## 在出售页面更换 Trade Link

1. 使用主账号（Steam 或 Discord）登录 MoonSkin。
2. 进入**出售页面** — 右侧面板显示已连接的 Steam 账号和当前 Trade Link。
3. 点击 Trade Link 旁的**修改**，粘贴目标 Steam 账号的链接。
4. 该账号的 CS2 库存自动加载 — 选择饰品并完成出售。
5. 付款（SEPA、银行卡、加密货币）进入**您的主 MoonSkin 账号**，而非来源 Steam 账号。

## 适用场景

- 出售**小号**或第二个 Steam 账号的饰品
- 为**客户**代售，无需创建单独的 MoonSkin 账号
- 将所有收入集中在一个账号（KYC、IBAN、历史记录）

## 重要提示

- 整个过程中您保持主 MoonSkin 账号登录。
- Trade Link 必须属于您要出售库存的 Steam 账号。
- 来源 Steam 账号库存须为**公开**，且已启用 Steam 令牌。`,
};

export function getHelpArticleRagEnrichment(slug: string, locale: Locale): string | undefined {
  if (locale === 'en') return HELP_ARTICLE_RAG_ENRICHMENT_EN[slug];
  if (locale === 'cn') return HELP_ARTICLE_RAG_ENRICHMENT_CN[slug];
  return HELP_ARTICLE_RAG_ENRICHMENT_FR[slug];
}

export function buildHelpArticleContent(baseBody: string, slug: string, locale: Locale): string {
  const ragExtra = getHelpArticleRagEnrichment(slug, locale);
  if (!ragExtra) return baseBody;
  return `${baseBody.trim()}\n\n${ragExtra.trim()}`;
}

/** Fusionne l'enrichissement RAG si absent du contenu (ex. articles CMS seedés sans traduction). */
export function applyRagEnrichmentIfNeeded(slug: string, locale: Locale, content: string): string {
  const enrichment = getHelpArticleRagEnrichment(slug, locale);
  if (!enrichment) return content;
  const marker = enrichment.split('\n').find((line) => line.startsWith('##'));
  if (marker && content.includes(marker.trim())) return content;
  return buildHelpArticleContent(content, slug, locale);
}

const SCAM_INTRO_FR =
  "MoonSkin ne vous demandera jamais vos skins en dehors de la plateforme. Vérifiez toujours le Steam ID du bot avant d'accepter un trade.";
const SCAM_INTRO_EN =
  'MoonSkin will never ask for your skins outside the platform. Always verify the bot Steam ID before accepting a trade.';
const SCAM_INTRO_CN = 'MoonSkin 绝不会在平台外索要您的饰品。接受交易前请务必核对机器人的 Steam ID。';

const SELL_MULTI_INTRO_FR =
  'Sur MoonSkin, vendez les skins de plusieurs comptes Steam depuis un seul compte principal : changez simplement le Trade Link sur la page Vendre.';
const SELL_MULTI_INTRO_EN =
  'On MoonSkin, sell skins from multiple Steam accounts using one main account: just change the Trade Link on the Sell page.';
const SELL_MULTI_INTRO_CN =
  '在 MoonSkin 上，通过一个主账号出售多个 Steam 账号的饰品：只需在出售页面更换 Trade Link。';

/** Article supplémentaire absent des articles statiques i18n */
export const EXTRA_HELP_ARTICLES = [
  {
    slug: 'scam',
    categoryKey: 'security' as const,
    sortOrder: 34,
    titleFr: 'Arnaques et API scam : comment se protéger ?',
    titleEn: 'Scams and API scam: how to protect yourself?',
    titleCn: '诈骗与 API scam：如何保护自己？',
    contentFr: SCAM_INTRO_FR,
    contentEn: SCAM_INTRO_EN,
    contentCn: SCAM_INTRO_CN,
  },
  {
    slug: 'sell-multiple-steam-accounts',
    categoryKey: 'trading' as const,
    sortOrder: 14,
    titleFr: 'Comment vendre les skins de plusieurs comptes Steam en même temps ?',
    titleEn: 'How to sell skins from multiple Steam accounts at once?',
    titleCn: '如何同时出售多个 Steam 账号的饰品？',
    contentFr: SELL_MULTI_INTRO_FR,
    contentEn: SELL_MULTI_INTRO_EN,
    contentCn: SELL_MULTI_INTRO_CN,
  },
];

export function getExtraHelpArticleContent(slug: string, locale: Locale): string | undefined {
  const extra = EXTRA_HELP_ARTICLES.find((a) => a.slug === slug);
  if (!extra) return undefined;
  const base =
    locale === 'cn' ? extra.contentCn : locale === 'en' ? extra.contentEn : extra.contentFr;
  return applyRagEnrichmentIfNeeded(slug, locale, base);
}
