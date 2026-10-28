# Compte rendu — test de l’API partenaire MoonSkin

**Date :** 2 septembre 2026, ~18h25 (Paris)  
**Site testé :** https://www.moonskin.eu  
**Compte :** Nyouz I B/S Skins (tag MERCHANT, KYC validé)  
**Parcours :** `docs/GUIDE_TEST_API_PARTENAIRE.md` (toutes les actions **sauf payout**)

La clé API et le secret webhook **ne sont pas recopiés ici**.  
Le **retrait d’argent (payout)** n’a pas été testé, comme demandé.

Ce fichier est **local uniquement** : ne pas le committer / pousser.

---

## En une phrase

Tout le parcours partenaire (hors payout) fonctionne : profil, solde, inventaire, estimation, liste / détail des ventes, configuration webhook, et création d’une **vraie offre Steam**. La signature webhook est valide.

---

## Checklist du guide

| # | Étape | Résultat |
|---|---|---|
| 5 | `GET /me` | OK 200 |
| 6 | `GET /balance` | OK 200 |
| 7 | `GET /inventory` | OK 200 — 176 skins vendables |
| 8 | `POST /estimate` | OK 200 |
| 9 | `GET /trades` | OK 200 — 74 ventes après création |
| 10 | `PUT` + `GET /webhook` | OK 200 |
| 11 | `POST /trades` | OK **201** — vraie offre Steam |
| 12 | `POST /payouts` | **Non testé** |
| 13 | Journal admin | Non vérifié (pas de session admin dans ce test) |
| 14 | Révoquer la clé | À faire de ton côté, comme prévu |

Les étapes admin 1–4 (programme développeur + génération de clé) étaient déjà faites : la clé a été fournie.

---

## 6.1 Profil — `GET /api/v1/partner/me`

**Résultat :** OK

| Champ | Valeur |
|---|---|
| Compte | Nyouz I B/S Skins |
| Steam de connexion | `76561199040420116` |
| KYC | `verified` |
| CGV | Acceptées le 15 janvier 2026 |
| Trade Link | Enregistré (`partner=1080154388`, token présent) |
| Tag | MERCHANT |
| Compte gelé | Non |

**À retenir :** cette fois le Steam du Trade Link **est le même** que le Steam de connexion (`76561199040420116`). L’inventaire et l’offre de test partent donc vers **ce** compte Steam (pas un alt).

---

## 6.2 Solde — `GET /api/v1/partner/balance`

**Résultat :** OK

| Champ | Valeur | Lecture |
|---|---|---|
| Solde | 954 776 centimes | ~**9 547,76 $** |
| En attente | 0 | rien en hold |
| Gelé | 0 | |
| Disponible | 954 776 | tout le solde est marqué disponible |
| Compte gelé | non | |

Les montants API sont en **centimes** (100 = 1,00).

---

## 6.3 Inventaire — `GET /api/v1/partner/inventory`

**Résultat :** OK

- **176 skins** vendables (filtre MoonSkin : pas lockés / non rachetables).
- Valeur totale listée : **1 890 777 centimes** (~18 907 $).
- Steam ID de l’inventaire : `76561199040420116` (celui du Trade Link / connexion).

Les moins chers listés (exemples) :

| Prix | Item |
|---|---|
| 8 centimes | StatTrak™ P250 \| Cassette (FT) |
| 9 centimes | Kilowatt Case |
| 12 centimes | Nova \| Candy Apple (FT) |
| 13 centimes | Revolution Case (plusieurs) |

Un tableau vide avec `success: true` voudrait dire « rien de vendable », pas une erreur.

---

## 6.4 Estimation — `POST /api/v1/partner/estimate`

**Résultat :** OK (deux appels)

### Item trop petit (8 centimes)

Skin : **StatTrak™ P250 \| Cassette (Field-Tested)** (`asset_id` `51084863115`)

| Champ | Valeur |
|---|---|
| Brut | 8 centimes |
| Frais vente | 0 / 0 |
| Bonus VIP | 0 (arrondi, ~4 % de 8 centimes) |
| Net | 8 centimes |

L’estimation **passe**. En revanche la **création de vente** avec cet item est **refusée** (voir 6.7) : minimum **100 centimes (1,00 EUR)**.

### Item éligible (114 centimes)

Skin : **StatTrak™ MP9 \| Goo (Well-Worn)** (`asset_id` `51149522091`)

| Champ | Valeur | Lecture |
|---|---|---|
| Brut | 114 centimes | 1,14 $ |
| Frais vente | 0 / 0 | pas de frais à la vente |
| Bonus VIP / merchant | +5 centimes | |
| Net | 119 centimes | **1,19 $** si la vente va au bout |

C’est un devis. Rien n’est vendu à cette étape.

---

## 6.5 Liste des ventes — `GET /api/v1/partner/trades?limit=5`

**Résultat :** OK

- **73 ventes** avant la création de test, **74** après.
- Les plus récentes (avant ce test) étaient surtout `cancelled`, plus une vente `available` plus ancienne (couteaux, juillet).

Après création, la première ligne est bien la vente de test :

- `TRADE-1788366311862-66FD09` — statut `accepted_by_bot` — 114 centimes.

---

## 6.6 Détail d’une vente — `GET /api/v1/partner/trades/{id}`

**Résultat :** OK, deux lectures.

### Ancienne vente (contrôle lecture)

`TRADE-1788356023966-6B7BA4` — **annulée**.  
Skin : StatTrak™ MP9 \| Goo (WW), 1,14 $. C’est le même type de skin que celui revendu ensuite (l’offre précédente n’avait pas été acceptée, le skin est revenu en inventaire).

### Vente créée pendant ce test

`TRADE-1788366311862-66FD09`

| Champ | Valeur |
|---|---|
| Statut | `accepted_by_bot` (offre envoyée) |
| Skin | StatTrak™ MP9 \| Goo (Well-Worn) |
| Brut / net | 114 / 119 centimes |
| Ticket | `18442c9fdc1d40139d089f9c4363fd38` |
| Steam visé | `76561199040420116` |
| Créée le | 2 sept. 2026, 18:25 (Paris) |
| Dispo prévue | 9 sept. 2026 (hold 7 jours **si** l’offre est acceptée) |

---

## 6.7 Créer une vente — `POST /api/v1/partner/trades`

### Premier essai (item 8 centimes) — attendu KO

**HTTP 400** `VALIDATION_ERROR`  
Message : `Gross value must be at least 1.00 EUR (100 cents)`

Utile à documenter côté partenaire : l’estimation accepte un lot trop petit, la création le refuse.

### Deuxième essai (item 114 centimes) — OK

**HTTP 201**

| Champ | Valeur |
|---|---|
| Numéro | `TRADE-1788366311862-66FD09` |
| Ticket | `18442c9fdc1d40139d089f9c4363fd38` |
| Statut à la création | `accepted_by_bot` = **offre envoyée** |
| Brut | 114 centimes (1,14 $) |
| Net | 119 centimes (bonus +5) |
| Disponible le | 9 sept. 2026 si le trade Steam est accepté |

Le `trade_url` utilisé est celui renvoyé par `/me` (même Steam que la connexion).

**Action humaine restante :** accepter (ou ignorer) l’offre sur Steam :

https://steamcommunity.com/profiles/76561199040420116/tradeoffers

Si on n’accepte pas : la vente passera à `cancelled`, le skin reviendra, **aucun argent encaissé**.

---

## 6.8 Payout — non testé

Pas d’appel `POST /payouts`, comme demandé.

Pour le tester plus tard il faudrait une vente en `available` + KYC (déjà OK ici) + moyen de paiement déjà configuré. Il existe déjà des ventes `available` sur ce compte ; elles n’ont **pas** été touchées.

---

## 6.9 Webhook — `PUT` / `GET /webhook` + livraison

**Résultat :** OK

- `PUT` a enregistré une URL HTTPS publique (webhook.site).
- `GET` confirme l’URL, le header `X-MoonSkin-Signature`, et précise que le secret n’est **pas** renvoyé par l’API.

À la création de la vente, MoonSkin a poussé **1** POST :

| Champ | Valeur |
|---|---|
| Type | `trade.created` |
| Trade | `TRADE-1788366311862-66FD09` |
| Statut dans le message | `accepted_by_bot` |
| User-Agent | `MoonSkin-Webhook/1.0` |
| Header event | `X-MoonSkin-Event-Id` = même `event_id` que le body |
| Signature | `t=<unix>,v1=<hmac_sha256_hex>` |
| HMAC | **valide** (secret webhook × `timestamp.rawBody`) |

---

## Fil de l’histoire

1. La clé `msk_live_…` est acceptée (Bearer).  
2. Le compte est identifié, KYC OK, solde là, Trade Link = Steam de connexion.  
3. L’inventaire vendable est lisible (176 items).  
4. On peut estimer un prix sans vendre.  
5. Un lot **&lt; 1,00 EUR** s’estime mais **ne se vend pas**.  
6. Un lot ≥ 1,00 EUR crée une vraie offre Steam (`201`, statut offre envoyée).  
7. Un programme externe est notifié (`trade.created`) avec une signature vérifiable.  
8. Le payout n’a pas été lancé.

---

## Points d’attention

1. **Révoquer la clé** quand tu as fini (tu l’as dit). Elle a servi en prod.  
2. **Offre Steam ouverte** sur le compte Nyouz : l’accepter ou la laisser expirer / s’annuler.  
3. Minimum de vente **100 centimes** côté `POST /trades`, pas côté `POST /estimate`.  
4. Journal admin (`/admin/api-clients`) non ouvert dans ce run : à checker à la main si tu veux voir les 9 appels + la livraison webhook.

---

## Mini lexique

| Mot API | Signification |
|---|---|
| `success: true` | L’appel a fonctionné |
| centimes | 100 = 1,00 (unité API) |
| `accepted_by_bot` | Offre Steam envoyée, à accepter |
| `cancelled` | Offre refusée / expirée / jamais acceptée |
| `available` | Hold Steam terminé, payout possible |
| Trade Link | Lien Steam « envoyer une offre » |
| Webhook | POST automatique vers une URL HTTPS publique |
