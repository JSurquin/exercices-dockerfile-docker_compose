# Plan d'Améliorations - Giveaways & Affiliations

## 🔴 PROBLÈMES CRITIQUES À CORRIGER

### 1. Erreurs de Compilation
**Priorité: HAUTE**

#### A. Webhook Skinplace (`src/app/api/skinplace/webhook/route.ts`)
- ❌ Ligne 165: `TradeHooks.onTradeAccepted()` n'existe pas
- ❌ Ligne 167: `TradeHooks.onTradeAvailable()` reçoit 2 arguments au lieu de 1
- ❌ Ligne 169: `TradeHooks.onTradeFailed()` n'existe pas

**Solution:**
```typescript
// Au lieu de :
if (newStatus === 'ACCEPTED_BY_BOT') {
  await TradeHooks.onTradeAccepted(trade.userId, trade.id);
}

// Utiliser :
if (newStatus === 'ACCEPTED_BY_BOT') {
  await TradeHooks.onTradeCreated(trade.userId, trade.id);
}

// Et supprimer l'appel à onTradeFailed ou créer la méthode
```

#### B. Trade Status Route (`src/app/api/skinplace/trade/status/[tradeId]/route.ts`)
- ❌ Ligne 161: `skinplaceData` peut être null

**Solution:**
```typescript
// Ajouter une vérification null
if (skinplaceData) {
  skinplaceStatus = skinplaceData.status || skinplaceData.steamtrade?.status || null;
}
```

#### C. I18n Admin Types (`src/lib/i18n.ts`)
- ❌ Propriétés manquantes: `exports`, `exports2`, `sidebar` dans l'objet admin

**Solution:**
Ajouter ces propriétés dans les objets admin (FR/EN/CN) dans i18n.ts

---

## 🟡 FONCTIONNALITÉS À AJOUTER

### 2. Badge de Demandes en Attente (Sidebar Admin)
**Priorité: MOYENNE**

**Actuellement:**
- Le badge existe dans le composant `AffiliateApplications`
- Mais pas dans la sidebar principale

**À faire:**
1. Créer un hook `useAffiliateApplications()` pour récupérer le count
2. Afficher le badge dans `admin-sidebar.tsx` à côté de "Demandes"
3. Auto-refresh toutes les 30 secondes

**Fichiers:**
- `src/components/admin/admin-sidebar.tsx`
- `src/hooks/use-affiliate-applications.ts` (nouveau)

---

### 3. Notifications Email pour Affiliations
**Priorité: MOYENNE**

**À implémenter:**
1. **Email à l'admin** quand nouvelle demande soumise
2. **Email au user** quand demande approuvée
3. **Email au user** quand demande rejetée (avec raison)

**Fichiers:**
- `src/lib/email.ts` : Ajouter templates
- `src/app/api/affiliate/apply/route.ts` : Envoyer email admin
- `src/app/api/admin/affiliate-applications/route.ts` : Envoyer email user

**Templates nécessaires:**
```typescript
// Template 1: Nouvelle demande (admin)
emailTemplates.newAffiliateApplication(application)

// Template 2: Demande approuvée (user)
emailTemplates.affiliateApplicationApproved(user, affiliateCode)

// Template 3: Demande rejetée (user)  
emailTemplates.affiliateApplicationRejected(user, reason)
```

---

### 4. Notifications pour Giveaways
**Priorité: BASSE**

**À implémenter:**
1. **Notification in-app** quand user gagne un giveaway
2. **Email** au gagnant avec détails
3. **Toast notification** lors du tirage pour tous les participants

**Fichiers:**
- `src/lib/email.ts` : Template gagnant
- `src/app/api/giveaways/auto-draw/route.ts` : Envoyer notifications
- `src/components/giveaway/giveaway-notifications.tsx` : Déjà existe, améliorer

---

### 5. CRON Job pour Tirages Automatiques
**Priorité: HAUTE**

**Actuellement:**
- Route `/api/giveaways/auto-draw` existe
- Mais pas de CRON automatique

**À faire:**
1. **Option 1 - Vercel Cron Jobs:**
   - Ajouter dans `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/giveaway-draw",
       "schedule": "*/15 * * * *"  // Toutes les 15 minutes
     }]
   }
   ```
   - Créer route protégée avec CRON_SECRET

2. **Option 2 - Client-side check:**
   - Ajouter useEffect dans admin dashboard
   - Check toutes les 5 minutes
   - Déclencher auto-draw si giveaways expirés

**Fichiers:**
- `vercel.json` (nouveau ou modifier)
- `src/app/api/cron/giveaway-draw/route.ts` (nouveau)

---

### 6. Dashboard Admin - Statistiques Affiliations
**Priorité: BASSE**

**À ajouter:**
- Widget "Demandes en attente" sur le dashboard principal
- Graphique des nouvelles demandes par mois
- Taux d'approbation/rejet

**Fichiers:**
- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/affiliate-stats-widget.tsx` (nouveau)

---

### 7. Page Historique des Giveaways
**Priorité: BASSE**

**À créer:**
- Page `/giveaways/history` pour voir tous les giveaways terminés
- Filtres par statut (won/lost pour l'utilisateur)
- Statistiques personnelles (taux de victoire, tickets dépensés, etc.)

**Fichiers:**
- `src/app/giveaways/history/page.tsx` (nouveau)

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 URGENT (À faire maintenant)
1. ✅ Corriger erreurs compilation webhook
2. ✅ Corriger erreurs compilation trade status
3. ✅ Corriger erreurs i18n admin types
4. ⚠️ Ajouter CRON job pour tirages automatiques

### 🟡 IMPORTANT (Cette semaine)
5. Badge demandes en attente dans sidebar
6. Notifications email affiliations
7. Hook pour auto-refresh des demandes

### 🟢 NICE TO HAVE (Plus tard)
8. Notifications giveaways gagnants
9. Dashboard stats affiliations
10. Page historique giveaways

---

## ⚙️ CONFIGURATION REQUISE

### Variables d'environnement à ajouter:
```env
# Pour CRON jobs sécurisés
CRON_SECRET=your_secret_key_here

# Pour emails (si pas déjà présent)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
ADMIN_EMAIL=admin@cashtrade.com
```

### Dépendances NPM (si nécessaire):
- `nodemailer` : Déjà installé ?
- `@vercel/cron` : Pour les cron jobs Vercel

---

## 🎯 PROCHAINES ÉTAPES

1. **Phase 1** : Corriger toutes les erreurs de compilation (30 min)
2. **Phase 2** : Implémenter CRON job + badge sidebar (1h)
3. **Phase 3** : Notifications email affiliations (1h30)
4. **Phase 4** : Tests complets (30 min)

**Temps total estimé: 3-4 heures**

