# Intégration de l'Audit Logging - Guide Complet

## État actuel

✅ **Routes déjà mises à jour avec audit logging :**
- `src/app/api/auth/steam/login/route.ts` - Connexion Steam
- `src/app/api/auth/steam/callback/route.ts` - Callback Steam avec sécurité complète
- `src/app/api/user/update/route.ts` - Mise à jour profil utilisateur
- `src/app/api/user/payment-method/route.ts` - Gestion méthodes de paiement
- `src/app/api/skinplace/create-trade/route.ts` - Création de trades
- `src/app/api/admin/users/route.ts` - Administration utilisateurs
- `src/app/api/admin/security/metrics/route.ts` - Métriques de sécurité
- `src/app/api/giveaways/route.ts` - Gestion des giveaways
- `src/app/api/cron/security-maintenance/route.ts` - Maintenance sécurité

## Helpers créés

### `src/lib/security/audit-helpers.ts`
Contient des fonctions utilitaires pour simplifier l'intégration :

- `getRequestContext()` - Extrait le contexte de la requête
- `logUnauthorizedAccess()` - Log des accès non autorisés
- `logAdminAccess()` - Log des actions admin
- `logSystemError()` - Log des erreurs système
- `logUserAction()` - Log des actions utilisateur
- `logSuspiciousActivity()` - Log d'activités suspectes
- `logValidationFailure()` - Log d'échecs de validation
- `logSensitiveDataChange()` - Log de changements de données sensibles
- `withAuditLogging()` - Wrapper pour routes avec logging automatique

## Routes prioritaires à mettre à jour

### 🔴 **Critiques (Sécurité)**
1. `src/app/api/admin/kyc/route.ts` - Gestion KYC
2. `src/app/api/admin/payouts/route.ts` - Gestion des paiements
3. `src/app/api/stripe/webhook/route.ts` - Webhooks Stripe
4. `src/app/api/stripe/create-payment-intent/route.ts` - Création paiements

### 🟡 **Importantes (Business)**
5. `src/app/api/user/trades/route.ts` - Trades utilisateur
6. `src/app/api/affiliate/apply/route.ts` - Demandes d'affiliation
7. `src/app/api/affiliate/commissions/route.ts` - Commissions
8. `src/app/api/giveaways/[id]/participate/route.ts` - Participation giveaways
9. `src/app/api/giveaways/[id]/draw/route.ts` - Tirages giveaways

### 🟢 **Standard (Monitoring)**
10. `src/app/api/skinplace/inventory/route.ts` - Inventaires
11. `src/app/api/steam/inventory/route.ts` - Inventaires Steam
12. `src/app/api/newsletter/subscribe/route.ts` - Newsletter
13. `src/app/api/user/profile/route.ts` - Profils utilisateur

## Pattern d'intégration standard

### 1. Import des helpers
```typescript
import { 
  getRequestContext, 
  logUserAction, 
  logSystemError,
  logUnauthorizedAccess,
  logValidationFailure
} from '@/lib/security/audit-helpers';
import { AuditAction } from '@/lib/security';
import { logger } from '@/lib/logger';
```

### 2. Initialisation du contexte
```typescript
export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  // ... reste de la fonction
}
```

### 3. Log d'accès non autorisé
```typescript
if (!session?.user) {
  await logUnauthorizedAccess(context, '/api/endpoint', 'No valid session');
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 4. Log d'actions utilisateur
```typescript
await logUserAction(
  context,
  AuditAction.TRADE_CREATED,
  {
    type: 'action_description',
    data: relevantData,
  },
  'medium' // severity
);
```

### 5. Log d'erreurs
```typescript
} catch (error) {
  logger.error('Operation failed', { error, ipAddress: context.ipAddress });
  await logSystemError(context, error, 'operation_name');
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
}
```

## Actions d'audit disponibles

### Authentification
- `USER_LOGIN` - Connexion utilisateur
- `USER_LOGOUT` - Déconnexion
- `USER_LOGIN_FAILED` - Échec de connexion

### KYC
- `KYC_DOCUMENT_UPLOADED` - Document KYC uploadé
- `KYC_STATUS_CHANGED` - Changement statut KYC
- `KYC_DOCUMENT_REJECTED` - Document rejeté

### Paiements
- `PAYMENT_METHOD_ADDED` - Méthode de paiement ajoutée
- `PAYMENT_METHOD_UPDATED` - Méthode mise à jour
- `IBAN_CHANGED` - Changement d'IBAN
- `PAYOUT_REQUESTED` - Demande de paiement
- `PAYOUT_PROCESSED` - Paiement traité
- `PAYOUT_FAILED` - Paiement échoué

### Trades
- `TRADE_CREATED` - Trade créé
- `TRADE_ACCEPTED` - Trade accepté
- `TRADE_COMPLETED` - Trade terminé

### Sécurité
- `SUSPICIOUS_ACTIVITY` - Activité suspecte
- `RATE_LIMIT_EXCEEDED` - Rate limit dépassé
- `ACCOUNT_LOCKED` - Compte verrouillé

### Administration
- `ADMIN_LOGIN` - Connexion admin
- `ADMIN_ACTION` - Action admin
- `USER_IMPERSONATION` - Usurpation d'identité

## Niveaux de sévérité

- **`low`** - Actions normales, informatives
- **`medium`** - Actions importantes nécessitant surveillance
- **`high`** - Actions sensibles nécessitant attention
- **`critical`** - Menaces immédiates, alertes automatiques

## Exemples d'intégration par type de route

### Route d'authentification
```typescript
// Log de tentative de connexion
await logUserAction(context, AuditAction.USER_LOGIN, {
  type: 'login_attempt',
  method: 'steam',
}, 'low');

// Log d'échec
await logUserAction(context, AuditAction.USER_LOGIN_FAILED, {
  type: 'login_failed',
  reason: 'invalid_credentials',
}, 'medium');
```

### Route admin
```typescript
// Vérification des permissions
if (user.role !== 'ADMIN') {
  await logUnauthorizedAccess(context, '/api/admin/endpoint', 'Insufficient permissions');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Log d'action admin
await logAdminAccess(context, 'users_list_accessed', undefined, {
  filters: searchParams,
  resultCount: users.length,
});
```

### Route de paiement
```typescript
// Log de demande de paiement
await logUserAction(context, AuditAction.PAYOUT_REQUESTED, {
  type: 'payout_requested',
  amount: amountCents,
  method: paymentMethod,
}, 'high');

// Log de changement d'IBAN
if (oldIban !== newIban) {
  await logSensitiveDataChange(
    context,
    'iban',
    oldIban,
    newIban,
    AuditAction.IBAN_CHANGED
  );
}
```

### Route de validation
```typescript
// Log d'échec de validation
if (!isValidFormat(tradeUrl)) {
  await logValidationFailure(
    context,
    'tradeUrl',
    tradeUrl,
    'Invalid Steam trade URL format'
  );
  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
```

## Checklist d'intégration

Pour chaque route à mettre à jour :

- [ ] Importer les helpers nécessaires
- [ ] Initialiser le contexte de requête
- [ ] Ajouter logging pour accès non autorisé
- [ ] Logger les actions principales
- [ ] Logger les validations échouées
- [ ] Logger les changements de données sensibles
- [ ] Logger les erreurs système
- [ ] Tester le logging en local
- [ ] Vérifier les logs en base de données

## Monitoring et alertes

Une fois l'intégration terminée, vous pourrez :

1. **Surveiller les activités suspectes** via `/api/admin/security/metrics`
2. **Recevoir des alertes automatiques** pour les actions critiques
3. **Analyser les patterns de fraude** avec les données collectées
4. **Générer des rapports de conformité** RGPD
5. **Tracer toutes les actions sensibles** pour audit

## Maintenance

- **Nettoyage automatique** : Les anciens logs sont supprimés automatiquement
- **Rotation des logs** : Configurée via `AuditLogger.cleanupOldLogs()`
- **Monitoring des performances** : Surveiller l'impact sur les temps de réponse
- **Alertes de volume** : Surveiller les pics d'activité

## Prochaines étapes

1. Intégrer les routes critiques en priorité
2. Tester le système en développement
3. Configurer les alertes en production
4. Former l'équipe sur l'utilisation des métriques
5. Mettre en place les processus de réponse aux incidents
