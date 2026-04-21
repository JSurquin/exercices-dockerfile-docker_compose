# 🔄 KYCAID: Mode Développement vs Production

## 📋 Le Problème

En mode **développement**, votre application tourne sur `localhost:3000` qui n'est **pas accessible depuis internet**. Par conséquent, **KYCAID ne peut pas envoyer de webhooks** à votre machine locale.

En mode **production**, l'application tourne sur un domaine public (ex: `https://moonskin.fun`) qui **est accessible depuis internet**, donc KYCAID peut envoyer les webhooks normalement.

---

## 🔧 La Solution Implémentée

Nous avons implémenté **deux stratégies différentes** selon l'environnement :

### 1. **Production: Webhooks** ✅

En production, KYCAID envoie automatiquement des callbacks à votre serveur quand une vérification change d'état.

**Flow:**
```
Utilisateur complète KYC sur KYCAID
         ↓
KYCAID traite la vérification
         ↓
KYCAID envoie un POST à https://moonskin.fun/api/kycaid/webhook
         ↓
Serveur met à jour la BDD
         ↓
Utilisateur voit son statut mis à jour
```

**Configuration:**
- `KYCAID_CALLBACK_URL` est automatiquement ajouté lors de la création de la vérification
- Webhook reçu sur `/api/kycaid/webhook`
- Signature validée pour la sécurité

### 2. **Développement: Polling** 🔄

En développement, l'application **interroge activement** l'API KYCAID pour vérifier l'état.

**Flow:**
```
Utilisateur complète KYC sur KYCAID
         ↓
Frontend poll toutes les 10 secondes: GET /api/kycaid/poll/{verificationId}
         ↓
Backend interroge l'API KYCAID: GET /verifications/{verificationId}
         ↓
Backend met à jour la BDD
         ↓
Utilisateur voit son statut mis à jour
```

**Configuration:**
- Pas de `callback_url` envoyé à KYCAID
- Polling automatique toutes les 10 secondes quand une vérification est en cours
- Route dédiée: `/api/kycaid/poll/[verificationId]`

---

## 📊 Comparaison

| Aspect | Production | Développement |
|--------|-----------|---------------|
| **Mécanisme** | Webhooks (push) | Polling (pull) |
| **Callback URL** | ✅ Configurée | ❌ Pas configurée |
| **Latence** | Instantanée | 10 secondes max |
| **Charge serveur** | Faible | Moyenne (polling) |
| **Sécurité** | Signature HMAC | Auth session |
| **Retry** | Auto par KYCAID (15x) | Auto par frontend |

---

## 🛠️ Implémentation Technique

### Configuration Automatique

Le fichier `src/lib/kycaid.ts` détecte automatiquement l'environnement :

```typescript
export const KYCAID_CONFIG = {
  // ...
  callbackUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.KYCAID_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/kycaid/webhook`)
    : undefined, // Pas de callback en dev
  isDevelopment: process.env.NODE_ENV === 'development',
};
```

### Fonction `createVerification()`

```typescript
const requestBody: Record<string, any> = {
  applicant_id: params.applicantId,
  form_id: params.formId || KYCAID_CONFIG.formId,
  redirect_url: params.redirectUrl || KYCAID_CONFIG.redirectUrl,
  external_applicant_id: params.externalApplicantId,
};

// En production uniquement, ajouter le callback_url
if (KYCAID_CONFIG.callbackUrl) {
  requestBody.callback_url = KYCAID_CONFIG.callbackUrl;
  console.log(`📡 [KYCAID] Callback URL configurée: ${KYCAID_CONFIG.callbackUrl}`);
} else {
  console.log(`⚠️  [KYCAID] Mode développement: Pas de callback URL (utiliser le polling)`);
}
```

### Route de Polling

**Endpoint:** `GET /api/kycaid/poll/[verificationId]`

**Authentification:** Session utilisateur (vérifie que la vérification appartient bien à l'utilisateur)

**Fonctionnement:**
1. Vérifie que le `verificationId` appartient à l'utilisateur connecté
2. Appelle l'API KYCAID: `GET /verifications/{verificationId}`
3. Met à jour la BDD avec le nouveau statut
4. Si `status === 'completed'`:
   - Met à jour le statut utilisateur (`VERIFIED` ou `REJECTED`)
   - Envoie l'email de notification
   - Arrête le polling

**Réponse:**
```json
{
  "status": "pending | completed",
  "verified": true | false,
  "message": "Message utilisateur",
  "declineReasons": ["..."] // Si rejeté
}
```

### Composant Frontend

Le composant `KycVerification.tsx` adapte son comportement :

```typescript
// Détecter le mode
const [isDevelopment, setIsDevelopment] = useState(false);
const [verificationId, setVerificationId] = useState<string | null>(null);

useEffect(() => {
  setIsDevelopment(process.env.NODE_ENV === 'development');
}, []);

// Fonction de polling adaptative
const fetchStatus = async () => {
  // En mode dev avec un verificationId, on poll directement l'API KYCAID
  if (isDevelopment && verificationId && kycStatus?.status === 'PENDING') {
    const response = await fetch(`/api/kycaid/poll/${verificationId}`);
    // ...
  } else {
    // Mode normal: vérifier le statut en BDD
    const response = await fetch('/api/kycaid/status');
    // ...
  }
};

// Polling plus fréquent en mode dev
const pollInterval = (isDevelopment && verificationId && kycStatus?.status === 'PENDING') 
  ? 10000  // 10 secondes en dev
  : 30000; // 30 secondes sinon
```

---

## 🚀 Utilisation

### En Développement (localhost)

1. L'utilisateur initie le KYC
2. Le `verificationId` est stocké dans le state du composant
3. Le frontend poll automatiquement toutes les 10 secondes
4. Quand l'utilisateur complète le formulaire KYCAID, le statut est détecté au prochain poll
5. La BDD est mise à jour et l'utilisateur voit le changement

**Logs à surveiller:**
```
⚠️  [KYCAID] Mode développement: Pas de callback URL (utiliser le polling)
[KYCAID Poll] Polling verification xxx for user yyy
[KYCAID Poll] Status from API: { status: 'pending', verified: false }
[KYCAID Poll] ✅ KYC VERIFIED for user yyy
```

### En Production (moonskin.fun)

1. L'utilisateur initie le KYC
2. Le `callback_url` est envoyé à KYCAID
3. Quand l'utilisateur complète le formulaire, KYCAID envoie un webhook
4. Le webhook est reçu et traité instantanément
5. La BDD est mise à jour et l'utilisateur voit le changement

**Logs à surveiller:**
```
📡 [KYCAID] Callback URL configurée: https://moonskin.fun/api/kycaid/webhook
[KYCAID Webhook] Received: { type: 'VERIFICATION_COMPLETED', status: 'completed', verified: true }
[KYCAID] User xxx KYC status updated to VERIFIED
```

---

## ⚠️ Points d'Attention

### Sécurité

- **Production:** Les webhooks sont signés avec HMAC-SHA256
- **Développement:** L'authentification se fait via la session utilisateur
- Ne jamais exposer le polling en production sans rate limiting

### Performance

- Le polling en dev génère plus de requêtes API KYCAID
- Utiliser le mode sandbox de KYCAID en développement
- En production, les webhooks sont instantanés et n'ont pas de surcharge

### Débogage

**En dev, pour forcer un changement d'état:**
1. Aller sur le portail KYCAID
2. Trouver la vérification
3. Changer le statut manuellement
4. Le polling détectera le changement en max 10 secondes

**En prod, pour tester les webhooks:**
1. Utiliser un outil comme [ngrok](https://ngrok.com/) pour exposer localhost
2. Ou utiliser l'environnement de staging
3. Vérifier les logs des webhooks dans le portail KYCAID

---

## 🧪 Tests

### Test en Développement

```bash
# 1. Démarrer l'app en mode dev
npm run dev

# 2. Initier un KYC
# Le verificationId sera stocké

# 3. Observer les logs de polling
# [KYCAID Poll] Polling verification xxx...

# 4. Compléter le formulaire KYCAID

# 5. Le statut sera détecté en max 10 secondes
# [KYCAID Poll] ✅ KYC VERIFIED
```

### Test en Production/Staging

```bash
# 1. Configurer KYCAID_CALLBACK_URL dans .env
KYCAID_CALLBACK_URL=https://moonskin.fun/api/kycaid/webhook

# 2. Déployer l'application

# 3. Initier un KYC

# 4. Compléter le formulaire KYCAID

# 5. Le webhook sera reçu instantanément
# [KYCAID Webhook] Received...
```

---

## 📝 Checklist de Déploiement

### Développement

- [ ] `NODE_ENV=development` configuré
- [ ] Pas de `KYCAID_CALLBACK_URL` dans `.env.local`
- [ ] Route `/api/kycaid/poll/[verificationId]` accessible
- [ ] Polling fonctionne (observer les logs)

### Production

- [ ] `NODE_ENV=production` configuré
- [ ] `KYCAID_CALLBACK_URL=https://moonskin.fun/api/kycaid/webhook` dans `.env`
- [ ] Webhook configuré dans le portail KYCAID
- [ ] Signature webhook validée
- [ ] Route `/api/kycaid/webhook` accessible depuis internet
- [ ] HTTPS activé

---

## 🔄 Migration Dev → Prod

Aucune migration de données nécessaire ! Le système détecte automatiquement l'environnement.

**À faire:**
1. Configurer les variables d'environnement de production
2. Activer le webhook dans le portail KYCAID
3. Tester un KYC complet en staging
4. Déployer en production

---

## 📞 Support

### En cas de problème

**Le polling ne fonctionne pas en dev:**
- Vérifier que `verificationId` est bien stocké (logs console)
- Vérifier les logs `[KYCAID Poll]`
- S'assurer que l'API KYCAID répond (vérifier le token)

**Le webhook ne fonctionne pas en prod:**
- Vérifier que `KYCAID_CALLBACK_URL` est configuré
- Vérifier que l'URL est accessible depuis internet (test avec curl)
- Vérifier la signature dans les logs
- Consulter les logs des webhooks dans le portail KYCAID

---

## 📚 Ressources

- Documentation KYCAID: https://docs.kycaid.com
- Endpoint Get verification: `GET /verifications/{verification_id}`
- Webhook format: Voir `KYC_EMAIL_NOTIFICATIONS.md`

---

**Date:** 12 février 2026  
**Version:** 2.0.0  
**Auteur:** Engineering Team
