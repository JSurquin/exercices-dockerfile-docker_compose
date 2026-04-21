# Service de Notifications Admins

Ce document explique comment intégrer le système de notifications automatiques pour les admins dans les différentes parties de l'application.

## 📦 Import du service

```typescript
import { NotificationService } from "~/lib/notification-service";
```

## 🔔 Événements à notifier aux admins

### 1. Nouveau Trade
**Où :** `src/app/api/steam/create-trade/route.ts` ou `src/app/api/skinplace/create-trade/route.ts`

**Après la création du trade :**
```typescript
// Après avoir créé le trade en DB
await NotificationService.notifyNewTrade(
  trade.id,
  user.id,
  user.steamUsername || user.name || "Utilisateur",
  trade.totalCents // Montant en centimes
);
```

### 2. Nouvelle demande de Payout
**Où :** `src/app/api/payout/create/route.ts` ou équivalent

**Après la création du payout :**
```typescript
await NotificationService.notifyNewPayout(
  payout.id,
  user.id,
  user.steamUsername || user.name || "Utilisateur",
  payout.amountCents,
  payout.method // "SEPA", "CRYPTO", etc.
);
```

### 3. Nouvelle vérification KYC
**Où :** `src/app/api/kyc/submit/route.ts` ou équivalent

**Après la soumission KYC :**
```typescript
await NotificationService.notifyNewKYC(
  user.id,
  user.steamUsername || user.name || "Utilisateur",
  "IDENTITY_VERIFICATION" // ou type de KYC
);
```

### 4. Nouvel utilisateur
**Où :** `src/lib/auth.ts` ou callback d'inscription

**Après l'inscription :**
```typescript
await NotificationService.notifyNewUser(
  user.id,
  user.steamUsername || user.name || "Nouvel utilisateur",
  user.email
);
```

### 5. Nouvelle demande d'affiliation
**Où :** `src/app/api/affiliate/apply/route.ts`

**Après la soumission de la demande :**
```typescript
await NotificationService.notifyNewAffiliateApplication(
  application.id,
  user.id,
  user.steamUsername || user.name || "Utilisateur"
);
```

### 6. Paiement échoué
**Où :** Dans le webhook de paiement ou lors du traitement des payouts

**En cas d'échec :**
```typescript
await NotificationService.notifyPayoutFailed(
  payout.id,
  user.id,
  user.steamUsername || user.name || "Utilisateur",
  payout.amountCents,
  "Raison de l'échec" // Message d'erreur
);
```

### 7. Activité suspecte
**Où :** Dans les middlewares de sécurité ou détection de fraude

```typescript
await NotificationService.notifySuspiciousActivity(
  user.id,
  user.steamUsername || user.name || "Utilisateur",
  "MULTIPLE_PAYOUTS", // Type d'activité
  "5 demandes de payout en 1 heure" // Détails
);
```

### 8. Giveaway terminé
**Où :** Dans le cron job ou l'API qui termine les giveaways

```typescript
await NotificationService.notifyGiveawayEnded(
  giveaway.id,
  giveaway.name,
  winners.length // Nombre de gagnants
);
```

## 👤 Notifications pour les utilisateurs

### Trade mis à jour
**Où :** Lors des changements de statut du trade

```typescript
await NotificationService.notifyUserTradeUpdate(
  user.id,
  trade.id,
  "PAID", // Nouveau statut
  "Votre paiement a été effectué avec succès !" // Message personnalisé
);
```

### Payout mis à jour
**Où :** Lors des changements de statut du payout

```typescript
await NotificationService.notifyUserPayoutUpdate(
  user.id,
  payout.id,
  "PAID", // Nouveau statut
  "Votre retrait de 150€ a été traité avec succès !" // Message personnalisé
);
```

## ⚙️ Configuration des priorités

- **URGENT** : Alertes de sécurité, échecs de paiement
- **HIGH** : Gros montants (trade > 1000€, payout > 500€), KYC
- **NORMAL** : Nouveaux trades normaux, demandes d'affiliation
- **LOW** : Nouveaux utilisateurs, giveaways terminés

## 📝 Exemples d'intégration complète

### Exemple 1 : Création de trade avec notification

```typescript
// src/app/api/steam/create-trade/route.ts
import { NotificationService } from "~/lib/notification-service";

export async function POST(request: Request) {
  // ... votre logique existante ...
  
  const trade = await prisma.trade.create({
    data: {
      userId: session.user.id,
      totalCents: estimatedPrice,
      status: "CREATED",
      // ... autres champs
    },
  });

  // Notifier les admins du nouveau trade
  await NotificationService.notifyNewTrade(
    trade.id,
    session.user.id,
    user.steamUsername || user.name || "Utilisateur",
    trade.totalCents
  );

  return NextResponse.json({ success: true, trade });
}
```

### Exemple 2 : Webhook de paiement avec notifications

```typescript
// src/app/api/webhooks/payout-status/route.ts
import { NotificationService } from "~/lib/notification-service";

export async function POST(request: Request) {
  // ... vérification du webhook ...
  
  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: newStatus },
    include: { user: true },
  });

  if (newStatus === "PAID") {
    // Notifier l'utilisateur
    await NotificationService.notifyUserPayoutUpdate(
      payout.userId,
      payout.id,
      "PAID",
      `Votre retrait de ${(payout.amountCents / 100).toFixed(2)}€ a été effectué avec succès !`
    );
  } else if (newStatus === "FAILED") {
    // Notifier les admins de l'échec
    await NotificationService.notifyPayoutFailed(
      payout.id,
      payout.userId,
      payout.user.steamUsername || payout.user.name || "Utilisateur",
      payout.amountCents,
      "Échec du transfert bancaire"
    );
  }

  return NextResponse.json({ success: true });
}
```

## 🔍 Détection automatique d'activités suspectes

Vous pouvez ajouter des vérifications dans vos APIs :

```typescript
// Exemple dans l'API de payout
const recentPayouts = await prisma.payout.count({
  where: {
    userId: session.user.id,
    createdAt: {
      gte: new Date(Date.now() - 60 * 60 * 1000), // Dernière heure
    },
  },
});

if (recentPayouts >= 3) {
  await NotificationService.notifySuspiciousActivity(
    session.user.id,
    user.steamUsername || user.name || "Utilisateur",
    "MULTIPLE_PAYOUTS",
    `${recentPayouts} demandes de payout en 1 heure`
  );
}
```

## 🎯 Bonnes pratiques

1. **Ne pas bloquer les requêtes** : Les notifications sont en try/catch et n'affectent pas le flux principal
2. **Utiliser les métadonnées** : Stockez des infos utiles dans `metadata` pour le debug
3. **Messages clairs** : Écrivez des messages explicites pour les admins
4. **Liens directs** : Ajoutez toujours un `link` vers la page concernée
5. **Priorités appropriées** : Utilisez URGENT uniquement pour les vraies urgences

## 📊 Monitoring

Les admins reçoivent les notifications :
- Dans le header (badge avec compteur)
- Dans le dropdown de notifications
- Sur la page `/notifications`
- Rafraîchissement automatique toutes les 30 secondes

## 🚀 Déploiement

Ce système est déjà prêt et tagué avec `notification-system-v1.0.0`.

Pour revert en cas de problème :
```bash
git revert 0526777
```
