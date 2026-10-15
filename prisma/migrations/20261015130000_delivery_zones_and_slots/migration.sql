ALTER TABLE "TestOrder" ADD COLUMN "scheduledFor" TIMESTAMP(3);
ALTER TABLE "TestOrder" ADD COLUMN "pizzaCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "TestOrder" SET "scheduledFor" = "placedAt" WHERE "scheduledFor" IS NULL;
ALTER TABLE "TestOrder" ALTER COLUMN "scheduledFor" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TestOrder" ALTER COLUMN "scheduledFor" SET NOT NULL;
CREATE INDEX "TestOrder_scheduledFor_status_idx" ON "TestOrder"("scheduledFor", "status");

CREATE TABLE "DeliveryConfiguration" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "pickupLeadMinutes" INTEGER NOT NULL DEFAULT 30,
  "slotPizzaCapacity" INTEGER NOT NULL DEFAULT 7,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryConfiguration_pkey" PRIMARY KEY ("id")
);
INSERT INTO "DeliveryConfiguration" ("id", "updatedAt") VALUES ('global', CURRENT_TIMESTAMP);

CREATE TABLE "DeliveryZoneBoundary" (
  "zoneId" TEXT NOT NULL,
  "geometry" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryZoneBoundary_pkey" PRIMARY KEY ("zoneId")
);
