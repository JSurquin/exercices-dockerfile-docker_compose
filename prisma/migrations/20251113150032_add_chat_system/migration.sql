-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ConversationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."SenderType" AS ENUM ('USER', 'BOT', 'MODERATOR', 'SYSTEM');

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'MODERATOR';

-- CreateTable
CREATE TABLE "public"."conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject" TEXT,
    "category" TEXT,
    "priority" "public"."ConversationPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "senderType" "public"."SenderType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_userId_idx" ON "public"."conversation"("userId");

-- CreateIndex
CREATE INDEX "conversation_status_idx" ON "public"."conversation"("status");

-- CreateIndex
CREATE INDEX "conversation_assignedTo_idx" ON "public"."conversation"("assignedTo");

-- CreateIndex
CREATE INDEX "conversation_createdAt_idx" ON "public"."conversation"("createdAt");

-- CreateIndex
CREATE INDEX "chat_message_conversationId_idx" ON "public"."chat_message"("conversationId");

-- CreateIndex
CREATE INDEX "chat_message_userId_idx" ON "public"."chat_message"("userId");

-- CreateIndex
CREATE INDEX "chat_message_createdAt_idx" ON "public"."chat_message"("createdAt");

-- CreateIndex
CREATE INDEX "chat_message_senderType_idx" ON "public"."chat_message"("senderType");

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_message" ADD CONSTRAINT "chat_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_message" ADD CONSTRAINT "chat_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
