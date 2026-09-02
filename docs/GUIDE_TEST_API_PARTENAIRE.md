# Guide de test — API partenaire (se faire passer pour un client)

Ce guide sert à un développeur MoonSkin qui veut **rejouer le parcours d’un client professionnel** : l’admin lui donne l’accès API, le client se connecte, génère sa clé, puis appelle l’API.

Tout est décrit **étape par étape**, dans l’ordre réel.

---

## 1. Ce dont tu as besoin

- Un compte **admin** (e-mail / mot de passe) pour `/admin/login`.
- Un **compte joueur de test** (Steam), **qui n’est pas admin**. C’est lui le « client ».
- Le site qui tourne :
  - en local : `pnpm dev` puis base `http://localhost:3000`
  - en recette / prod : l’URL du site (ex. `https://www.moonskin.eu`). L’API partenaire est sur le même host : `https://www.moonskin.eu/api/v1/partner`.
- La **clé API** et le **secret webhook** restent visibles dans Paramètres → Développeur (et sur la fiche admin).

**Attention :** `POST /api/v1/partner/trades` crée une **vraie vente Skinplace / Steam**. En prod, ne le lance que si tu acceptes de vendre un skin du compte de test.

---

## 2. Préparer le compte client (avant l’accès API)

Sans ça, la génération de clé échoue.

Connecte-toi **en Steam** avec le compte de test (ou impersonifie-le plus tard, puis complète) et vérifie :

1. Steam est lié.
2. Les **CGV** sont acceptées (`accepted_terms_at` en base).
3. Un **Trade Link Steam** est enregistré dans Paramètres (format `https://steamcommunity.com/tradeoffer/new/?partner=…&token=…`).
4. (Optionnel, seulement pour tester un payout) KYC validé **et** un moyen de paiement par défaut (SEPA / crypto).

Si le Trade Link ou Steam manque : message du type « Le Trade Link Steam doit être configuré avant de générer une clé API. »  
Si les CGV manquent : « Les CGV doivent être acceptées avant de générer une clé API. »

---

## 3. Côté admin : choisir la personne et lui donner l’accès

C’est **l’admin** qui ouvre l’accès. Le client ne peut pas le faire tout seul.

1. Va sur `/admin/login` et connecte-toi avec le compte admin.
2. Ouvre **Utilisateurs** : `/admin/dashboard?tab=users`.
3. Cherche le compte de test (pseudo Steam, e-mail, Steam ID).
4. Clique sur l’œil pour ouvrir sa fiche : `/admin/users/<id-utilisateur>`.
5. Note l’**ID utilisateur** (cuid dans l’URL). Tu en auras besoin si tu crées la clé à la main.
6. Dans la carte **Programme développeur**, active le switch **« Activer le programme développeur »**.
7. Un bandeau confirme que l’utilisateur peut gérer sa clé en self-service (Paramètres → Développeur).

À ce stade le client n’a **pas encore** de clé : il a seulement le droit d’en créer une.

### Variante admin : créer la clé à sa place

Si tu ne veux pas passer par le self-service client :

1. Menu admin **API partenaires** : `/admin/api-clients`.
2. Formulaire **Créer une clé** :
   - Nom partenaire (ex. `Test Client API`)
   - **ID utilisateur lié** = le cuid copié à l’étape 5
   - Limite req/min = `100` (défaut)
3. Clique **Générer la clé**.
4. La clé (`msk_live_…`) et le secret webhook restent visibles sur `/admin/api-clients` et sur la fiche utilisateur.
5. La clé part avec les scopes `read`, `trade`, `payout` par défaut.

Les deux chemins sont valides. Le parcours « vrai client » est celui du § 3 (switch) + § 4 et 5.

---

## 4. Se connecter en tant que ce client

Deux options.

### Option A — Impersonation (recommandé pour un test rapide)

Toujours depuis `/admin/dashboard?tab=users` :

1. Sur la ligne du compte de test, clique l’icône **Impersonnifier** (engrenage / utilisateur).
2. Confirme. Tu ne peux **pas** impersonnifier un admin.
3. Une bannière en haut rappelle que tu agis **au nom de cette personne**.
4. Tu es maintenant le client. Continue au § 5.

Pour quitter : bouton **Quitter l’impersonation** sur la bannière.

### Option B — Vraie session Steam

1. Déconnecte l’admin (ou ouvre une fenêtre privée).
2. Sur le site public, **Login Steam** avec le compte de test.
3. Continue au § 5.

---

## 5. En tant que client : générer la clé API

1. Va dans **Paramètres** : `/settings`.
2. Ouvre l’onglet **Développeur**.
3. Si le programme n’est pas activé, tu vois un message du type « réservé aux membres du programme développeur ». Retourne au § 3.
4. Clique **Créer / générer la clé** (confirme la boîte de dialogue).
5. La page affiche en entier :
   - `api_key` : commence par `msk_live_`
   - `webhook_secret` : hex 64 caractères
6. Les identifiants restent visibles dans cet onglet (bouton copier).

**Régénérer** invalide **immédiatement** l’ancienne clé. Tous les appels avec l’ancienne Bearer échouent en 401.

---

## 6. Appeler l’API comme le client (cURL)

Remplace :

- `BASE` par `http://localhost:3000` (local) ou `https://www.moonskin.eu` (prod)
- `MSK_KEY` par la clé copiée

Tous les appels utilisent :

```http
Authorization: Bearer msk_live_...
```

Réponse OK : `{ "success": true, "data": { ... } }`  
Réponse KO : `{ "success": false, "error": { "code": "...", "message": "..." } }`  
Les montants sont en **centimes** (entiers).

### 6.1 Profil (smoke test — à faire en premier)

```bash
curl -s "$BASE/api/v1/partner/me" \
  -H "Authorization: Bearer $MSK_KEY"
```

Attendu : `id`, `steam_id`, `steam_username`, `kyc_status`, `trade_link`.  
Si 401 : mauvaise clé, clé révoquée, ou header manquant.

### 6.2 Solde

```bash
curl -s "$BASE/api/v1/partner/balance" \
  -H "Authorization: Bearer $MSK_KEY"
```

Champs : `balance_cents`, `pending_cents`, `frozen_cents`, `available_cents`.

### 6.3 Inventaire CS2

```bash
curl -s "$BASE/api/v1/partner/inventory" \
  -H "Authorization: Bearer $MSK_KEY"
```

Liste les skins **rachetables par Skinplace** (même source que la page Vendre), pas tout l’inventaire Steam.  
Les items lockés / overstock / non rachetables sont omis. Un tableau vide avec `success: true` signifie « aucun item vendable », pas une erreur.  
Peut renvoyer une erreur amont (Skinplace) si l’inventaire Steam est privé / indisponible.

### 6.4 Estimation

```bash
curl -s -X POST "$BASE/api/v1/partner/estimate" \
  -H "Authorization: Bearer $MSK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"asset_ids":["REMPLACER_ASSET_ID"]}'
```

Attendu : `gross_cents`, `fees`, `net_cents`, `vip_bonus_cents`, `items`.

### 6.5 Lister les ventes

```bash
curl -s "$BASE/api/v1/partner/trades?limit=20&offset=0" \
  -H "Authorization: Bearer $MSK_KEY"
```

### 6.6 Détail d’une vente

```bash
curl -s "$BASE/api/v1/partner/trades/TRADE-ID" \
  -H "Authorization: Bearer $MSK_KEY"
```

### 6.7 Créer une vente (scope `trade` — **vraie offre Steam**)

Le `trade_url` **doit** correspondre au Steam du compte lié.

```bash
curl -s -X POST "$BASE/api/v1/partner/trades" \
  -H "Authorization: Bearer $MSK_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"asset_id":"REMPLACER_ASSET_ID"}],
    "trade_url":"https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh"
  }'
```

Attendu HTTP 201 : `id` / `trade_id`, `status`, `gross_cents`, `net_cents`, `available_at`.

### 6.8 Demander un payout (scope `payout`)

Le trade doit être en statut `available` (après trade hold). KYC obligatoire. Un moyen de paiement doit déjà exister sur le compte.

```bash
curl -s -X POST "$BASE/api/v1/partner/payouts" \
  -H "Authorization: Bearer $MSK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trade_id":"TRADE-ID"}'
```

Sans KYC : `403` + `KYC_REQUIRED`.  
Rejouer le même `trade_id` renvoie le payout existant avec `already_exists: true`.

### 6.9 Webhook

`localhost` et les IP privées sont **refusés**. Utilise une URL HTTPS publique (ex. [webhook.site](https://webhook.site) ou un tunnel ngrok).

```bash
curl -s -X PUT "$BASE/api/v1/partner/webhook" \
  -H "Authorization: Bearer $MSK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"webhook_url":"https://webhook.site/TON-UUID"}'

curl -s "$BASE/api/v1/partner/webhook" \
  -H "Authorization: Bearer $MSK_KEY"
```

Événements poussés : `trade.created`, `trade.status_changed`, `payout.created`, `payout.status_changed`.  
Header de signature : `X-MoonSkin-Signature: t=<unix>,v1=<hmac_sha256_hex>` avec le **secret webhook** (HMAC de `timestamp.rawBody`).

La doc interactive côté site : `/api-docs`.

---

## 7. Contrôler côté admin que ça a marché

1. `/admin/api-clients` : la clé apparaît (nom, préfixe, statut `ACTIVE`, nombre d’appels).
2. **Journal des appels API** : méthode, endpoint, code HTTP, IP, durée.
3. **Dernières livraisons webhook** si tu as configuré une URL.
4. `/admin/users/<id>` : le switch Programme développeur reste allumé.

---

## 8. Checklist « j’ai tout testé »

À cocher dans l’ordre :

1. [ ] Admin a choisi le user dans le dashboard
2. [ ] Programme développeur activé **ou** clé créée sur `/admin/api-clients`
3. [ ] Session client (impersonation ou Steam)
4. [ ] Clé `msk_live_…` + secret webhook copiés
5. [ ] `GET /me` → 200
6. [ ] `GET /balance` → 200
7. [ ] `GET /inventory` → items (si Steam OK)
8. [ ] `POST /estimate` → centimes
9. [ ] `GET /trades` → 200
10. [ ] `PUT /webhook` vers une URL HTTPS publique
11. [ ] (Optionnel, vrai trade) `POST /trades`
12. [ ] (Optionnel) payout seulement si trade `available` + KYC
13. [ ] Les appels se voient dans le journal admin
14. [ ] Clé révoquée en fin de test si ce n’est pas un vrai partenaire

---

## 9. Nettoyage après le test

- Sur `/admin/api-clients` : **Révoquer** la clé de test.
- Optionnel : désactiver le Programme développeur sur la fiche user.
- Quitter l’impersonation.

---

## 10. Erreurs fréquentes

| Code | HTTP | Cause typique |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Bearer manquant, clé copiée incomplète, clé régénérée / révoquée |
| `FORBIDDEN` | 403 | Scope manquant, ou plafond de retrait |
| `TERMS_REQUIRED` | 403 | CGV non acceptées |
| `KYC_REQUIRED` | 403 | Payout sans KYC validé |
| `ACCOUNT_FROZEN` / `ACCOUNT_BANNED` | 403 | Compte gelé ou banni |
| `VALIDATION_ERROR` | 400 | JSON, Trade Link, `asset_id`, ou trade pas encore `available` |
| `RATE_LIMITED` | 429 | Plus de ~100 req/min (réglable 10–1000 par l’admin) |
| `NOT_FOUND` | 404 | Mauvais `trade_id` ou compte |
| `API_ERROR` | 502 | Skinplace / inventaire amont |

Sans le switch développeur, `POST /api/user/developer/api-key` répond **403** « Accès réservé aux membres du programme développeur ».

---

## 11. Rappel des URLs utiles

| Où | URL |
| --- | --- |
| Login admin | `/admin/login` |
| Liste users | `/admin/dashboard?tab=users` |
| Fiche user (switch accès API) | `/admin/users/<id>` |
| Clés API admin | `/admin/api-clients` |
| Paramètres client | `/settings` → onglet Développeur |
| Doc API | `/api-docs` |
| Base API partenaire | `https://www.moonskin.eu/api/v1/partner/...` |

Tests unitaires déjà dans le repo (ne remplacent pas ce parcours manuel) :

```bash
pnpm test -- src/lib/__tests__/partner-api.test.ts
pnpm test -- src/lib/__tests__/partner-api-self-service.test.ts
pnpm test -- src/lib/__tests__/partner-api-auth.test.ts
pnpm test -- src/lib/__tests__/partner-api-routes.test.ts
```
