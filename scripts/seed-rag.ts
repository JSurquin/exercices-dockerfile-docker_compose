/**
 * Seed RAG — insère des documents MoonSkin dans pgvector.
 * Usage : pnpm tsx scripts/seed-rag.ts
 */
import 'dotenv/config';
import { insertRagDocument, getRagPool } from '../src/lib/rag-client';
import { generateEmbedding } from '../src/lib/ollama-embed';

/* ─── Documents MoonSkin ───────────────────────────────────────────────────── */

const DOCUMENTS: { source: string; content: string; metadata?: Record<string, unknown> }[] = [
  // ── PROCESSUS DE VENTE ─────────────────────────────────────────────────────
  {
    source: 'faq/processus-vente',
    content: `Comment vendre mes skins CS2 sur MoonSkin ? Processus de vente, étapes, procédure.

Il n'y a PAS de bouton "Ajouter un skin", PAS de création de compte manuelle, PAS de fixation de prix — tout est automatique.

Processus de vente étape par étape :
1. Connecte-toi avec Steam OpenID (pas de création de compte séparée).
2. Entre ton Trade Link Steam (Paramètres Steam → Confidentialité → Offres d'échange).
3. Ton inventaire CS2 s'affiche automatiquement — sélectionne les skins à vendre.
4. MoonSkin estime leur valeur en temps réel via l'API Skinplace (prix fixé automatiquement, non négociable).
5. Confirme la vente — un ticket de suivi est créé avec un ID unique.
6. Notre bot Steam envoie une offre d'échange — accepte-la dans les 15 minutes.
7. Le trade hold Steam de 7 jours commence (imposé par Valve, non contournable).
8. Le paiement est déclenché automatiquement le 8ème jour.`,
    metadata: { category: 'vente', tags: ['trade', 'processus', 'steam'] },
  },
  {
    source: 'faq/trade-hold',
    content: `Pourquoi y a-t-il un délai de 7 jours avant le paiement ?

Steam impose un "trade hold" de 7 jours sur tous les échanges d'objets entre comptes.
Ce délai est obligatoire et fixé par Valve, indépendamment de MoonSkin.
Pendant ces 7 jours, les skins sont bloqués dans notre bot Steam.
Le paiement est déclenché automatiquement le 8ème jour.

Si tu as Steam Guard mobile activé depuis plus de 7 jours, certains trades peuvent être instantanés.`,
    metadata: { category: 'vente', tags: ['trade-hold', 'délai', 'steam'] },
  },
  {
    source: 'faq/estimation-prix',
    content: `Comment est calculé le prix de mes skins ?

MoonSkin utilise l'API Skinplace pour estimer la valeur marchande de chaque skin.
Le montant affiché prend en compte :
- Le prix brut basé sur le marché Steam
- Les frais de cashout (0,5 % du montant brut)
- Les frais réseau selon la méthode de paiement choisie
- Le montant net final que tu recevras

Les prix sont mis à jour toutes les 5 minutes maximum.
Il n'y a aucune négociation possible sur le prix affiché.`,
    metadata: { category: 'prix', tags: ['estimation', 'frais', 'skinplace'] },
  },
  {
    source: 'faq/frais',
    content: `Quels sont les frais sur MoonSkin ?

Frais de cashout : 0,5 % du montant brut de la vente.

Frais réseau selon la méthode de paiement :
- Carte bancaire (Visa/Mastercard) : variable selon le montant (~0,5-1%)
- Virement SEPA France : 0 € en général
- Virement SEPA Europe : entre 0 et 2 € selon la banque
- Cryptomonnaies : frais de réseau blockchain (variable)

Exemple : pour 100 € brut, frais cashout = 0,50 €, montant net ≈ 99,50 € (hors frais réseau).`,
    metadata: { category: 'prix', tags: ['frais', 'cashout', 'paiement'] },
  },

  // ── PAIEMENTS ──────────────────────────────────────────────────────────────
  {
    source: 'faq/paiements-methodes',
    content: `Quelles méthodes de paiement sont disponibles sur MoonSkin ?

MoonSkin propose 3 méthodes de paiement :

1. **Carte bancaire** (Visa / Mastercard) via Flexify — paiement rapide, quelques minutes à 24h.
2. **Virement SEPA** — deux options :
   - SEPA France (via Qonto) : virements traités chaque jour vers 18h heure française
   - SEPA Europe : 1 à 3 jours ouvrés selon ta banque
3. **Cryptomonnaies** (via Whitepay) — USDT, ETH, BTC et autres — quasi-instantané après confirmation blockchain.

Un KYC (vérification d'identité) est obligatoire pour tous les paiements.`,
    metadata: { category: 'paiement', tags: ['carte', 'sepa', 'crypto', 'methodes'] },
  },
  {
    source: 'faq/paiement-carte',
    content: `Comment fonctionne le paiement par carte bancaire sur MoonSkin ?

Le paiement par carte utilise notre prestataire Flexify.
Tu recevras d'abord une autorisation de 0€ sur ta carte (c'est normal).
Ensuite le vrai paiement est déclenché.

Si ta banque bloque la transaction :
- Vérifie les limites de paiement de ta carte
- Essaie avec un montant plus faible
- Contacte ta banque pour autoriser la transaction
- Certaines banques nécessitent une validation via leur application

Délai de réception : instantané à 24h selon ta banque.
Certaines banques ne traitent pas les paiements le week-end ou le lundi.`,
    metadata: { category: 'paiement', tags: ['carte', 'visa', 'mastercard', 'flexify'] },
  },
  {
    source: 'faq/paiement-sepa',
    content: `Comment fonctionne le virement SEPA sur MoonSkin ?

**SEPA France** (recommandé pour les résidents français) :
- Traitement chaque jour vers 18h heure de Paris
- Réception le jour même ou le lendemain
- Prestataire : Qonto
- Premier virement et changement d'IBAN nécessitent une vérification renforcée (OTP ou micro-virement)

**SEPA Europe** :
- Pour les résidents de la zone SEPA hors France
- Délai : 1 à 3 jours ouvrés
- Si ton virement n'est pas reçu après 5 jours, contacte le support

Cooldown de 7 jours après changement d'IBAN (sauf si micro-vérification validée).`,
    metadata: { category: 'paiement', tags: ['sepa', 'virement', 'iban', 'qonto'] },
  },
  {
    source: 'faq/paiement-crypto',
    content: `Comment fonctionne le paiement en cryptomonnaie sur MoonSkin ? Quel délai pour recevoir ma crypto ?

MoonSkin supporte plusieurs cryptomonnaies via Whitepay : USDT, ETH, BTC, et d'autres.

⚠️ DEUX DÉLAIS DISTINCTS — NE PAS LES CONFONDRE :
1. Trade hold Steam (7 jours) : obligatoire AVANT que MoonSkin puisse déclencher tout paiement (carte, SEPA ou crypto). Ce délai est imposé par Valve.
2. Envoi du paiement crypto : une fois le trade hold terminé et le paiement déclenché, le virement crypto est QUASI-INSTANTANÉ — en général sous 10 minutes, parfois quelques minutes selon le réseau blockchain.

Les délais de 1 à 5 jours concernent uniquement les virements SEPA Europe, PAS les cryptomonnaies.

Étapes :
1. Sélectionne "Cryptomonnaie" comme méthode de paiement
2. Choisis ta crypto
3. Après le trade hold, le paiement est envoyé vers ton wallet
4. Nous vérifions les confirmations blockchain

⚠️ Attention : envoie toujours sur la bonne adresse ET le bon réseau blockchain.
Une erreur de réseau peut entraîner une perte définitive des fonds.`,
    metadata: { category: 'paiement', tags: ['crypto', 'usdt', 'bitcoin', 'whitepay', 'delai', 'instantane'] },
  },
  {
    source: 'faq/securite-victime-arnaque',
    content: `Est-ce que je risque de me faire arnaquer sur MoonSkin ? Comment me protéger ?

Si tu te demandes « et si je me fais scam ? » ou « est-ce que je vais me faire arnaquer ? », tu crains d'être VICTIME d'une arnaque — c'est une question légitime.

Protections MoonSkin :
- Tu vends tes skins uniquement via notre plateforme et notre bot officiel Steam
- Le Steam ID, pseudo et photo du bot sont affichés sur le site : vérifie-les avant chaque trade
- MoonSkin ne te demandera jamais de skins hors de la plateforme
- Paiement automatique après le trade hold de 7 jours

Risque principal hors MoonSkin — l'API scam :
- Un site tiers malveillant peut annuler ton offre légitime et te faire accepter une fausse offre vers un compte frauduleux
- Signes : trade annulé puis nouvelle offre, Steam ID différent de celui affiché sur MoonSkin
- Si victime : reverse trade, change ton mot de passe Steam, révoque les autorisations API

MoonSkin a une politique de tolérance zéro contre la fraude, mais cela vise les fraudeurs — pas les utilisateurs légitimes qui ont des inquiétudes.`,
    metadata: { category: 'securite', tags: ['scam', 'arnaque', 'victime', 'protection', 'securite', 'api-scam'] },
  },

  // ── KYC ────────────────────────────────────────────────────────────────────
  {
    source: 'faq/kyc',
    content: `Qu'est-ce que le KYC sur MoonSkin ? Pourquoi est-il obligatoire ?

Le KYC (Know Your Customer) est une vérification d'identité obligatoire avant tout paiement.
C'est une obligation légale pour les plateformes financières.

Documents demandés :
- Pièce d'identité (carte d'identité ou passeport)
- Selfie avec la pièce d'identité
- Justificatif de domicile (si requis)

Délai de traitement : généralement sous 24-48h.
MoonSkin ne stocke pas tes documents bruts, uniquement des références fournies par notre prestataire KYC certifié.

Si ton KYC est refusé, les raisons possibles sont :
- Documents flous ou illisibles
- Informations incomplètes
- Restrictions réglementaires liées à certains pays`,
    metadata: { category: 'kyc', tags: ['identite', 'verification', 'legal'] },
  },

  // ── SÉCURITÉ STEAM ─────────────────────────────────────────────────────────
  {
    source: 'faq/api-scam',
    content: `Qu'est-ce qu'un API scam Steam ? Comment s'en protéger ?

Un API scam Steam est une arnaque où un site malveillant a obtenu ta clé API Steam.
Le bot malveillant annule ton offre légitime et t'envoie une fausse offre vers un compte frauduleux.

Signes d'un API scam :
- L'offre de trade est annulée et une nouvelle apparaît
- Le compte destinataire a un profil similaire à notre bot mais un Steam ID différent
- Tu envoies les skins mais ils n'apparaissent pas sur MoonSkin

Comment vérifier :
- Vérifie le Steam ID, le pseudo et la photo de profil du bot
- Notre bot officiel est clairement identifié sur la page de vente

Si tu as été victime :
- Effectue un "reverse trade" pour tenter de récupérer tes items
- Change ton mot de passe Steam immédiatement
- Révoque toutes les autorisations API Steam
- Attends le délai de trade lock (30 jours) après récupération`,
    metadata: { category: 'securite', tags: ['api-scam', 'steam', 'fraude', 'securite'] },
  },
  {
    source: 'faq/steam-guard',
    content: `Steam Guard et trade restrictions sur MoonSkin

Pour vendre sur MoonSkin, ton compte Steam doit remplir ces conditions :
- Steam Guard mobile activé (obligatoire)
- Aucune restriction de trade active

Causes de restriction de trade :
- Steam Guard activé récemment : 7 jours de délai
- Mot de passe changé récemment : 2 à 7 jours de délai
- Compte récupéré après inactivité : restriction possible
- Changement de pseudo : restriction de ~2 heures

Si tu as activé Steam Guard il y a moins de 7 jours, tu ne pourras pas encore vendre sur MoonSkin.`,
    metadata: { category: 'steam', tags: ['steam-guard', 'restriction', 'trade'] },
  },

  // ── GAMIFICATION ───────────────────────────────────────────────────────────
  {
    source: 'faq/xp-tickets',
    content: `Système de points XP et tickets sur MoonSkin

Comment gagner de l'XP :
- Chaque vente te rapporte des points XP proportionnels au volume vendu
- Des missions quotidiennes et hebdomadaires offrent des XP bonus

Les tickets :
- Les tickets sont des jetons non-transférables gagnés via l'XP
- Chaque ticket peut être utilisé pour participer aux Giveaways
- Plus tu as de tickets dans un giveaway, plus tu as de chances de gagner

Les niveaux :
- L'XP accumulé détermine ton niveau sur la plateforme
- Les niveaux supérieurs débloquent des avantages exclusifs`,
    metadata: { category: 'gamification', tags: ['xp', 'tickets', 'niveaux', 'giveaway'] },
  },

  // ── AFFILIATION ────────────────────────────────────────────────────────────
  {
    source: 'faq/affiliation',
    content: `Programme d'affiliation MoonSkin

Comment ça marche :
- Chaque affilié reçoit un lien de parrainage unique
- Quand quelqu'un s'inscrit et vend via ton lien, tu gagnes une commission
- Commission par défaut : 2 % du volume brut de chaque vente parrainée

Conditions de paiement :
- Les commissions sont versées mensuellement
- Un KYC est obligatoire pour recevoir ses commissions
- Tu peux consulter l'historique complet dans ton espace affilié

Pour devenir affilié, contacte notre équipe à marketing@moonskin.com.`,
    metadata: { category: 'affiliation', tags: ['parrainage', 'commission', 'revenus'] },
  },

  // ── ERREURS COMMUNES ───────────────────────────────────────────────────────
  {
    source: 'faq/trade-link-invalide',
    content: `Mon trade link Steam est invalide ou refusé sur MoonSkin

Si ton trade link est rejeté :
1. Va sur Steam → Paramètres → Confidentialité → Mon profil de trades
2. Génère un nouveau lien de trade
3. Vérifie que ton profil Steam n'est pas en mode "Privé"
4. Assure-toi que tu n'as pas de restriction de trade active

Le trade link expire si tu changes les paramètres de ton compte Steam.
Dans ce cas, il faut en générer un nouveau et le mettre à jour sur MoonSkin.`,
    metadata: { category: 'vente', tags: ['trade-link', 'steam', 'erreur'] },
  },
  {
    source: 'faq/skin-non-detecte',
    content: `Mon skin n'est pas détecté dans mon inventaire sur MoonSkin

Si tes skins n'apparaissent pas :
- Vérifie que ton inventaire Steam est en mode Public
- Actualise la page (les données sont en cache 5 minutes)
- Assure-toi que les skins sont bien dans ton inventaire Steam et non en cours de trade
- Certains items non-tradables ne peuvent pas être vendus

Si un skin vendu n'est pas confirmé après 15 minutes :
- Vérifie l'historique des trades Steam
- Regarde si l'offre a bien été envoyée au bon compte
- Contacte le support si le problème persiste`,
    metadata: { category: 'vente', tags: ['inventaire', 'skin', 'detection'] },
  },
  {
    source: 'faq/vendre-autre-compte-steam',
    content: `Comment vendre les skins d'un autre compte Steam sur MoonSkin ? Vendre depuis un smurf, un second compte ou pour un client.

Sur MoonSkin, tu peux vendre les skins d'un autre compte Steam tout en restant connecté sur ton compte principal MoonSkin :

1. Va sur la page Vendre (/sell).
2. Dans le panneau de droite, modifie ton Trade Link pour celui du compte Steam cible.
3. L'inventaire CS2 de ce compte se charge automatiquement.
4. Sélectionne les skins et finalise la vente comme d'habitude.
5. Les paiements (SEPA, carte, crypto) arrivent sur ton compte MoonSkin principal — pas besoin de créer un second compte MoonSkin.

Cas d'usage : smurfs, comptes alternatifs, vente pour des clients, centraliser tous les revenus sur un seul compte (KYC, IBAN, historique).

Conditions : le Trade Link doit appartenir au compte source, inventaire Steam public, Steam Guard activé.

Article d'aide : /help/sell-multiple-steam-accounts
Guide blog : /blog/vendre-skins-plusieurs-comptes-steam`,
    metadata: { category: 'vente', tags: ['trade-link', 'smurf', 'multi-compte', 'autre-compte'] },
  },
];

/* ─── Seed ─────────────────────────────────────────────────────────────────── */

async function main() {
  console.log('🌱 Démarrage du seed RAG MoonSkin...\n');

  const pool = getRagPool();

  // Vider les données existantes
  await pool.query('DELETE FROM rag_documents');
  console.log('🗑️  Table rag_documents vidée');

  // S'assurer que l'index est HNSW (IVFFlat ne fonctionne pas avec peu de données)
  await pool.query('DROP INDEX IF EXISTS rag_documents_embedding_idx');
  await pool.query(
    'CREATE INDEX rag_documents_embedding_idx ON rag_documents USING hnsw (embedding vector_cosine_ops)',
  );
  console.log('🔍 Index HNSW recréé\n');

  let ok = 0;
  let fail = 0;

  for (const doc of DOCUMENTS) {
    process.stdout.write(`  Embedding "${doc.source}"... `);
    try {
      const embedding = await generateEmbedding(doc.content);
      await insertRagDocument({
        source: doc.source,
        chunkIndex: 0,
        content: doc.content,
        embedding,
        metadata: doc.metadata ?? {},
      });
      console.log(`✅ (${embedding.length} dims)`);
      ok++;
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : err}`);
      fail++;
    }
  }

  await pool.end();

  console.log(`\n✅ ${ok} documents insérés, ❌ ${fail} échoués`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Erreur seed RAG:', err);
  process.exit(1);
});
