-- CreateEnum
CREATE TYPE "ApiClientStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "api_client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY['read', 'trade', 'payout']::TEXT[],
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 100,
    "status" "ApiClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdBy" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_api_log" (
    "id" TEXT NOT NULL,
    "apiClientId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_api_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_webhook_delivery" (
    "id" TEXT NOT NULL,
    "apiClientId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "httpStatus" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_webhook_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_client_keyPrefix_keyHash_key" ON "api_client"("keyPrefix", "keyHash");

-- CreateIndex
CREATE INDEX "api_client_userId_idx" ON "api_client"("userId");

-- CreateIndex
CREATE INDEX "api_client_status_idx" ON "api_client"("status");

-- CreateIndex
CREATE INDEX "api_client_keyPrefix_idx" ON "api_client"("keyPrefix");

-- CreateIndex
CREATE INDEX "partner_api_log_apiClientId_idx" ON "partner_api_log"("apiClientId");

-- CreateIndex
CREATE INDEX "partner_api_log_createdAt_idx" ON "partner_api_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "partner_webhook_delivery_eventId_key" ON "partner_webhook_delivery"("eventId");

-- CreateIndex
CREATE INDEX "partner_webhook_delivery_apiClientId_idx" ON "partner_webhook_delivery"("apiClientId");

-- CreateIndex
CREATE INDEX "partner_webhook_delivery_status_idx" ON "partner_webhook_delivery"("status");

-- CreateIndex
CREATE INDEX "partner_webhook_delivery_createdAt_idx" ON "partner_webhook_delivery"("createdAt");

-- AddForeignKey
ALTER TABLE "api_client" ADD CONSTRAINT "api_client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_api_log" ADD CONSTRAINT "partner_api_log_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_webhook_delivery" ADD CONSTRAINT "partner_webhook_delivery_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
