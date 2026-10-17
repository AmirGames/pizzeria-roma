CREATE TYPE "StoreCreditEntryKind" AS ENUM ('MANAGER_GRANT', 'ORDER_REDEMPTION', 'ORDER_REFUND');
CREATE TYPE "StoreCreditReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED');
ALTER TYPE "OrderPaymentStatus" ADD VALUE 'CREDITED';

ALTER TABLE "Order" ADD COLUMN "creditAppliedCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD CONSTRAINT "Order_creditAppliedCents_check" CHECK ("creditAppliedCents" >= 0 AND "creditAppliedCents" <= "totalCents");

CREATE TABLE "StoreCreditEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "kind" "StoreCreditEntryKind" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "note" VARCHAR(240),
  "consentConfirmedAt" TIMESTAMP(3),
  "consentConfirmedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreCreditEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreCreditEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoreCreditEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StoreCreditEntry_orderId_kind_key" ON "StoreCreditEntry"("orderId", "kind");
CREATE INDEX "StoreCreditEntry_userId_createdAt_idx" ON "StoreCreditEntry"("userId", "createdAt");
ALTER TABLE "StoreCreditEntry" ADD CONSTRAINT "StoreCreditEntry_amountCents_check" CHECK ("amountCents" <> 0);

CREATE TABLE "StoreCreditReservation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "status" "StoreCreditReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreCreditReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoreCreditReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoreCreditReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StoreCreditReservation_orderId_key" ON "StoreCreditReservation"("orderId");
CREATE INDEX "StoreCreditReservation_userId_status_idx" ON "StoreCreditReservation"("userId", "status");
ALTER TABLE "StoreCreditReservation" ADD CONSTRAINT "StoreCreditReservation_amountCents_check" CHECK ("amountCents" > 0);
