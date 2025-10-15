/*
  Warnings:

  - A unique constraint covering the columns `[tradeLink]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "tradeLink" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_tradeLink_key" ON "user"("tradeLink");
