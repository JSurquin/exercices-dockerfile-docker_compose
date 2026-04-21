# ⚠️ Comparaison : Solution DANGEREUSE vs Solution SÛRE

## ❌ Solution DANGEREUSE (ce qu'on évite)

### Flux avec écrasement du steamId

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Première connexion Steam                                      │
│                                                                   │
│   Steam OpenID → steamId = 76561199040420116                    │
│                                                                   │
│   Base de données :                                              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561199040420116  ← Utilisé pour connexion  │    │
│   │ tradeLink: null                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Ajout Trade Link (autre compte)                              │
│                                                                   │
│   Trade Link: partner=123456789 → steamId = 76561198083722517  │
│                                                                   │
│   ❌ MISE À JOUR DANGEREUSE :                                    │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561198083722517  ← ÉCRASÉ ! 💥            │    │
│   │ tradeLink: https://steamcomm.../123456789              │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. Tentative de reconnexion                                      │
│                                                                   │
│   Steam OpenID → steamId = 76561199040420116                    │
│   ↓                                                               │
│   Recherche en BDD : WHERE steamId = '76561199040420116'        │
│   ↓                                                               │
│   ❌ NOT FOUND ! L'utilisateur a été écrasé !                    │
│   ↓                                                               │
│   💥 Création d'un NOUVEAU compte (doublon)                      │
│                                                                   │
│   Base de données :                                              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561198083722517  ← Ancien (orphelin)       │    │
│   │ tradeLink: https://...                                 │    │
│   ├───────────────────────────────────────────────────────┤    │
│   │ id: xyz789                                             │    │
│   │ steamId: 76561199040420116  ← Nouveau (doublon)       │    │
│   │ tradeLink: null                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
│   🚨 PROBLÈMES :                                                 │
│   • L'utilisateur perd son historique                           │
│   • Balance perdue                                               │
│   • KYC à refaire                                                │
│   • Doublons en base                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Solution SÛRE (ce qu'on fait)

### Flux sans écrasement - extraction à la volée

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Première connexion Steam                                      │
│                                                                   │
│   Steam OpenID → steamId = 76561199040420116                    │
│                                                                   │
│   Base de données :                                              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561199040420116  ← Utilisé pour connexion  │    │
│   │ tradeLink: null                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Page /sell SANS Trade Link                                   │
│                                                                   │
│   getInventorySteamId():                                         │
│   ┌─────────────────────────────────────────────────────┐      │
│   │ if (user.tradeLink) {          // false             │      │
│   │   // ...                                             │      │
│   │ }                                                     │      │
│   │ return user.steamId64;  // ← Fallback               │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                   │
│   Inventaire chargé : 76561199040420116 ✅                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. Ajout Trade Link (autre compte)                              │
│                                                                   │
│   Trade Link: partner=123456789 → steamId = 76561198083722517  │
│                                                                   │
│   ✅ MISE À JOUR SÛRE (UNIQUEMENT le trade link) :              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561199040420116  ← INTACT ! ✅            │    │
│   │ tradeLink: https://steamcomm.../123456789              │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. Page /sell AVEC Trade Link                                   │
│                                                                   │
│   getInventorySteamId():                                         │
│   ┌─────────────────────────────────────────────────────┐      │
│   │ if (user.tradeLink) {          // true              │      │
│   │   extract = parseSteamId(user.tradeLink);          │      │
│   │   return 76561198083722517;  // ← Du trade link    │      │
│   │ }                                                     │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                   │
│   Inventaire chargé : 76561198083722517 ✅                      │
│   (Compte secondaire)                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. Reconnexion                                                   │
│                                                                   │
│   Steam OpenID → steamId = 76561199040420116                    │
│   ↓                                                               │
│   Recherche en BDD : WHERE steamId = '76561199040420116'        │
│   ↓                                                               │
│   ✅ FOUND ! Même utilisateur                                    │
│                                                                   │
│   Base de données :                                              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ id: abc123                                             │    │
│   │ steamId: 76561199040420116  ← Toujours le même        │    │
│   │ tradeLink: https://steamcomm.../123456789              │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
│   ✅ AVANTAGES :                                                 │
│   • Même compte, même historique                                │
│   • Balance préservée                                            │
│   • KYC préservé                                                 │
│   • Pas de doublons                                              │
│   • Inventaire du compte secondaire toujours chargé             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Comparaison côte à côte

| Aspect | Solution DANGEREUSE ❌ | Solution SÛRE ✅ |
|--------|----------------------|------------------|
| **Base de données** | Écrase `steamId` | Stocke `tradeLink` seulement |
| **Authentification** | Casse après changement | Toujours fonctionnelle |
| **Doublons** | Risque de comptes dupliqués | Aucun doublon |
| **Historique** | Perdu | Préservé |
| **Balance** | Perdue | Préservée |
| **KYC** | À refaire | Préservé |
| **Multi-comptes** | Non supporté | Supporté nativement |

## 🔑 Le secret : Extraction à la volée

```typescript
// ❌ DANGER : Stockage permanent
UPDATE user 
SET steamId = '76561198083722517'  // ← Écrase l'authentification
WHERE id = 'abc123';

// ✅ SAFE : Extraction temporaire
const inventorySteamId = user.tradeLink 
  ? parseSteamId64FromUserInput(user.tradeLink)  // ← Calculé en temps réel
  : user.steamId64;  // ← Fallback sûr
```

## 📊 État de la base de données

### ❌ Après solution dangereuse
```sql
-- Avant
SELECT * FROM user WHERE id = 'abc123';
│ steamId: 76561199040420116 │

-- Après ajout trade link
SELECT * FROM user WHERE id = 'abc123';
│ steamId: 76561198083722517 │  -- 💥 CHANGÉ !

-- Tentative reconnexion
SELECT * FROM user WHERE steamId = '76561199040420116';
│ (empty)                    │  -- 💥 PERDU !
```

### ✅ Après solution sûre
```sql
-- Avant
SELECT * FROM user WHERE id = 'abc123';
│ steamId: 76561199040420116 │ tradeLink: NULL │

-- Après ajout trade link
SELECT * FROM user WHERE id = 'abc123';
│ steamId: 76561199040420116 │ tradeLink: https://... │  -- ✅ INTACT !

-- Reconnexion
SELECT * FROM user WHERE steamId = '76561199040420116';
│ steamId: 76561199040420116 │ tradeLink: https://... │  -- ✅ TROUVÉ !
```

## 🎯 Résumé visuel

```
┌─────────────────────────────────────────────────────────────┐
│                    RÈGLE D'OR                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Le steamId est comme un NUMÉRO DE SÉCURITÉ SOCIALE :      │
│                                                              │
│  ❌ NE CHANGE JAMAIS                                        │
│  ❌ NE S'ÉCRASE JAMAIS                                      │
│  ❌ NE SE REMPLACE JAMAIS                                   │
│                                                              │
│  Le tradeLink est comme une ADRESSE POSTALE :              │
│                                                              │
│  ✅ PEUT CHANGER                                            │
│  ✅ PEUT ÊTRE VIDE                                          │
│  ✅ PEUT POINTER VERS UN AUTRE COMPTE                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Cette solution garantit la sécurité et la flexibilité sans compromettre l'authentification.** 🎉
