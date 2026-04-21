# 📸 Guide Visuel - Trade Link → Steam ID

## Vue d'ensemble de l'interface

### État 1 : Aucun Trade Link configuré

```
╔════════════════════════════════════════════════════════════════╗
║ 🔗 Trade Link Steam                                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ 📘 Comment obtenir mon Trade Link ?                            ║
║                                                                 ║
║ 1. Ouvrez Steam et allez dans votre inventaire                ║
║ 2. Cliquez sur "Paramètres de confidentialité"                ║
║ 3. Copiez l'URL du Trade Link                                 ║
║                                                                 ║
║ [ 🔗 Ouvrir Steam ]  [ 📋 Copier exemple ]                     ║
║                                                                 ║
║ ─────────────────────────────────────────────────────────────  ║
║                                                                 ║
║ URL du Trade Link                                              ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ https://steamcommunity.com/tradeoffer/new/?partner=...    │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║ [ 💾 Enregistrer ]  [ 🗑️ Effacer ]                             ║
║                                                                 ║
║ ⚠️ Important : Assurez-vous que votre Trade Link est à jour    ║
║    et que votre inventaire Steam est public.                   ║
╚════════════════════════════════════════════════════════════════╝
```

### État 2 : Trade Link saisi (valide)

```
╔════════════════════════════════════════════════════════════════╗
║ 🔗 Trade Link Steam                        ✓ Configuré         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ URL du Trade Link                                              ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ https://steamcommunity.com/tradeoffer/new/?partner=1234... │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║ ✅ Format valide                                                ║
║                                                                 ║
║ ╔═══════════════════════════════════════════════════════════╗ ║
║ ║ ℹ️ Steam ID détecté                                        ║ ║
║ ║                                                             ║ ║
║ ║ 📝 76561198083722517                                       ║ ║
║ ║                                                             ║ ║
║ ║ ☑️ Mettre à jour automatiquement mon Steam ID             ║ ║
║ ║    Cela permettra de charger automatiquement votre        ║ ║
║ ║    inventaire avec ce compte Steam lors de la vente.      ║ ║
║ ╚═══════════════════════════════════════════════════════════╝ ║
║                                                                 ║
║ [ 💾 Enregistrer ]  [ 🗑️ Effacer ]                             ║
║                                                                 ║
║ ⚠️ Important : Assurez-vous que votre Trade Link est à jour    ║
╚════════════════════════════════════════════════════════════════╝
```

### État 3 : Trade Link modifié (Steam ID différent)

```
╔════════════════════════════════════════════════════════════════╗
║ 🔗 Trade Link Steam                        ✓ Configuré         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ URL du Trade Link                                              ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ https://steamcommunity.com/tradeoffer/new/?partner=9876... │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║                                                                 ║
║ ✅ Format valide                                                ║
║                                                                 ║
║ ╔═══════════════════════════════════════════════════════════╗ ║
║ ║ ℹ️ Steam ID détecté                                        ║ ║
║ ║                                                             ║ ║
║ ║ 📝 76561198947919049  ← NOUVEAU                           ║ ║
║ ║                                                             ║ ║
║ ║ ☑️ Mettre à jour automatiquement mon Steam ID             ║ ║
║ ║    Cela permettra de charger automatiquement votre        ║ ║
║ ║    inventaire avec ce compte Steam lors de la vente.      ║ ║
║ ╚═══════════════════════════════════════════════════════════╝ ║
║                                                                 ║
║ ╔═══════════════════════════════════════════════════════════╗ ║
║ ║ ⚠️ Attention                                                ║ ║
║ ║                                                             ║ ║
║ ║ Le Steam ID extrait du Trade Link (76561198947919049)     ║ ║
║ ║ est différent de votre Steam ID actuel                     ║ ║
║ ║ (76561198083722517).                                       ║ ║
║ ║ Il sera mis à jour lors de la sauvegarde.                 ║ ║
║ ╚═══════════════════════════════════════════════════════════╝ ║
║                                                                 ║
║ [ 💾 Enregistrer ]  [ 🗑️ Effacer ]                             ║
╚════════════════════════════════════════════════════════════════╝
```

### État 4 : Trade Link invalide

```
╔════════════════════════════════════════════════════════════════╗
║ 🔗 Trade Link Steam                                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ URL du Trade Link                                              ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ https://steamcommunity.com/wrongurl                        │ ║
║ └────────────────────────────────────────────────────────────┘ ║
║   ↑ Bordure rouge                                              ║
║                                                                 ║
║ ╔═══════════════════════════════════════════════════════════╗ ║
║ ║ ❌ Format invalide                                          ║ ║
║ ║                                                             ║ ║
║ ║ Le Trade Link doit être au format :                        ║ ║
║ ║ https://steamcommunity.com/tradeoffer/new/?partner=...     ║ ║
║ ╚═══════════════════════════════════════════════════════════╝ ║
║                                                                 ║
║ [ 💾 Enregistrer ] (désactivé)  [ 🗑️ Effacer ]                 ║
╚════════════════════════════════════════════════════════════════╝
```

## Flux complet : Scénario utilisateur

### Étape 1 : L'utilisateur arrive sur /settings

```
┌─────────────────────────────────────────────────────────┐
│ MoonSkin                               👤 John Doe      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⚙️ Paramètres                                            │
│                                                          │
│ [Profil] [Sécurité] [Notifications] [Paiements] [Prefs]│
│                                                          │
│ ╔══════════════════════════════════════════════════════╗│
│ ║ 👤 Profil                                             ║│
│ ║ ┌─────────┐                                           ║│
│ ║ │ Avatar  │ John Doe                                  ║│
│ ║ │  [JPG]  │ Steam ID: 76561198083722517               ║│
│ ║ └─────────┘ ✓ KYC Vérifié  🎖️ Level 5                ║│
│ ╚══════════════════════════════════════════════════════╝│
│                                                          │
│ ╔══════════════════════════════════════════════════════╗│
│ ║ 🔗 Trade Link Steam               ❌ Non configuré    ║│ ← Pas encore configuré
│ ║                                                        ║│
│ ║ [Input vide]                                          ║│
│ ║                                                        ║│
│ ║ [ Enregistrer ]                                       ║│
│ ╚══════════════════════════════════════════════════════╝│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Étape 2 : L'utilisateur colle son Trade Link

```
┌─────────────────────────────────────────────────────────┐
│ ╔══════════════════════════════════════════════════════╗│
│ ║ 🔗 Trade Link Steam               ✓ Configuré        ║│ ← Badge vert
│ ║                                                        ║│
│ ║ ┌──────────────────────────────────────────────────┐ ║│
│ ║ │https://steamcommunity.com/tradeoffer/new/?part...│ ║│ ← Bordure verte
│ ║ └──────────────────────────────────────────────────┘ ║│
│ ║                                                        ║│
│ ║ ✅ Format valide                                       ║│
│ ║                                                        ║│
│ ║ ╔════════════════════════════════════════════════╗   ║│
│ ║ ║ ℹ️ Steam ID détecté                             ║   ║│ ← Nouvelle section
│ ║ ║                                                  ║   ║│
│ ║ ║ 76561198083722517                               ║   ║│ ← Steam ID extrait
│ ║ ║                                                  ║   ║│
│ ║ ║ ☑️ Mettre à jour automatiquement mon Steam ID  ║   ║│ ← Checkbox cochée
│ ║ ║    Cela permettra de charger automatiquement   ║   ║│
│ ║ ║    votre inventaire...                          ║   ║│
│ ║ ╚════════════════════════════════════════════════╝   ║│
│ ║                                                        ║│
│ ║ [ 💾 Enregistrer ]  [ 🗑️ Effacer ]                    ║│ ← Bouton actif
│ ╚══════════════════════════════════════════════════════╝│
└─────────────────────────────────────────────────────────┘
```

### Étape 3 : Après sauvegarde

```
┌─────────────────────────────────────────────────────────┐
│ 🎉 Trade Link et Steam ID sauvegardés avec succès !     │ ← Toast notification
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ╔══════════════════════════════════════════════════════╗│
│ ║ 👤 Steam ID                        ✓ Configuré        ║│ ← Aussi mis à jour
│ ║                                                        ║│
│ ║ 76561198083722517                                     ║│ ← Nouveau Steam ID
│ ║                                                        ║│
│ ║ ✅ Format valide                                       ║│
│ ╚══════════════════════════════════════════════════════╝│
└─────────────────────────────────────────────────────────┘
```

### Étape 4 : L'utilisateur va sur /sell

```
┌─────────────────────────────────────────────────────────┐
│ MoonSkin                               👤 John Doe      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 💰 Vendre mes skins                                      │
│                                                          │
│ ╔══════════════════════════════════════════════════════╗│
│ ║ Inventaire chargé pour                                ║│
│ ║ ┌────┐                                                ║│
│ ║ │ AV │ John Doe                                       ║│ ← Avatar + nom
│ ║ └────┘ 76561198083722517                              ║│ ← Steam ID détecté
│ ║                                                        ║│
│ ║ [ ✏️ Changer de compte ]                               ║│
│ ╚══════════════════════════════════════════════════════╝│
│                                                          │
│ 📦 Votre inventaire                       [🔄 Rafraîchir]│
│                                                          │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ 🔫 AK  │ │ 🗡️ Knife│ │ 🎨 Skin│ │ 💎 Rare│           │ ← Inventaire chargé
│ │ $125.50│ │ $450.00│ │ $12.30 │ │ $890.00│           │   automatiquement
│ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Comparaison Avant/Après

### ❌ Avant (problème)

```
1. User entre son Trade Link dans /settings
2. User va sur /sell
3. ❌ Inventaire ne se charge pas (pas de Steam ID)
4. User retourne dans /settings
5. User copie son Steam ID depuis Steam
6. User colle son Steam ID manuellement
7. User retourne sur /sell
8. ✅ Inventaire se charge enfin
```

### ✅ Après (solution)

```
1. User entre son Trade Link dans /settings
2. ✨ Steam ID détecté automatiquement
3. User clique sur "Enregistrer"
4. User va sur /sell
5. ✅ Inventaire se charge automatiquement
```

## Mobile responsive

### Vue mobile (portrait)

```
┌─────────────────────────┐
│ MoonSkin         ☰ Menu │
├─────────────────────────┤
│                          │
│ 🔗 Trade Link Steam      │
│          ✓ Configuré     │
│                          │
│ ┌──────────────────────┐│
│ │https://steamcomm...  ││ ← Texte tronqué
│ └──────────────────────┘│
│                          │
│ ✅ Format valide         │
│                          │
│ ╔════════════════════╗  │
│ ║ ℹ️ Steam ID détecté ║  │
│ ║                     ║  │
│ ║ 76561198083722517  ║  │
│ ║                     ║  │
│ ║ ☑️ Mettre à jour   ║  │ ← Checkbox adaptée
│ ║    mon Steam ID    ║  │
│ ╚════════════════════╝  │
│                          │
│ [ 💾 Enregistrer ]       │ ← Bouton pleine largeur
│ [ 🗑️ Effacer ]           │
│                          │
└─────────────────────────┘
```

## Couleurs et thèmes

### Theme Light (jour)

```
Boîte Steam ID détecté:
- Background: bg-blue-50
- Border: border-blue-200
- Text: text-blue-900

Alerte différence:
- Background: bg-yellow-50
- Border: border-yellow-200
- Text: text-yellow-900
```

### Theme Dark (nuit)

```
Boîte Steam ID détecté:
- Background: bg-blue-950/20
- Border: border-blue-800
- Text: text-blue-100

Alerte différence:
- Background: bg-yellow-950/20
- Border: border-yellow-800
- Text: text-yellow-100
```

## Animations (optionnel)

### Apparition de la boîte Steam ID

```
Frame 1:  [Invisible]
Frame 2:  [Fade in + Slide down]
Frame 3:  [Fully visible]

Durée: 0.3s
Easing: ease-out
```

---

**Note :** Ces visuels sont des représentations ASCII. L'interface réelle utilise shadcn/ui + Tailwind CSS pour un rendu professionnel et moderne.
