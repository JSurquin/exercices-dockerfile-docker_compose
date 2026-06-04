# Déploiement Dokploy — éviter les 502 au redémarrage

## Cause

Au déploiement, le conteneur démarre avec :

```sh
npx prisma migrate deploy && next start
```

Pendant les migrations (parfois 30–120 s) et le boot de Next, **aucun processus n’écoute sur le port 3000**. Si Traefik / le tunnel Cloudflare envoie du trafic trop tôt → **502 Bad Gateway**.

`nixpacks.toml` ne configure pas les healthchecks Docker (c’est le rôle de **Dokploy Swarm Settings**).

## 1. Endpoint `/health`

L’app expose `GET /health` → `{ "ok": true }` (sans accès DB).

Vérifier dans le conteneur :

```sh
curl -f http://localhost:3000/health
```

## 2. Dokploy — Swarm Health Check (obligatoire)

**Application → Advanced → Cluster Settings → Swarm Settings → Health Check**

Adapter le port si besoin. **Augmenter `StartPeriod`** pour les builds lents (migrations + Next) :

```json
{
  "Test": ["CMD", "curl", "-f", "http://localhost:3000/health"],
  "Interval": 10000000000,
  "Timeout": 5000000000,
  "StartPeriod": 180000000000,
  "Retries": 5
}
```

Valeurs en **nanosecondes** :

| Champ | Valeur | Durée |
|--------|--------|--------|
| `StartPeriod` | `180000000000` | 180 s grace avant échec |
| `Interval` | `10000000000` | 10 s entre checks |
| `Timeout` | `5000000000` | 5 s par requête |
| `Retries` | `5` | |

Si les migrations sont très longues, monter `StartPeriod` à `300000000000` (5 min).

`curl` est installé via `aptPkgs` dans `nixpacks.toml`.

## 3. Zero-downtime (recommandé)

Même écran → **Update Config** :

```json
{
  "Parallelism": 1,
  "Delay": 10000000000,
  "FailureAction": "rollback",
  "Order": "start-first"
}
```

`start-first` : le nouveau conteneur doit passer healthy **avant** d’arrêter l’ancien.

## 4. Health route dans l’UI Dokploy

Renseigner aussi **Health Check Path** = `/health` si le champ existe dans l’onglet Application.

## 5. Option — migrations hors démarrage

Pour réduire le temps sans HTTP :

- **Deploy hook / Run command** (une fois par deploy) : `npx prisma migrate deploy`
- **Start command** : `pnpm exec next start -H 0.0.0.0 -p 3000`

Ne pas lancer les migrations deux fois.

## Logs

Le script `scripts/docker-start.sh` préfixe les logs `[moonskin-start]` pour suivre migrations vs boot Next dans Dokploy → Logs.
