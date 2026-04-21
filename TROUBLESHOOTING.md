# 🚨 Dépannage - Erreur "Accès non autorisé" sur /sell

## Votre situation actuelle

```
Steam ID utilisé: 76561198113946656
Erreur: Accès non autorisé
```

### Trade Link qui fonctionne
```
https://steamcommunity.com/tradeoffer/new/?partner=1080154388&token=nQ_kZg88
→ Steam ID: 76561199040420116 ✅
```

### Trade Link qui ne fonctionne pas
```
→ Steam ID: 76561198113946656 ❌
Cause probable: Inventaire privé ou compte inexistant
```

## 🔧 Solutions immédiates

### Solution 1 : Supprimer le Trade Link problématique

1. **Allez dans `/settings`**
2. **Cliquez sur le bouton rouge "Supprimer le Trade Link"**
3. **Retournez sur `/sell`**
4. ✅ L'inventaire se chargera avec votre compte de connexion

### Solution 2 : Remettre l'ancien Trade Link

1. **Allez dans `/settings`**
2. **Collez l'ancien Trade Link qui fonctionnait** :
   ```
   https://steamcommunity.com/tradeoffer/new/?partner=1080154388&token=nQ_kZg88
   ```
3. **Cliquez sur "Enregistrer"**
4. **Retournez sur `/sell`**
5. ✅ L'inventaire se chargera correctement

### Solution 3 : Vérifier que l'inventaire du nouveau compte est public

Si vous voulez vraiment utiliser le compte Steam ID `76561198113946656` :

1. **Connectez-vous à Steam avec ce compte**
2. **Allez dans vos paramètres de confidentialité** :
   ```
   https://steamcommunity.com/profiles/76561198113946656/edit/settings
   ```
3. **Définissez votre inventaire comme "Public"**
4. **Attendez 2-3 minutes (cache Steam)**
5. **Retournez sur `/sell` et cliquez sur "Réessayer"**

## 📊 Comprendre l'erreur

### Pourquoi "Accès non autorisé" ?

```
┌─────────────────────────────────────────────────────────┐
│ Votre Trade Link actuel                                  │
│ → Steam ID: 76561198113946656                           │
│                                                          │
│ MoonSkin essaie de charger l'inventaire                 │
│ → Steam API : "Inventaire privé" ❌                     │
│ → Ou : "Profil introuvable" ❌                          │
│                                                          │
│ Résultat: Erreur "Accès non autorisé"                   │
└─────────────────────────────────────────────────────────┘
```

### Pourquoi l'ancien Trade Link fonctionne ?

```
┌─────────────────────────────────────────────────────────┐
│ Ancien Trade Link                                        │
│ → Steam ID: 76561199040420116                           │
│                                                          │
│ MoonSkin charge l'inventaire                            │
│ → Steam API : "Inventaire public" ✅                    │
│                                                          │
│ Résultat: Inventaire chargé correctement                │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Actions recommandées

### Option A : Retour au compte qui fonctionne (RAPIDE)

```bash
1. /settings
2. "Supprimer le Trade Link" (bouton rouge)
   OU
   Remettre: https://steamcommunity.com/tradeoffer/new/?partner=1080154388&token=nQ_kZg88
3. Sauvegarder
4. /sell → ✅ Fonctionne
```

### Option B : Débloquer le nouveau compte (LONG)

```bash
1. Vérifier que le compte 76561198113946656 existe
2. Vérifier que l'inventaire est public
3. Attendre le cache Steam (2-3 min)
4. Réessayer sur /sell
```

## 🔍 Vérifications techniques

### Vérifier quel Steam ID est stocké en BDD

Regardez dans votre base de données :

```sql
SELECT steamId, tradeLink FROM "user" WHERE id = 'votre-user-id';
```

Vous devriez voir :
```
steamId: 76561199040420116  ← Votre compte de connexion (ne change jamais)
tradeLink: https://... (avec partner=...)
```

### Vérifier l'extraction

Dans la console du navigateur sur `/sell` :

```javascript
// Le Steam ID affiché devrait être celui extrait du Trade Link
// Si le Trade Link est vide, c'est celui de connexion
```

## 🎯 Nouvelle interface disponible

Avec les modifications d'aujourd'hui, vous avez maintenant dans `/settings` :

### Bouton "Supprimer le Trade Link"

Ce bouton permet de **revenir immédiatement** à votre compte de connexion sans avoir à effacer manuellement le champ.

```
┌──────────────────────────────────────────────────────┐
│ [ Enregistrer ]  [ Supprimer le Trade Link ]         │
│                    ↑                                  │
│                    Nouveau bouton rouge               │
└──────────────────────────────────────────────────────┘
```

## ✅ Résolution immédiate

**Pour résoudre votre problème maintenant** :

1. Allez dans `/settings`
2. Cliquez sur **"Supprimer le Trade Link"** (bouton rouge)
3. Ou remettez l'ancien Trade Link qui fonctionnait
4. Retournez sur `/sell`
5. ✅ L'inventaire devrait se charger

## 📞 Si le problème persiste

- Vérifiez les logs console du navigateur (F12)
- Vérifiez les logs serveur
- Le Steam ID du compte problématique existe-t-il vraiment ?
- L'inventaire est-il public ?

---

**TL;DR** : Le nouveau Trade Link pointe vers un compte privé/inexistant. Supprimez-le ou remettez l'ancien.
