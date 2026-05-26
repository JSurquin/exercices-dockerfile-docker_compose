# Base RAG MoonSkin (PostgreSQL + pgvector)

Base **séparée** de la base Prisma principale, réservée au futur chatbot RAG.

## Démarrage

```bash
pnpm run docker:rag:up
```

Port local : **5433** (pour ne pas entrer en conflit avec Postgres principal sur 5432).

Variable d'environnement : `RAG_DATABASE_URL` (voir `env.example`).

## Arrêt

```bash
pnpm run docker:rag:down
```
