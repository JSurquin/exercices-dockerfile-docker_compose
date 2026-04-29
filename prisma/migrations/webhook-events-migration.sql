-- Migration Prisma requise pour le système d'idempotence webhook
-- À exécuter avec: npx prisma migrate dev --name add-webhook-events

-- Créer la table webhook_events
CREATE TABLE "webhook_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "webhookId" TEXT NOT NULL,
  "handler" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Index unique sur webhookId + handler pour idempotence
CREATE UNIQUE INDEX "webhook_events_webhookId_handler_key" ON "webhook_events"("webhookId", "handler");

-- Index sur receivedAt pour le cleanup périodique
CREATE INDEX "webhook_events_receivedAt_idx" ON "webhook_events"("receivedAt");

-- Index sur status pour les requêtes de monitoring
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- Commentaire
COMMENT ON TABLE "webhook_events" IS 'Événements webhook reçus pour idempotence et audit';
COMMENT ON COLUMN "webhook_events"."webhookId" IS 'ID unique du webhook (ex: transaction ID externe)';
COMMENT ON COLUMN "webhook_events"."handler" IS 'Type de handler (flexify_payout, skinplace_ipn, etc.)';
COMMENT ON COLUMN "webhook_events"."status" IS 'Statut: processing (en cours), completed (terminé), failed (échec)';
COMMENT ON COLUMN "webhook_events"."metadata" IS 'Données supplémentaires du webhook (payload, résultat)';
