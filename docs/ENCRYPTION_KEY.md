# Clé de chiffrement (IBAN / données sensibles)

Les IBAN et BIC SEPA sont chiffrés au repos en base avec **AES-256-GCM**. Une clé dédiée est requise.

## Variable d'environnement

Ajoute dans `.env` ou `.env.local` :

```bash
# Clé 32 bytes, en hex (64 caractères) ou base64 (44 caractères)
ENCRYPTION_KEY=<votre_clé_64_caractères_hex>
```

## Générer une clé

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exemple de sortie : `a1b2c3d4e5f6...` (64 caractères). Copie cette valeur dans `ENCRYPTION_KEY`.

## Important

- **Ne pas commiter** la clé (reste dans `.env` / `.env.local`).
- En **production**, utilise une clé générée une seule fois et stockée de façon sécurisée (secrets manager).
- Sans `ENCRYPTION_KEY` valide, la création de payout SEPA échouera avec une erreur explicite.
