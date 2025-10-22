# Système de Conversion de Devises Multi-Devises

## Vue d'ensemble

Le système de conversion de devises permet aux utilisateurs de voir les prix des skins CS2 dans leur devise préférée (USD, EUR, CNY). Il utilise l'API Frankfurter pour obtenir les taux de change en temps réel avec un système de cache pour optimiser les performances.

## Fonctionnalités

### Devises Supportées

- **USD** 🇺🇸 - Dollar américain ($)
- **EUR** 🇪🇺 - Euro (€)
- **CNY** 🇨🇳 - Yuan chinois (¥)

### Fonctionnalités Principales

1. **Conversion en temps réel** : Taux de change mis à jour toutes les 5 minutes
2. **Cache intelligent** : Évite les appels API inutiles
3. **Fallback robuste** : Taux de secours en cas d'erreur API
4. **Persistance** : Préférence utilisateur sauvegardée dans localStorage
5. **Interface intuitive** : Sélecteur de devise dans le header

## Architecture

### Services

#### `CurrencyConverter` (`src/lib/currency-converter.ts`)
- Singleton gérant les conversions et le cache
- Utilise l'API Frankfurter (https://api.frankfurter.dev/v1)
- Méthodes principales :
  - `getExchangeRate(from, to)` : Obtient un taux de change
  - `convertCents(amount, from, to)` : Convertit un montant en centimes
  - `formatPrice(cents, currency)` : Formate un prix avec le bon symbole

#### `CurrencyProvider` (`src/components/providers/currency-provider.tsx`)
- Contexte React pour la devise sélectionnée
- Gère la persistance dans localStorage
- Fournit `selectedCurrency` et `setSelectedCurrency`

### Composants

#### `CurrencySelector` (`src/components/ui/currency-selector.tsx`)
- Dropdown pour choisir la devise
- Affiche drapeaux, codes et noms des devises
- Intégré dans le header

#### `ConvertedPrice` (`src/components/ui/converted-price.tsx`)
- Affiche un prix converti de manière asynchrone
- Gère les états de chargement et d'erreur
- Option pour afficher le prix original

## Utilisation

### Afficher un prix converti

```tsx
import { ConvertedPrice } from '@/components/ui/converted-price';

// Prix en centimes USD qui sera converti dans la devise sélectionnée
<ConvertedPrice 
  usdCents={10000} // 100.00 USD
  className="text-lg font-bold"
  showOriginal={true} // Affiche aussi le prix USD original
/>
```

### Utiliser le contexte de devise

```tsx
import { useCurrency } from '@/components/providers/currency-provider';

function MyComponent() {
  const { selectedCurrency, setSelectedCurrency, supportedCurrencies } = useCurrency();
  
  return (
    <div>
      <p>Devise actuelle : {selectedCurrency}</p>
      <button onClick={() => setSelectedCurrency('EUR')}>
        Passer en EUR
      </button>
    </div>
  );
}
```

### Conversion manuelle

```tsx
import { currencyConverter } from '@/lib/currency-converter';

// Conversion asynchrone
const convertPrice = async () => {
  const usdCents = 10000; // 100.00 USD
  const eurCents = await currencyConverter.convertCents(usdCents, 'USD', 'EUR');
  const formatted = currencyConverter.formatPrice(eurCents, 'EUR');
  console.log(formatted); // "92.00€" (exemple)
};
```

## Configuration

### Variables d'environnement

Aucune variable d'environnement requise. Le système utilise l'API publique Frankfurter.

### Taux de fallback

En cas d'erreur API, le système utilise des taux approximatifs :
- USD → EUR : 0.92
- USD → CNY : 7.25
- EUR → USD : 1.09
- EUR → CNY : 7.89
- CNY → USD : 0.14
- CNY → EUR : 0.13

## API de test

Endpoint de test disponible : `/api/test-currency`

```bash
curl http://localhost:3000/api/test-currency
```

Retourne :
- Taux de change actuels
- Conversions d'exemple
- État du cache
- Devises supportées

## Intégration dans l'application

### Pages concernées

1. **Page de vente** (`/sell`) : Prix des skins convertis
2. **Dashboard** (`/dashboard`) : Historique des trades
3. **Inventaire** : Valeurs des items
4. **Admin** : Statistiques et rapports

### Composants mis à jour

- `SkinplaceInventoryViewer` : Affichage des prix d'inventaire
- `Header` : Sélecteur de devise
- `TradeCreator` : Calculs de trade
- `AdminDashboard` : Statistiques financières

## Performance

### Cache
- Durée : 5 minutes
- Stockage : Map en mémoire
- Clé : `${fromCurrency}_${toCurrency}`

### Optimisations
- Évite les conversions inutiles (même devise)
- Batch les requêtes API quand possible
- Fallback instantané en cas d'erreur

## Maintenance

### Mise à jour des taux de fallback

Modifier les valeurs dans `src/lib/currency-converter.ts` :

```typescript
const fallbackRates: Record<string, number> = {
  'USD_EUR': 0.92, // Mettre à jour selon les taux actuels
  'USD_CNY': 7.25,
  // ...
};
```

### Ajouter une nouvelle devise

1. Ajouter dans `SupportedCurrency` type
2. Ajouter dans `SUPPORTED_CURRENCIES` avec symbole et drapeau
3. Ajouter les taux de fallback
4. Tester avec `/api/test-currency`

## Dépannage

### Erreurs communes

1. **"Taux non disponible"** : API Frankfurter indisponible, utilise le fallback
2. **"Erreur de conversion"** : Vérifier la connexion réseau
3. **Prix non mis à jour** : Vider le cache avec `currencyConverter.clearCache()`

### Debug

Activer les logs dans la console :
```typescript
// Les logs sont automatiquement affichés en développement
console.log('Taux USD->EUR:', await currencyConverter.getExchangeRate('USD', 'EUR'));
```

## Roadmap

### Améliorations futures

1. **Plus de devises** : GBP, JPY, CAD, etc.
2. **Graphiques de taux** : Évolution des taux de change
3. **Notifications** : Alertes sur variations importantes
4. **API interne** : Cache serveur pour réduire les appels externes
5. **Historique** : Stockage des taux historiques
