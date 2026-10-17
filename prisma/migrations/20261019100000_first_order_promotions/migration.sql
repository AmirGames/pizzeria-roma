ALTER TABLE "Promotion"
  ADD COLUMN "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order"
  ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promotionId" TEXT,
  ADD COLUMN "promotionName" VARCHAR(100);

UPDATE "Order" SET "subtotalCents" = "totalCents";

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_discountCents_check" CHECK ("discountCents" >= 0 AND "discountCents" <= "subtotalCents");

CREATE INDEX "Order_promotionId_idx" ON "Order"("promotionId");
