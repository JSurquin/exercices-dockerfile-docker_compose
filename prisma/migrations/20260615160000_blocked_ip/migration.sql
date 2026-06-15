-- CreateTable
CREATE TABLE "blocked_ip" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_ip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocked_ip_ipAddress_key" ON "blocked_ip"("ipAddress");

-- CreateIndex
CREATE INDEX "blocked_ip_ipAddress_idx" ON "blocked_ip"("ipAddress");

-- CreateIndex
CREATE INDEX "blocked_ip_expiresAt_idx" ON "blocked_ip"("expiresAt");
