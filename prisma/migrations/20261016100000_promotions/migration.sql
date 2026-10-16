CREATE TYPE "PromotionKind" AS ENUM ('AUTOMATIC', 'CODE');
CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE "Promotion" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "kind" "PromotionKind" NOT NULL,
  "code" VARCHAR(32),
  "discountType" "PromotionDiscountType" NOT NULL,
  "value" INTEGER NOT NULL,
  "minimumSubtotalCents" INTEGER NOT NULL DEFAULT 0,
  "validFrom" DATE,
  "validUntil" DATE,
  "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7],
  "startTime" VARCHAR(5),
  "endTime" VARCHAR(5),
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");
CREATE INDEX "Promotion_kind_active_validFrom_validUntil_idx" ON "Promotion"("kind", "active", "validFrom", "validUntil");

ALTER TABLE "TestOrder"
  ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyaltyDiscountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyaltyPaidDishCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyaltyFreeDishCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promotionId" TEXT,
  ADD COLUMN "promotionCode" TEXT,
  ADD COLUMN "promotionName" TEXT;
UPDATE "TestOrder" SET "subtotalCents" = "totalCents";
UPDATE "TestOrder" AS t SET "loyaltyPaidDishCount" = COALESCE((
  SELECT SUM((item->>'quantity')::INTEGER)
  FROM jsonb_array_elements(t."itemsSnapshot") AS snapshot(item)
  JOIN "Product" AS p ON p."id" = item->>'productId'
  JOIN "MenuCategory" AS c ON c."id" = p."categoryId"
  WHERE c."fulfillmentCategory" IN ('PIZZA', 'PASTA')
), 0);
ALTER TABLE "TestOrder" ADD CONSTRAINT "TestOrder_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "TestOrder_userId_status_idx" ON "TestOrder"("userId", "status");

ALTER TABLE "Product" ADD COLUMN "ingredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "Ingredient" (
  "id" TEXT NOT NULL,
  "nameFr" VARCHAR(128) NOT NULL,
  "nameEn" VARCHAR(128) NOT NULL,
  "price33Cents" INTEGER NOT NULL DEFAULT 150,
  "price50Cents" INTEGER NOT NULL DEFAULT 300,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Ingredient_nameFr_key" ON "Ingredient"("nameFr");
