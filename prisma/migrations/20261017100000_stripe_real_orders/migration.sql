CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUND_REQUIRED', 'REFUNDED');

ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "requestKey" VARCHAR(64),
  ADD COLUMN "requestHash" CHAR(64),
  ADD COLUMN "contactName" VARCHAR(128),
  ADD COLUMN "phone" VARCHAR(40),
  ADD COLUMN "address" VARCHAR(300),
  ADD COLUMN "zoneId" TEXT,
  ADD COLUMN "scheduledFor" TIMESTAMP(3),
  ADD COLUMN "pizzaCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "comment" VARCHAR(500),
  ADD COLUMN "stripeSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "itemsSnapshot" JSONB,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "printedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_requestKey_key" ON "Order"("requestKey");
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
CREATE INDEX "Order_paymentStatus_status_placedAt_idx" ON "Order"("paymentStatus", "status", "placedAt");
CREATE INDEX "Order_scheduledFor_status_idx" ON "Order"("scheduledFor", "status");

CREATE TABLE "StripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "type" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);
