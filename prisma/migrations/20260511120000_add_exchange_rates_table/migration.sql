-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'frankfurter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_fromCurrency_toCurrency_date_key" ON "exchange_rates"("fromCurrency", "toCurrency", "date");

-- CreateIndex
CREATE INDEX "exchange_rates_fromCurrency_toCurrency_createdAt_idx" ON "exchange_rates"("fromCurrency", "toCurrency", "createdAt");
