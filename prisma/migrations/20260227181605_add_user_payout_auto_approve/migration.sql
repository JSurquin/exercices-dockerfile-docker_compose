-- CreateTable
CREATE TABLE "public"."payout_auto_approve_user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "thresholdCents" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_auto_approve_user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payout_auto_approve_user_settings_userId_key" ON "public"."payout_auto_approve_user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."payout_auto_approve_user_settings" ADD CONSTRAINT "payout_auto_approve_user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
