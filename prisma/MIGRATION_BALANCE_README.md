# Migration « add_balance_system »

**À ne plus jamais utiliser :** `npx prisma db push` (il a été utilisé une fois par erreur pour le solde admin).

## Que faire maintenant

La migration `20260216120000_add_balance_system` est **idempotente** (IF NOT EXISTS, blocs DO en SQL). Tu peux donc :

- **Sur la base où `db push` a déjà été fait** (ta dev actuelle) : lancer  
  `npx prisma migrate dev`  
  La migration va « s’appliquer » (les objets existants sont ignorés grâce aux IF NOT EXISTS). Aucune donnée n’est supprimée. Prisma enregistrera la migration comme appliquée.

- **Ou**, si tu préfères ne pas réexécuter le SQL du tout sur cette base :  
  `npx prisma migrate resolve --applied 20260216120000_add_balance_system`  
  Cela enregistre uniquement la migration comme déjà appliquée, sans exécuter le fichier SQL.

- **En prod (ou toute base où `db push` n’a pas été fait)** :  
  `npx prisma migrate deploy`  
  La migration s’appliquera normalement.

## Règle à suivre à l’avenir

- **En dev :** `npx prisma migrate dev --name <nom>` pour créer et appliquer une migration.
- **En prod :** `npx prisma migrate deploy`.
- **Ne pas utiliser** `npx prisma db push` pour des changements à versionner.
