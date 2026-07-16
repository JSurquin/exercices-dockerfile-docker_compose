/**
 * Contenu enrichi issu du RAG (scripts/seed-rag.ts) pour alimenter les articles d'aide CMS.
 * Clé = slug article help ; valeur = contenu Markdown FR à fusionner avec le texte i18n.
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
- Paiement automatique après le trade hold de 7 jours

## API Scam — le risque principal

Un site tiers malveillant peut annuler ton offre légitime et te faire accepter une fausse offre.

**Signes :**
- Trade annulé puis nouvelle offre
- Steam ID différent de celui affiché sur MoonSkin

**Si victime :** reverse trade, change ton mot de passe Steam, révoque les autorisations API.`,

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
};

/** Article supplémentaire absent des articles statiques */
export const EXTRA_HELP_ARTICLES = [
  {
    slug: 'scam',
    categoryKey: 'security' as const,
    sortOrder: 34,
    titleFr: 'Arnaques et API scam : comment se protéger ?',
    titleEn: 'Scams and API scam: how to protect yourself?',
    titleCn: '诈骗与 API scam：如何保护自己？',
    contentFr:
      'MoonSkin ne vous demandera jamais vos skins en dehors de la plateforme. Vérifiez toujours le Steam ID du bot avant d\'accepter un trade.',
    contentEn:
      'MoonSkin will never ask for your skins outside the platform. Always verify the bot Steam ID before accepting a trade.',
    contentCn: 'MoonSkin 绝不会在平台外索要您的饰品。接受交易前请务必核对机器人的 Steam ID。',
  },
];
