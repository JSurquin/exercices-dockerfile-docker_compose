-- AlterEnum
ALTER TYPE "public"."ConversationStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "public"."conversation"
ADD COLUMN "summary" TEXT,
ADD COLUMN "lastMessageAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."chat_message"
ADD COLUMN "metadata" JSONB;

-- Backfill lastMessageAt from latest message per conversation
UPDATE "public"."conversation" c
SET "lastMessageAt" = sub."maxCreated"
FROM (
  SELECT "conversationId", MAX("createdAt") AS "maxCreated"
  FROM "public"."chat_message"
  GROUP BY "conversationId"
) sub
WHERE c."id" = sub."conversationId";

-- CreateIndex
CREATE INDEX "conversation_userId_lastMessageAt_idx" ON "public"."conversation"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_lastMessageAt_idx" ON "public"."conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_message_conversationId_createdAt_idx" ON "public"."chat_message"("conversationId", "createdAt");
