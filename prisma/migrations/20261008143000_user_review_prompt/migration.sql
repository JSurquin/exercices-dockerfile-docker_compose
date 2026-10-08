-- AlterTable
ALTER TABLE "user" ADD COLUMN "reviewPromptSeenAt" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN "reviewPromptAction" TEXT;
ALTER TABLE "user" ADD COLUMN "reviewPromptTrigger" TEXT;
