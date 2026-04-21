# Guide de Test - Intégration Trade Link → Steam ID

## 🚀 Test Rapide

### Étape 1 : Démarrer le serveur de développement
```bash
npm run dev
```

### Étape 2 : Se connecter
1. Ouvrir http://localhost:3000
2. Se connecter avec Steam

### Étape 3 : Tester la nouvelle fonctionnalité

#### Test A : Ajout d'un Trade Link
1. Aller dans `/settings` (Paramètres)
2. Scroller jusqu'à la section "Trade Link Steam"
3. Coller un Trade Link de test : 
   ```
   https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh
   ```
4. ✅ **Vérifier** : Une boîte bleue apparaît avec "Steam ID détecté : 76561198083722517"
5. ✅ **Vérifier** : La checkbox "Mettre à jour automatiquement mon Steam ID" est cochée
6. Cliquer sur "Enregistrer"
7. ✅ **Vérifier** : Message de succès "Trade Link et Steam ID sauvegardés avec succès !"

#### Test B : Vérification de la synchronisation
1. Rester dans `/settings`
2. Scroller jusqu'à la section "Steam ID"
3. ✅ **Vérifier** : Le Steam ID affiché est bien "76561198083722517"
4. ✅ **Vérifier** : Badge vert "Configuré" visible

#### Test C : Chargement de l'inventaire
1. Aller sur `/sell` (Vendre)
2. ✅ **Vérifier** : L'inventaire se charge automatiquement avec le Steam ID du Trade Link
3. ✅ **Vérifier** : Le bon compte Steam est affiché

#### Test D : Changement de compte
1. Retourner dans `/settings`
2. Modifier le Trade Link avec un autre compte (changer le partner) :
   ```
   https://steamcommunity.com/tradeoffer/new/?partner=987654321&token=XyZaBcDe
   ```
3. ✅ **Vérifier** : Le nouveau Steam ID détecté s'affiche : "76561198947919049"
4. ✅ **Vérifier** : Une alerte jaune apparaît : "Le Steam ID extrait du Trade Link est différent..."
5. Cliquer sur "Enregistrer"
6. Aller sur `/sell`
7. ✅ **Vérifier** : Le nouvel inventaire se charge avec le nouveau compte

#### Test E : Décocher l'option
1. Retourner dans `/settings`
2. Modifier le Trade Link
3. Décocher "Mettre à jour automatiquement mon Steam ID"
4. Cliquer sur "Enregistrer"
5. ✅ **Vérifier** : Message "Trade Link sauvegardé avec succès" (sans mention du Steam ID)
6. Aller dans la section "Steam ID"
7. ✅ **Vérifier** : Le Steam ID n'a PAS changé

## 🎯 Résultat attendu

### Interface visuelle

```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Trade Link Steam                      ✓ Configuré         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ URL du Trade Link                                            │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ https://steamcommunity.com/tradeoffer/new/?partner... │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ✓ Format valide                                              │
│                                                               │
│ ╔═══════════════════════════════════════════════════════╗   │
│ ║ ℹ️ Steam ID détecté                                    ║   │
│ ║                                                         ║   │
│ ║ 76561198083722517                                      ║   │
│ ║                                                         ║   │
│ ║ ☑ Mettre à jour automatiquement mon Steam ID          ║   │
│ ║   Cela permettra de charger automatiquement votre     ║   │
│ ║   inventaire avec ce compte Steam lors de la vente.   ║   │
│ ╚═══════════════════════════════════════════════════════╝   │
│                                                               │
│ [ Enregistrer ]  [ Effacer ]                                 │
│                                                               │
│ ⚠️ Important : Assurez-vous que votre Trade Link est à jour │
└─────────────────────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Problème : Le Steam ID n'est pas extrait
- ✅ Vérifier que le Trade Link est au format correct
- ✅ Le Trade Link doit contenir `?partner=` et `&token=`

### Problème : L'inventaire ne se charge pas
- ✅ Vérifier que le Steam ID a bien été sauvegardé dans la base de données
- ✅ Vérifier que l'inventaire Steam est public
- ✅ Recharger la page `/sell`

### Problème : Le Steam ID détecté ne correspond pas
- ✅ Vérifier que le Trade Link appartient bien au compte souhaité
- ✅ Aller sur Steam pour obtenir le bon Trade Link

## 📱 Test sur mobile

1. Ouvrir sur mobile
2. Aller dans `/settings`
3. ✅ **Vérifier** : L'interface est responsive
4. ✅ **Vérifier** : La checkbox est cliquable
5. ✅ **Vérifier** : Les alertes s'affichent correctement

## ✅ Checklist finale

- [ ] Le Trade Link se sauvegarde correctement
- [ ] Le Steam ID est extrait automatiquement
- [ ] La checkbox fonctionne (cocher/décocher)
- [ ] L'alerte de différence s'affiche si nécessaire
- [ ] Le Steam ID se met à jour en base de données
- [ ] L'inventaire se charge avec le bon compte sur `/sell`
- [ ] Le message de succès est correct
- [ ] L'interface est responsive
- [ ] Aucune erreur console

## 🎬 Démo vidéo recommandée

1. Écran de départ (paramètres vides)
2. Ajout du Trade Link
3. Apparition de la boîte bleue avec Steam ID
4. Sauvegarde
5. Navigation vers `/sell`
6. Inventaire chargé automatiquement
7. Retour aux paramètres
8. Changement de Trade Link
9. Alerte de différence
10. Sauvegarde et vérification

## 📊 Métriques de succès

- ✅ 0 erreur JavaScript/TypeScript
- ✅ Temps de chargement < 2s
- ✅ UX fluide sans latence perceptible
- ✅ Messages clairs et explicites
- ✅ Respect du design system existant (shadcn/Tailwind)
