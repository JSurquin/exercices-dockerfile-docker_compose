# Intégration Trade Link → Steam ID

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de mettre à jour leur inventaire Steam automatiquement en modifiant leur Trade Link dans les paramètres. Le système extrait automatiquement le Steam ID64 du Trade Link et propose de le mettre à jour.

## Modifications apportées

### 1. Composant `TradeLinkConfig` (`src/components/settings/trade-link-config.tsx`)

#### Nouvelles fonctionnalités :
- **Extraction automatique du Steam ID** : Lorsque l'utilisateur saisit ou modifie son Trade Link, le Steam ID64 est automatiquement extrait
- **Affichage du Steam ID détecté** : Une boîte d'information bleue affiche le Steam ID extrait
- **Option de mise à jour automatique** : Une checkbox permet à l'utilisateur de choisir s'il souhaite mettre à jour automatiquement son Steam ID64 en base de données
- **Alertes intelligentes** : Si le Steam ID extrait diffère du Steam ID actuel, un avertissement est affiché

#### États ajoutés :
```typescript
const [autoUpdateSteamId, setAutoUpdateSteamId] = useState(true);
const [extractedSteamId, setExtractedSteamId] = useState<string | null>(null);
```

#### Flux de traitement :

1. **Saisie du Trade Link** → Validation du format
2. **Trade Link valide** → Extraction automatique du Steam ID (via `parseSteamId64FromUserInput`)
3. **Affichage de la détection** → L'utilisateur voit le Steam ID détecté et peut choisir la mise à jour automatique
4. **Sauvegarde** → Si la checkbox est cochée, le Steam ID est aussi mis à jour en base de données

### 2. Fonction utilisée

La fonction `parseSteamId64FromUserInput` (déjà existante dans `src/lib/steam-id.ts`) gère l'extraction :

```typescript
// Exemple de Trade Link
"https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh"

// Steam ID64 extrait
"76561198083722517" // = 76561197960265728 + 123456789
```

## Comportement

### Cas d'usage 1 : Premier ajout du Trade Link
1. L'utilisateur n'a pas de Trade Link configuré
2. Il saisit son Trade Link dans `/settings`
3. Le système détecte automatiquement le Steam ID64
4. L'utilisateur voit une boîte bleue avec le Steam ID détecté
5. La checkbox "Mettre à jour automatiquement mon Steam ID" est cochée par défaut
6. À la sauvegarde, les deux valeurs (Trade Link + Steam ID64) sont enregistrées

### Cas d'usage 2 : Modification du Trade Link (changement de compte)
1. L'utilisateur a déjà un Trade Link configuré avec Steam ID `76561198123456789`
2. Il modifie son Trade Link dans `/settings` pour un autre compte Steam
3. Le système détecte le nouveau Steam ID `76561198987654321`
4. Une alerte jaune s'affiche : "Le Steam ID extrait est différent de votre Steam ID actuel"
5. L'utilisateur peut choisir de mettre à jour ou non son Steam ID
6. À la sauvegarde, si la checkbox est cochée, le nouveau Steam ID remplace l'ancien

### Cas d'usage 3 : Trade Link existant sans modification
1. L'utilisateur a déjà un Trade Link configuré
2. Il ouvre la page `/settings`
3. Le système charge automatiquement le Trade Link et extrait le Steam ID
4. L'utilisateur voit le Steam ID détecté correspondant à son Trade Link actuel
5. Aucune alerte n'est affichée car les deux correspondent

## Avantages

✅ **Simplicité** : L'utilisateur n'a plus besoin de saisir manuellement son Steam ID64  
✅ **Cohérence** : Le Trade Link et le Steam ID sont toujours synchronisés  
✅ **Flexibilité** : L'utilisateur peut choisir de ne pas mettre à jour automatiquement s'il le souhaite  
✅ **Multi-comptes** : Permet de basculer facilement entre plusieurs comptes Steam  
✅ **UX améliorée** : Le système est intelligent et alerte l'utilisateur en cas de différence

## Impact sur le reste de l'application

### Page `/sell`
- Lorsque l'utilisateur arrive sur la page de vente, l'inventaire est automatiquement chargé avec le Steam ID64 configuré
- Le composant `SkinplaceInventoryViewer` utilise déjà `user.steamId64` comme source
- Si l'utilisateur a mis à jour son Trade Link, son nouvel inventaire sera automatiquement affiché

### Composant `SkinplaceInventoryViewer`
- **Aucune modification nécessaire** : Le composant utilise déjà le `steamId64` fourni en props
- Il dispose déjà de la fonctionnalité `allowSteamIdChange` pour charger un autre inventaire temporairement
- La logique existante reste intacte

## Logique par défaut maintenue

✅ Le système continue de fonctionner avec `steamId64` comme clé principale  
✅ Le Trade Link reste optionnel (nécessaire uniquement pour les trades)  
✅ L'utilisateur peut toujours modifier manuellement son Steam ID dans `/settings`  
✅ Le composant `SteamIdConfig` reste fonctionnel et indépendant

## Tests recommandés

1. **Test 1** : Ajout d'un nouveau Trade Link sans Steam ID existant
2. **Test 2** : Modification du Trade Link avec un Steam ID différent
3. **Test 3** : Sauvegarde avec la checkbox décochée (pas de mise à jour du Steam ID)
4. **Test 4** : Vérification que l'inventaire se charge correctement sur `/sell` après modification
5. **Test 5** : Format invalide de Trade Link (doit afficher une erreur)

## Compatibilité

- ✅ Next.js 15
- ✅ TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ Composants React Server/Client existants
- ✅ API routes `/api/user/update` (déjà compatible avec `steamId64`)

## Notes techniques

### Fonction d'extraction
```typescript
export function parseSteamId64FromUserInput(raw: string): string | null {
  // Gère :
  // - URL complète : https://steamcommunity.com/tradeoffer/new/?partner=123&token=ABC
  // - Fragment : ?partner=123&token=ABC
  // - Steam ID64 direct : 76561198123456789
  
  // Extrait le paramètre "partner"
  // Convertit en Steam ID64 : partner + 76561197960265728
}
```

### Base de données
L'API `/api/user/update` accepte déjà le champ `steamId64` :

```typescript
await updateUser({ 
  tradeLink: "https://...",
  steamId64: "76561198123456789" 
});
```

## Conclusion

Cette intégration améliore significativement l'expérience utilisateur en automatisant la synchronisation entre le Trade Link et le Steam ID. Le système reste flexible et respecte les choix de l'utilisateur tout en maintenant la logique existante intacte.
