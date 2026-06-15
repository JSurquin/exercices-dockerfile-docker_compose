-- AlterTable
ALTER TABLE "user" ADD COLUMN "lastLoginIp" TEXT;
ALTER TABLE "user" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
