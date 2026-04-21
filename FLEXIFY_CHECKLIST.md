# ✅ Checklist d'Intégration Flexify

## Configuration Initiale

- [ ] Compte Flexify créé sur https://my.flexify.finance
- [ ] Clés API récupérées depuis la section "Projects"
- [ ] Variables d'environnement configurées dans `.env.local`
  - [ ] `FLEXIFY_API_KEY`
  - [ ] `FLEXIFY_API_SECRET`
  - [ ] `FLEXIFY_MERCHANT_IDENTIFIER`
  - [ ] `FLEXIFY_H2H_URL`
  - [ ] `FLEXIFY_API_URL`
  - [ ] `FLEXIFY_CALLBACK_URL`

## Configuration Serveur

- [ ] IP du serveur whitelistée par Flexify (OBLIGATOIRE)
  - IP production: `_____________`
  - IP staging: `_____________`
  - Contact support: contact@flexify.finance

## Tests

- [ ] Configuration vérifiée: `npx tsx scripts/check-flexify-config.ts`
- [ ] Connexion testée: `npx tsx scripts/test-flexify-connection.ts`
- [ ] Tests unitaires passent: `npm test flexify`

## Webhooks

- [ ] URL de webhook configurée dans le portail Flexify
  - URL: `https://votredomaine.com/api/flexify/webhook`
- [ ] Validation de signature testée
- [ ] Réponse HTTP 200 sous 30 secondes vérifiée
- [ ] Idempotence implémentée (duplicatas gérés)

## Conformité & Sécurité

- [ ] **PCI DSS**: Conformité vérifiée (requis pour paiements carte)
  - [ ] OU utiliser HPP (Hosted Payment Page) à la place de H2H
- [ ] Secrets jamais loggués
- [ ] Données sensibles non stockées (numéros de carte)
- [ ] HTTPS activé sur tous les endpoints
- [ ] Rate limiting configuré

## Frontend

- [ ] Formulaire de payout SEPA fonctionnel
  - [ ] Validation IBAN
  - [ ] Validation BIC (optionnel)
- [ ] Formulaire de payout Carte fonctionnel
  - [ ] Validation numéro de carte (Luhn)
  - [ ] Champ CVV ajouté
  - [ ] Masquage des données sensibles
- [ ] Calcul des frais affiché
- [ ] Délais estimés affichés
- [ ] Messages d'erreur traduits (FR/EN)

## Backend

- [ ] Route `/api/flexify/payout` fonctionnelle
  - [ ] Validation KYC avant payout
  - [ ] Limites min/max respectées
  - [ ] IP du client capturée
  - [ ] Références uniques générées
- [ ] Route `/api/flexify/webhook` fonctionnelle
  - [ ] Signature validée
  - [ ] Statuts mis à jour
  - [ ] Events loggués
- [ ] Route `/api/flexify/quote` fonctionnelle

## Base de Données

- [ ] Champs Prisma mis à jour
  - [ ] `flexifyPayoutId` (ID transaction Flexify)
  - [ ] `gateFiOrderId` (notre référence)
  - [ ] `processingFeeCents`
  - [ ] `networkFeeCents`
- [ ] Indexes créés pour performance
- [ ] Migrations appliquées

## Monitoring & Logs

- [ ] Logs configurés avec préfixes `[Flexify Payout]` et `[Flexify Webhook]`
- [ ] Alertes configurées pour:
  - [ ] Webhooks échoués
  - [ ] Signatures invalides
  - [ ] Payouts bloqués > 24h
- [ ] Dashboard de monitoring des transactions
- [ ] Export des transactions pour comptabilité

## Documentation

- [ ] README mis à jour avec instructions Flexify
- [ ] Variables d'environnement documentées
- [ ] Processus de déploiement documenté
- [ ] Procédures d'escalade support documentées

## Tests End-to-End

- [ ] **Payout SEPA**
  1. [ ] Création du payout
  2. [ ] Statut `new` reçu
  3. [ ] Statut `pending` reçu via webhook
  4. [ ] Statut `success` reçu via webhook
  5. [ ] Fonds reçus sur le compte bancaire

- [ ] **Payout Carte**
  1. [ ] Création du payout
  2. [ ] Statut `new` reçu
  3. [ ] Statut `success` reçu (carte instantané)
  4. [ ] Fonds reçus sur la carte

- [ ] **Gestion d'Erreurs**
  1. [ ] IBAN invalide rejeté
  2. [ ] Montant < minimum rejeté
  3. [ ] Montant > maximum rejeté
  4. [ ] KYC non validé bloqué
  5. [ ] Fonds insuffisants géré

## Production

- [ ] Mode `production` activé
- [ ] Clés API production configurées
- [ ] IP production whitelistée
- [ ] SSL/TLS configuré
- [ ] Rate limiting activé
- [ ] Backup database configuré
- [ ] Plan de rollback défini

## Support & Maintenance

- [ ] Contact support Flexify enregistré
- [ ] Escalation path défini
- [ ] Procédure de refund documentée
- [ ] Procédure de réconciliation comptable établie
- [ ] SLA avec Flexify connu et documenté

## Optimisations Futures

- [ ] Implémenter la Balance API
- [ ] Ajouter la tokenisation pour paiements récurrents
- [ ] Optimiser le retry des webhooks
- [ ] Ajouter des métriques Prometheus/Grafana
- [ ] Implémenter un cache pour les quotes
- [ ] Ajouter support multi-devises (si disponible)

---

## Notes

**Date de dernière révision:** 12 février 2026
**Responsable:** Engineering Team
**Version:** 2.0.0

**Ressources:**
- Documentation: `./FLEXIFY_INTEGRATION.md`
- Spec API: `./.flexify.md`
- Portail: https://my.flexify.finance
- Support: contact@flexify.finance
