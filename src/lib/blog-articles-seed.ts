import type { BlogCategoryKey } from './blog-articles-config';

export interface BlogArticleSeed {
  slug: string;
  category: BlogCategoryKey;
  readTimeMinutes: number;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: string;
  titleFr: string;
  titleEn: string;
  titleCn?: string;
  summaryFr: string;
  summaryEn: string;
  summaryCn?: string;
  contentFr: string;
  contentEn: string;
  contentCn?: string;
}

export const BLOG_ARTICLES_SEED: BlogArticleSeed[] = [
  {
    slug: 'vendre-skins-cs2-argent-reel',
    category: 'guides',
    readTimeMinutes: 8,
    isFeatured: true,
    sortOrder: 0,
    publishedAt: '2026-07-10T10:00:00Z',
    titleFr: 'Comment vendre ses skins CS2 pour de l\'argent réel',
    titleEn: 'How to sell your CS2 skins for real money',
    titleCn: '如何将 CS2 皮肤兑换成真钱',
    summaryFr:
      'Guide complet pour convertir votre inventaire Counter-Strike 2 en euros ou crypto, en toute sécurité sur MoonSkin.',
    summaryEn:
      'A complete guide to converting your Counter-Strike 2 inventory into euros or crypto safely on MoonSkin.',
    summaryCn: '在 MoonSkin 上安全地将 Counter-Strike 2 库存兑换成欧元或加密货币的完整指南。',
    contentFr: `# Comment vendre ses skins CS2 pour de l'argent réel

Vendre des skins Counter-Strike 2 est l'un des moyens les plus populaires pour monétiser son inventaire Steam. Voici comment procéder en toute sécurité.

## Pourquoi vendre via une plateforme spécialisée ?

- **Estimation instantanée** de la valeur de vos skins
- **Paiement rapide** en SEPA ou crypto après le trade hold Steam (7 jours)
- **Sécurité renforcée** : vérification du bot, KYC et protection anti-fraude

## Étapes pour vendre sur MoonSkin

1. Connectez-vous avec votre compte **Steam**
2. Ajoutez votre **Trade Link** et vérifiez qu'il est valide
3. Sélectionnez les skins à vendre dans votre inventaire
4. Consultez le **montant net** (prix brut, frais, délai)
5. Confirmez et acceptez l'offre de trade du bot vérifié
6. Attendez la fin du **trade hold** (7 jours)
7. Recevez votre paiement automatiquement

## Conseils de sécurité

- Vérifiez toujours le **Steam ID** du bot avant d'accepter un trade
- Ne partagez jamais votre mot de passe Steam ni vos clés API
- Complétez votre **KYC** avant le premier retrait

## Combien pouvez-vous gagner ?

Le prix dépend de la rareté, de l'état (Factory New, Minimal Wear…) et de la demande du marché. Les couteaux, gants et skins de collection atteignent souvent des centaines ou milliers d'euros.

[Commencer à vendre sur MoonSkin](/sell)`,
    contentEn: `# How to sell your CS2 skins for real money

Selling Counter-Strike 2 skins is one of the most popular ways to monetize your Steam inventory. Here is how to do it safely.

## Why use a specialized platform?

- **Instant estimates** for your skin values
- **Fast payouts** via SEPA or crypto after the Steam trade hold (7 days)
- **Enhanced security**: bot verification, KYC and anti-fraud protection

## Steps to sell on MoonSkin

1. Log in with your **Steam** account
2. Add your **Trade Link** and verify it is valid
3. Select the skins you want to sell from your inventory
4. Review the **net amount** (gross price, fees, timeline)
5. Confirm and accept the verified bot trade offer
6. Wait for the **trade hold** to end (7 days)
7. Receive your payout automatically

## Security tips

- Always verify the bot **Steam ID** before accepting a trade
- Never share your Steam password or API keys
- Complete **KYC** before your first withdrawal

## How much can you earn?

Prices depend on rarity, wear (Factory New, Minimal Wear…) and market demand. Knives, gloves and collectible skins often reach hundreds or thousands of euros.

[Start selling on MoonSkin](/sell)`,
  },
  {
    slug: 'vendre-skins-plusieurs-comptes-steam',
    category: 'guides',
    readTimeMinutes: 5,
    isFeatured: false,
    sortOrder: 2,
    publishedAt: '2026-07-16T10:00:00Z',
    titleFr: 'Comment vendre les skins de plusieurs comptes Steam en même temps',
    titleEn: 'How to sell skins from multiple Steam accounts at the same time',
    titleCn: '如何同时出售多个 Steam 账号的饰品',
    summaryFr:
      'Vendez les skins de vos smurfs ou comptes clients depuis un seul compte MoonSkin : changez le Trade Link sur la page Vendre.',
    summaryEn:
      'Sell skins from smurf or client Steam accounts from one MoonSkin account: change the Trade Link on the Sell page.',
    summaryCn: '通过一个 MoonSkin 主账号出售小号或客户 Steam 账号的饰品：在出售页面更换 Trade Link 即可。',
    contentFr: `# Comment vendre les skins de plusieurs comptes Steam en même temps

Vous avez plusieurs comptes Steam (smurf, compte secondaire, inventaire client) et vous voulez centraliser vos ventes sur MoonSkin ? C'est possible **sans créer plusieurs comptes MoonSkin**.

## Le principe

MoonSkin vous permet de **changer de Trade Link** sur la [page Vendre](/sell) pour charger l'inventaire d'un autre compte Steam, tout en restant connecté sur **votre compte principal MoonSkin**.

Les paiements (SEPA, carte, crypto) arrivent toujours sur ce compte principal.

## Étapes

1. Connectez-vous sur MoonSkin avec votre compte principal.
2. Ouvrez la [page Vendre](/sell).
3. Dans le **panneau de droite**, cliquez sur **Modifier** à côté du Trade Link.
4. Collez le Trade Link du compte Steam cible (Paramètres Steam → Confidentialité → Offres d'échange).
5. L'inventaire CS2 se charge — sélectionnez les skins et finalisez la vente.
6. Répétez l'opération pour chaque compte Steam supplémentaire.

## Pour qui ?

- **Joueurs avec smurfs** : vendez tous vos skins sans multiplier les comptes MoonSkin.
- **Revendeurs / traders** : encaissez pour vos clients sur un seul compte (KYC, IBAN, historique).
- **Familles / multi-comptes** : centralisez les revenus au même endroit.

## Points de vigilance

- Le compte Steam source doit avoir un inventaire **public** et **Steam Guard** activé.
- Vérifiez toujours le Steam ID du bot avant d'accepter un trade.
- Un KYC validé est requis avant le premier retrait.

[Consulter l'article d'aide détaillé](/help/sell-multiple-steam-accounts) · [Commencer à vendre](/sell)`,
    contentEn: `# How to sell skins from multiple Steam accounts at the same time

Do you have several Steam accounts (smurfs, alt accounts, client inventories) and want to centralize sales on MoonSkin? You can do it **without creating multiple MoonSkin accounts**.

## How it works

MoonSkin lets you **change your Trade Link** on the [Sell page](/sell) to load another Steam account's inventory while staying signed in to **your main MoonSkin account**.

Payouts (SEPA, card, crypto) always go to that main account.

## Steps

1. Sign in to MoonSkin with your main account.
2. Open the [Sell page](/sell).
3. In the **right-hand panel**, click **Edit** next to the Trade Link.
4. Paste the target Steam account's Trade Link (Steam Settings → Privacy → Trade offers).
5. The CS2 inventory loads — select skins and complete the sale.
6. Repeat for each additional Steam account.

## Who is this for?

- **Smurf players**: sell all your skins without multiple MoonSkin accounts.
- **Resellers / traders**: cash out for clients on one account (KYC, IBAN, history).
- **Families / multi-account users**: centralize earnings in one place.

## Important notes

- The source Steam account must have a **public** inventory and **Steam Guard** enabled.
- Always verify the bot Steam ID before accepting a trade.
- Validated KYC is required before your first withdrawal.

[Read the detailed help article](/help/sell-multiple-steam-accounts) · [Start selling](/sell)`,
  },
  {
    slug: 'meilleures-caisses-cs2',
    category: 'guides',
    readTimeMinutes: 6,
    isFeatured: true,
    sortOrder: 1,
    publishedAt: '2026-07-08T10:00:00Z',
    titleFr: 'Meilleures caisses à ouvrir dans CS2 en 2026',
    titleEn: 'Best cases to open in CS2 in 2026',
    summaryFr:
      'Classement des caisses CS2 les plus rentables selon le ROI, la demande du marché et le prix des clés.',
    summaryEn:
      'Ranking of the most profitable CS2 cases based on ROI, market demand and key prices.',
    contentFr: `# Meilleures caisses à ouvrir dans CS2 en 2026

Ouvrir des caisses reste un jeu de chance, mais certaines offrent un meilleur rapport qualité-prix.

## Top 5 des caisses populaires

1. **Operation Wildfire Case** — bon ROI historique, skins recherchés
2. **CS:GO Weapon Case** — classique avec skins iconiques
3. **Chroma Case** — couteaux Doppler très demandés
4. **Dreams & Nightmares Case** — skins communautaires populaires
5. **Revolution Case** — skins colorés, forte liquidité

## Ce qu'il faut savoir avant d'ouvrir

- Le **ROI moyen** reste inférieur à 100 % : ouvrir des caisses n'est pas un investissement
- Le prix des **clés** (~2,50 €) impacte directement la rentabilité
- Les skins obtenus peuvent être **revendus** sur MoonSkin pour récupérer une partie de votre budget

## Alternative plus sûre

Plutôt que d'ouvrir des caisses, beaucoup de joueurs préfèrent **acheter directement** le skin souhaité sur le marché, ou vendre leurs skins existants pour financer un achat ciblé.`,
    contentEn: `# Best cases to open in CS2 in 2026

Opening cases remains a game of chance, but some offer better value than others.

## Top 5 popular cases

1. **Operation Wildfire Case** — strong historical ROI, sought-after skins
2. **CS:GO Weapon Case** — classic with iconic skins
3. **Chroma Case** — highly demanded Doppler knives
4. **Dreams & Nightmares Case** — popular community skins
5. **Revolution Case** — colorful skins, high liquidity

## What to know before opening

- Average **ROI** stays below 100%: opening cases is not an investment
- **Key** prices (~€2.50) directly impact profitability
- Skins obtained can be **sold** on MoonSkin to recover part of your budget

## A safer alternative

Rather than opening cases, many players prefer to **buy directly** the skin they want on the market, or sell existing skins to fund a targeted purchase.`,
  },
  {
    slug: 'steam-trade-hold-cs2',
    category: 'trading',
    readTimeMinutes: 5,
    isFeatured: false,
    sortOrder: 2,
    publishedAt: '2026-07-05T10:00:00Z',
    titleFr: 'Trade hold Steam : tout comprendre sur les 7 jours d\'attente',
    titleEn: 'Steam trade hold: understanding the 7-day waiting period',
    summaryFr:
      'Pourquoi Steam impose un délai de 7 jours après un échange, et comment cela affecte la vente de skins CS2.',
    summaryEn:
      'Why Steam enforces a 7-day delay after a trade, and how it affects CS2 skin sales.',
    contentFr: `# Trade hold Steam : tout comprendre

Depuis plusieurs années, Valve impose un **délai de 7 jours** (trade hold) après chaque échange d'objets sur Steam.

## Pourquoi ce délai existe

- Lutter contre le **phishing** et les arnaques API
- Donner aux victimes le temps de **contester** un trade frauduleux
- Réduire le blanchiment via les inventaires volés

## Impact sur la vente de skins

Sur MoonSkin, le processus est transparent :

1. Vous acceptez le trade → statut **en trade hold**
2. Après 7 jours → skins **disponibles** pour paiement
3. Paiement automatique selon votre méthode (SEPA, crypto)

## Trade Protection (2025)

Valve a renforcé la protection en 2025 avec le système **Trade Protection**, qui peut prolonger certaines restrictions. Consultez toujours le statut de votre trade dans votre dashboard MoonSkin.`,
    contentEn: `# Steam trade hold: everything you need to know

For several years, Valve has enforced a **7-day trade hold** after every item exchange on Steam.

## Why this delay exists

- Fight **phishing** and API scams
- Give victims time to **dispute** fraudulent trades
- Reduce money laundering through stolen inventories

## Impact on skin sales

On MoonSkin, the process is transparent:

1. You accept the trade → **trade hold** status
2. After 7 days → skins **available** for payout
3. Automatic payment via your chosen method (SEPA, crypto)

## Trade Protection (2025)

Valve strengthened protection in 2025 with the **Trade Protection** system, which can extend certain restrictions. Always check your trade status in your MoonSkin dashboard.`,
  },
  {
    slug: 'skins-cs2-plus-chers',
    category: 'skins',
    readTimeMinutes: 7,
    isFeatured: true,
    sortOrder: 3,
    publishedAt: '2026-07-02T10:00:00Z',
    titleFr: 'Top 10 des skins CS2 les plus chers en 2026',
    titleEn: 'Top 10 most expensive CS2 skins in 2026',
    summaryFr:
      'Des Blue Gem à plus de 2 millions d\'euros aux couteaux rares : découvrez les skins les plus précieux de Counter-Strike 2.',
    summaryEn:
      'From Blue Gems worth over €2 million to rare knives: discover Counter-Strike 2\'s most valuable skins.',
    contentFr: `# Top 10 des skins CS2 les plus chers

Le marché des skins CS2 compte parmi les actifs virtuels les plus précieux au monde.

## Les légendes du marché

1. **Karambit | Case Hardened (Blue Gem)** — patterns 387 et similaires, valeurs record
2. **AK-47 | Case Hardened (Blue Gem)** — patterns bleus dominants
3. **AWP | Dragon Lore (Souvenir)** — éditions Major, états Factory New
4. **M4A4 | Howl** — skin contraband unique
5. **Sport Gloves | Vice / Pandora's Box** — gants Factory New

## Pourquoi certains skins valent des millions ?

- **Pattern unique** (Case Hardened Blue Gem)
- **Rareté extrême** (Souvenir, Contraband)
- **État Factory New** sur des skins anciens
- **Demande des collectionneurs** chinois et occidentaux

## Et mes skins à moi ?

La plupart des inventaires contiennent des skins de quelques centimes à quelques centaines d'euros. MoonSkin estime **gratuitement** la valeur de votre inventaire complet.`,
    contentEn: `# Top 10 most expensive CS2 skins

The CS2 skin market includes some of the most valuable virtual assets in the world.

## Market legends

1. **Karambit | Case Hardened (Blue Gem)** — patterns 387 and similar, record values
2. **AK-47 | Case Hardened (Blue Gem)** — dominant blue patterns
3. **AWP | Dragon Lore (Souvenir)** — Major editions, Factory New condition
4. **M4A4 | Howl** — unique contraband skin
5. **Sport Gloves | Vice / Pandora's Box** — Factory New gloves

## Why do some skins cost millions?

- **Unique pattern** (Case Hardened Blue Gem)
- **Extreme rarity** (Souvenir, Contraband)
- **Factory New** condition on old skins
- **Collector demand** from Chinese and Western buyers

## What about my skins?

Most inventories contain skins worth from a few cents to a few hundred euros. MoonSkin **estimates your full inventory for free**.`,
  },
  {
    slug: 'retirer-solde-steam',
    category: 'guides',
    readTimeMinutes: 6,
    isFeatured: false,
    sortOrder: 4,
    publishedAt: '2026-06-28T10:00:00Z',
    titleFr: 'Comment retirer son solde Steam en argent réel',
    titleEn: 'How to withdraw your Steam balance as real money',
    summaryFr:
      'Steam ne permet pas de retirer directement son solde : voici les solutions légales via la vente de skins CS2.',
    summaryEn:
      'Steam does not allow direct balance withdrawals: here are legal solutions through CS2 skin sales.',
    contentFr: `# Retirer son solde Steam : est-ce possible ?

**Non**, Steam ne permet pas de convertir directement votre solde portefeuille en argent réel sur votre compte bancaire.

## Les options disponibles

### 1. Vendre des skins CS2 (recommandé)
Convertissez vos objets en argent réel via une plateforme comme MoonSkin. C'est la méthode la plus directe et la plus rentable.

### 2. Acheter des jeux puis revendre (déconseillé)
Acheter des jeux avec le solde Steam pour les revendre en cartes cadeaux est risqué et souvent non rentable.

### 3. Marketplace Steam Community
Vous pouvez vendre des items sur le marché Steam, mais les fonds restent sur votre **portefeuille Steam** — pas sur votre compte bancaire.

## La solution MoonSkin

1. Vendez vos skins CS2
2. Recevez un paiement en **SEPA** ou **crypto**
3. L'argent arrive sur votre compte bancaire ou wallet

C'est la méthode privilégiée par des milliers de joueurs européens.`,
    contentEn: `# Withdrawing Steam balance: is it possible?

**No**, Steam does not allow you to directly convert wallet funds into real money in your bank account.

## Available options

### 1. Sell CS2 skins (recommended)
Convert your items into real money via a platform like MoonSkin. This is the most direct and profitable method.

### 2. Buy games and resell (not recommended)
Buying games with Steam balance to resell as gift cards is risky and often unprofitable.

### 3. Steam Community Market
You can sell items on the Steam market, but funds stay in your **Steam wallet** — not your bank account.

## The MoonSkin solution

1. Sell your CS2 skins
2. Receive payment via **SEPA** or **crypto**
3. Money arrives in your bank account or wallet

This is the preferred method for thousands of European players.`,
  },
  {
    slug: 'pourquoi-skins-cs2-chers',
    category: 'skins',
    readTimeMinutes: 5,
    isFeatured: false,
    sortOrder: 5,
    publishedAt: '2026-06-25T10:00:00Z',
    titleFr: 'Pourquoi les skins CS2 sont-ils si chers ?',
    titleEn: 'Why are CS2 skins so expensive?',
    summaryFr:
      'Rareté, offre limitée, demande mondiale et statut social : les facteurs qui expliquent les prix élevés.',
    summaryEn:
      'Rarity, limited supply, global demand and social status: the factors behind high prices.',
    contentFr: `# Pourquoi les skins CS2 coûtent-ils si cher ?

## Offre limitée

Chaque skin a un nombre fini en circulation. Les caisses anciennes ne sont plus disponibles, ce qui rend certains skins **de plus en plus rares**.

## Demande mondiale

Des millions de joueurs en Europe, Asie et Amérique du Nord recherchent les mêmes skins populaires (Doppler, Fade, Printstream…).

## Statut et esthétique

Un inventaire prestigieux est un signe de statut dans la communauté CS2, comparable à des objets de collection.

## Spéculation

Le marché attire des investisseurs qui achètent des skins rares comme des actifs, poussant les prix vers le haut.

## En résumé

Prix élevé = **rareté** + **demande** + **liquidité** sur un marché mondial de plusieurs milliards d'euros.`,
    contentEn: `# Why are CS2 skins so expensive?

## Limited supply

Each skin has a finite number in circulation. Old cases are no longer available, making some skins **increasingly rare**.

## Global demand

Millions of players across Europe, Asia and North America want the same popular skins (Doppler, Fade, Printstream…).

## Status and aesthetics

A prestigious inventory is a status symbol in the CS2 community, similar to collectible items.

## Speculation

The market attracts investors who buy rare skins as assets, pushing prices higher.

## In summary

High prices = **rarity** + **demand** + **liquidity** in a multi-billion euro global market.`,
  },
  {
    slug: 'meilleures-skins-ak47-cs2',
    category: 'skins',
    readTimeMinutes: 6,
    isFeatured: false,
    sortOrder: 6,
    publishedAt: '2026-06-20T10:00:00Z',
    titleFr: 'Meilleures skins AK-47 dans CS2 (2026)',
    titleEn: 'Best AK-47 skins in CS2 (2026)',
    summaryFr:
      'Notre sélection des skins AK-47 les plus populaires : Inheritance, Nightwish, Redline et plus encore.',
    summaryEn:
      'Our pick of the most popular AK-47 skins: Inheritance, Nightwish, Redline and more.',
    contentFr: `# Meilleures skins AK-47 en 2026

L'AK-47 est l'arme la plus iconique de Counter-Strike. Voici les skins les plus demandées.

## Tier S — Premium

- **AK-47 | Inheritance** — design élégant, forte demande
- **AK-47 | Nightwish** — finition onirique très populaire
- **AK-47 | Vulcan** — classique indémodable

## Tier A — Excellent rapport qualité-prix

- **AK-47 | Redline** — abordable et liquide
- **AK-47 | Slate** — parfait pour les crafts de stickers
- **AK-47 | Frontside Misty** — couleurs vives

## Conseil d'achat

Avant d'acheter, comparez les prix sur le marché et envisagez de **vendre vos anciens skins** sur MoonSkin pour financer votre prochaine acquisition.`,
    contentEn: `# Best AK-47 skins in 2026

The AK-47 is Counter-Strike's most iconic weapon. Here are the most sought-after skins.

## Tier S — Premium

- **AK-47 | Inheritance** — elegant design, high demand
- **AK-47 | Nightwish** — very popular dreamlike finish
- **AK-47 | Vulcan** — timeless classic

## Tier A — Great value

- **AK-47 | Redline** — affordable and liquid
- **AK-47 | Slate** — perfect for sticker crafts
- **AK-47 | Frontside Misty** — vibrant colors

## Buying tip

Before purchasing, compare market prices and consider **selling your old skins** on MoonSkin to fund your next acquisition.`,
  },
  {
    slug: 'steam-trade-protection',
    category: 'news',
    readTimeMinutes: 4,
    isFeatured: false,
    sortOrder: 7,
    publishedAt: '2026-06-15T10:00:00Z',
    titleFr: 'Trade Protection Steam : ce qui change pour le trading CS2',
    titleEn: 'Steam Trade Protection: what changes for CS2 trading',
    summaryFr:
      'Analyse de la mise à jour Valve de juillet 2025 et de son impact sur l\'écosystème des skins.',
    summaryEn:
      'Analysis of Valve\'s July 2025 update and its impact on the skin ecosystem.',
    contentFr: `# Trade Protection Steam : ce qui change

En juillet 2025, Valve a déployé **Trade Protection**, une évolution majeure du système d'échange Steam.

## Principales modifications

- Renforcement des **délais de révocation** après un trade
- Meilleure protection contre les comptes compromis
- Impact sur la **liquidité** à court terme du marché tiers

## Impact pour les vendeurs MoonSkin

- Le processus de vente reste **identique** pour vous
- Le trade hold de 7 jours est toujours en vigueur
- MoonSkin adapte en temps réel les statuts de vos trades

## Conseil

Restez informé via notre blog et notre centre d'aide. En cas de doute sur un trade, contactez notre support avant d'accepter une offre suspecte.`,
    contentEn: `# Steam Trade Protection: what changes

In July 2025, Valve deployed **Trade Protection**, a major evolution of Steam's trading system.

## Main changes

- Strengthened **revocation delays** after a trade
- Better protection against compromised accounts
- Short-term impact on third-party market **liquidity**

## Impact for MoonSkin sellers

- The selling process remains **the same** for you
- The 7-day trade hold is still in effect
- MoonSkin updates your trade statuses in real time

## Tip

Stay informed via our blog and help center. If in doubt about a trade, contact our support before accepting a suspicious offer.`,
  },
];
