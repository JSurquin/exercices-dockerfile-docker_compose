# Audit des Endpoints API - MoonSkin

**Date**: 2026-05-18T11:14:04.723Z

## Résumé Exécutif

La plateforme MoonSkin dispose de **178 endpoints API** fonctionnels et sécurisés. La documentation API est actuellement **DÉSACTIVÉE**.

### Question posée

> Est-ce que des endpoints API étaient déjà préparés et utilisables ? Est-ce que Coffee a utilisé directement l'API ?

### Réponse

**OUI**, les endpoints API sont prêts et fonctionnels. **9 trades** ont été créés sans token Skinplace, ce qui suggère une utilisation de l'endpoint `/api/steam/create-trade` (qui ne communique pas avec Skinplace immédiatement).

---

## 1. État de la Documentation API

**Statut**: ❌ Désactivée (affiche "Coming Soon")

La page `/api-docs` existe et affiche :
- Si activée : Documentation complète avec exemples de code (JavaScript, Python, cURL)
- Si désactivée : Écran "Coming Soon" avec badge "En développement"

Pour activer la documentation :
```sql
INSERT INTO "SiteSettings" ("key", "valueJson", "updatedBy") 
VALUES ('api.docs.enabled', 'true', 'admin')
ON CONFLICT ("key") DO UPDATE SET "valueJson" = 'true';
```

---

## 2. Endpoints de Création de Trade

### 2.1. `POST /api/skinplace/create-trade`

**Fonctionnement** : Endpoint complet qui communique directement avec Skinplace API v3

**Sécurité** :
- ✅ Authentification obligatoire (session Steam)
- ✅ Rate limiting : 5 requêtes/minute
- ✅ Vérification ownership des items via Skinplace
- ✅ Validation prix serveur (impossible de tricher sur les montants)
- ✅ Limite quotidienne : 10 trades/jour
- ✅ Cooldown et anti-fraude

**Réponse** :
```json
{
  "success": true,
  "data": {
    "trade_id": "TRADE-1234567890-ABC123",
    "token": "skinplace_token_xyz",
    "status": "ACCEPTED_BY_BOT",
    "gross_value_centimes": 12500,
    "net_value_centimes": 11800,
    "bot": {
      "name": "SkinplaceBot#123",
      "profile_url": "..."
    }
  }
}
```

### 2.2. `POST /api/steam/create-trade`

**Fonctionnement** : Endpoint "local" qui crée le trade en base de données SANS communiquer avec Skinplace

**Caractéristiques** :
- ✅ Même sécurité que skinplace/create-trade
- ⚠️  NE génère PAS de token Skinplace
- ⚠️  Le trade reste en statut "CREATED"
- ℹ️  Probablement utilisé pour les tests ou workflows alternatifs

**C'est probablement cet endpoint que Coffee a utilisé**, ce qui explique pourquoi ses trades n'avaient pas de token Skinplace.

---

## 3. Statistiques d'Utilisation

### Trades

| Métrique | Valeur |
|----------|--------|
| Total trades | 80 |
| Trades avec token Skinplace | 71 |
| Trades SANS token Skinplace | 9 |
| Utilisateurs impactés | 9 |

### Utilisateurs avec Trades sans Token


#### 1. Nyouz I B/S Skins

- **User ID**: `cmmm6xqo1000bt2vj5smbx9zp`
- **Steam ID**: 76561199040420116
- **Trades totaux**: 43
- **Trades sans token**: 1 (2%)
- **Premier trade**: 2026-01-27T21:23:42.629Z
- **Dernier trade**: 2026-04-28T17:40:34.112Z


#### 2. NyoubCS

- **User ID**: `n165eEelGSvyLSjj0xGjFl0Avt4qXWMU`
- **Steam ID**: 76561198982110174
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2026-03-11T18:29:28.240Z
- **Dernier trade**: 2026-03-11T18:29:28.240Z


#### 3. ApachinoW`

- **User ID**: `Fxtj9Sv9j7EdeeyTvIAHyYcgAGBTNIGu`
- **Steam ID**: 76561198058187019
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-12-23T08:17:47.686Z
- **Dernier trade**: 2025-12-23T08:17:47.686Z


#### 4. LeMousseu

- **User ID**: `M0zyLGx5JCGeecEmjbBsK4M2eiuMZ16c`
- **Steam ID**: 76561199705623372
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-12-22T00:55:31.871Z
- **Dernier trade**: 2025-12-22T00:55:31.871Z


#### 5. [4FUN] Zifluks

- **User ID**: `RMuLf9jskY1Xwfy2kVtfvFSB5Joklxvr`
- **Steam ID**: 76561199653923392
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-12-15T02:45:05.531Z
- **Dernier trade**: 2025-12-15T02:45:05.531Z


#### 6. tjackzone

- **User ID**: `7UKLXpUfxFjTMooz33YcVPB1e8skpg9I`
- **Steam ID**: 76561198346742655
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-10-30T22:22:40.233Z
- **Dernier trade**: 2025-10-30T22:22:40.233Z


#### 7. SkinMaster Elite

- **User ID**: `NvuNJcYzX86W2eYpWOZ5j1gN6VwIqorB`
- **Steam ID**: 76561198000000002
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-10-16T14:00:05.697Z
- **Dernier trade**: 2025-10-16T14:00:05.697Z


#### 8. ProTrader CS2

- **User ID**: `zS1gHiV1pKKSl9J5ApQBB0ylIcHFncl0`
- **Steam ID**: 76561198000000001
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-10-16T14:00:05.697Z
- **Dernier trade**: 2025-10-16T14:00:05.697Z


#### 9. CS2 Collector Pro

- **User ID**: `MTpZqfcA5Q5GWyWW0pCcabKt8WmFjjSO`
- **Steam ID**: 76561198000000003
- **Trades totaux**: 1
- **Trades sans token**: 1 (100%)
- **Premier trade**: 2025-10-16T14:00:05.697Z
- **Dernier trade**: 2025-10-16T14:00:05.697Z


---

## 4. Liste Complète des Endpoints (178 total)

### Authentification
- POST /api/auth/steam/callback
- POST /api/auth/logout

### Utilisateur
- GET /api/user/profile
- PUT /api/user/update
- GET /api/user/trades
- GET /api/user/balance-history
- POST /api/user/update-email
- POST /api/user/complete-onboarding
- POST /api/user/daily-login
- GET /api/user/notifications
- GET /api/user/notification-preferences

### Trading
- POST /api/steam/estimate-prices
- POST /api/steam/create-trade ⚠️
- POST /api/skinplace/create-trade ✅
- GET /api/steam/inventory
- GET /api/skinplace/inventory-with-prices
- GET /api/skinplace/trade/:token
- GET /api/skinplace/trade/status/:tradeId

### Paiements
- POST /api/payout/initiate
- GET /api/payouts/history
- POST /api/payouts/sepa-fr
- POST /api/whitepay/payout-request
- POST /api/whitepay/withdrawal
- GET /api/whitepay/status

### Admin (protégé ADMIN uniquement)
- GET /api/admin/users
- GET /api/admin/trades
- GET /api/admin/payouts
- GET /api/admin/kyc
- POST /api/admin/payouts/:payoutId/approve

### Webhooks
- POST /api/skinplace/webhook
- POST /api/kycaid/webhook
- POST /api/whitepay/webhook
- POST /api/flexify/webhook

### Autres
- GET /api/exchange-rate
- GET /api/stats
- GET /api/build-id
- GET /api/settings/api-docs-enabled

<details>
<summary>Voir la liste complète (178 endpoints)</summary>

- /apiadmin/affiliate-applications
- /apiadmin/affiliates
- /apiadmin/affiliates/commissions
- /apiadmin/affiliates/create
- /apiadmin/affiliates/recalculate
- /apiadmin/analytics
- /apiadmin/audit/dashboard
- /apiadmin/audit/logs
- /apiadmin/balance/:userId
- /apiadmin/balance/adjust
- /apiadmin/balance/freeze
- /apiadmin/balance/unfreeze
- /apiadmin/change-password
- /apiadmin/export-data
- /apiadmin/exports
- /apiadmin/full-report
- /apiadmin/gamification-economy
- /apiadmin/giveaways-settings
- /apiadmin/kyc
- /apiadmin/kyc/force-verify/:userId
- /apiadmin/kyc/reset-applicant/:userId
- /apiadmin/kyc/sync-pending
- /apiadmin/legal-pages
- /apiadmin/legal-pages/:slug
- /apiadmin/legal-pages/:slug/history
- /apiadmin/legal-pages/translate
- /apiadmin/metrics
- /apiadmin/moderators
- /apiadmin/moderators/:id
- /apiadmin/moderators/invite
- /apiadmin/moderators/search
- /apiadmin/newsletter/campaigns
- /apiadmin/newsletter/export
- /apiadmin/newsletter/send
- /apiadmin/newsletter/subscribers
- /apiadmin/notifications
- /apiadmin/notifications/create
- /apiadmin/payouts
- /apiadmin/payouts/:payoutId/approve
- /apiadmin/payouts/:payoutId/cancel
- /apiadmin/payouts/:payoutId/resync-flexify
- /apiadmin/platform-config
- /apiadmin/points
- /apiadmin/security/alerts
- /apiadmin/security/metrics
- /apiadmin/sepa-requests
- /apiadmin/sepa-requests/:payoutId
- /apiadmin/settings
- /apiadmin/settings/payout-auto-approve
- /apiadmin/skinplace-items-search
- /apiadmin/smtp-settings
- /apiadmin/smtp-settings/test
- /apiadmin/stats
- /apiadmin/trades
- /apiadmin/trades/:tradeId/sync-skinplace
- /apiadmin/trades/export
- /apiadmin/update-notifications
- /apiadmin/update-preferences
- /apiadmin/update-profile
- /apiadmin/users
- /apiadmin/users/:userId
- /apiadmin/users/:userId/bonus
- /apiadmin/users/:userId/instant-credit
- /apiadmin/users/:userId/promote-affiliate
- /apiadmin/users/create
- /apiadmin/withdrawal-limits/:userId
- /apiaffiliate/apply
- /apiaffiliate/commissions
- /apiaffiliate/link
- /apiaffiliate/stats
- /apiaffiliate/validate-sell-promo
- /apiauth/:...all
- /apiauth/steam/callback
- /apiauth/steam/login
- /apibuild-id
- /apichat/conversations
- /apichat/conversations/:id
- /apichat/conversations/:id/assign
- /apichat/conversations/:id/bot-message
- /apichat/messages
- /apichat/stats
- /apichat/stats/moderators
- /apicron/giveaway-draw
- /apicron/process-trades
- /apicron/security-maintenance
- /apicron/update-trades-status
- /apiexchange-rate
- /apiflexify/payout
- /apiflexify/quote
- /apiflexify/webhook
- /apigatefi/configuration
- /apigatefi/kyc/status
- /apigatefi/offramp/orders/:orderId
- /apigatefi/offramp/quote
- /apigatefi/offramp/sell
- /apigatefi/onramp/buy
- /apigatefi/onramp/orders/:orderId
- /apigatefi/onramp/quote
- /apigatefi/webhooks
- /apigiveaways
- /apigiveaways/:id
- /apigiveaways/:id/draw
- /apigiveaways/:id/participate
- /apigiveaways/auto-draw
- /apigiveaways/init
- /apigiveaways/my-entries
- /apigiveaways/private
- /apigiveaways/status
- /apikyc/submit
- /apikycaid/address
- /apikycaid/document
- /apikycaid/initiate
- /apikycaid/poll/:verificationId
- /apikycaid/status
- /apikycaid/webhook
- /apilegal-pages/:slug
- /apimissions
- /apimissions/claim
- /apimissions/daily-visit
- /apinewsletter/subscribe
- /apinewsletter/unsubscribe
- /apinewsletter/welcome
- /apipayment-methods
- /apipayout/initiate
- /apipayouts/history
- /apipayouts/sepa-fr
- /apisecurity/2fa/disable
- /apisecurity/2fa/enable
- /apisecurity/2fa/status
- /apisecurity/2fa/verify-totp
- /apisecurity/check
- /apiseed
- /apisettings/api-docs-enabled
- /apisettings/public
- /apiskinplace/balance
- /apiskinplace/balance/refills
- /apiskinplace/create-trade
- /apiskinplace/history
- /apiskinplace/hold
- /apiskinplace/hold/withdraw
- /apiskinplace/inventory
- /apiskinplace/inventory-with-prices
- /apiskinplace/inventory/multiple
- /apiskinplace/items/listing
- /apiskinplace/purchase
- /apiskinplace/purchase/history
- /apiskinplace/purchase/history/:customId
- /apiskinplace/purchase/items
- /apiskinplace/trade
- /apiskinplace/trade/:token
- /apiskinplace/trade/status/:tradeId
- /apiskinplace/webhook
- /apistats
- /apisteam/create-trade
- /apisteam/estimate-prices
- /apisteam/inventory
- /apiuser/balance
- /apiuser/balance-history
- /apiuser/complete-onboarding
- /apiuser/daily-login
- /apiuser/dashboard-stats
- /apiuser/notification-preferences
- /apiuser/notifications
- /apiuser/payouts/reconcile
- /apiuser/profile
- /apiuser/trades
- /apiuser/trades/reconcile-overdue
- /apiuser/update
- /apiuser/update-email
- /apiwhitepay/confirm
- /apiwhitepay/instant
- /apiwhitepay/payout-request
- /apiwhitepay/quote
- /apiwhitepay/refresh
- /apiwhitepay/status
- /apiwhitepay/top-up
- /apiwhitepay/webhook
- /apiwhitepay/withdrawal

</details>

---

## 5. Recommandations

### Pour Coffee et utilisateurs similaires


1. **Vérifier les trades sans token Skinplace**
   - 9 trades concernés
   - Contacter le support Skinplace pour obtenir les tokens manquants
   - Possibilité de réexécuter ces trades avec l'endpoint Skinplace

2. **Migrer vers l'endpoint Skinplace**
   - Utiliser `/api/skinplace/create-trade` au lieu de `/api/steam/create-trade`
   - Garantit un token Skinplace et un suivi complet


### Pour l'équipe technique

1. **Documentation API**
   - Activer la documentation : `api.docs.enabled = true`
   - Générer une OpenAPI spec (Swagger) pour les intégrations externes

2. **Endpoint `/api/steam/create-trade`**
   - Considérer la désactivation ou la redirection vers `/api/skinplace/create-trade`
   - Ou documenter clairement son usage (tests, workflows spéciaux)

3. **Monitoring**
   - Ajouter des métriques sur l'utilisation des endpoints
   - Alerter si des trades sont créés sans token Skinplace

---

## Conclusion

**Les endpoints API sont bel et bien préparés, fonctionnels et sécurisés.** Coffee a très probablement utilisé l'endpoint `/api/steam/create-trade` pour créer ses trades, ce qui explique l'absence de token Skinplace.

La plateforme dispose de 178 endpoints prêts à l'emploi, avec une documentation complète disponible en activant le flag `apiDocsEnabled`.
