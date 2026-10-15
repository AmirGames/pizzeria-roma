CREATE TABLE "CustomerCredential" (
  "userId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  CONSTRAINT "CustomerCredential_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "CustomerCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "AuthThrottle" (
  "key" CHAR(64) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("key")
);
CREATE TABLE "TestOrder" (
  "id" TEXT NOT NULL,
  "publicReference" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestKey" VARCHAR(64) NOT NULL,
  "requestHash" CHAR(64) NOT NULL,
  "fulfillment" "FulfillmentType" NOT NULL,
  "zoneId" TEXT,
  "contactName" VARCHAR(128) NOT NULL,
  "phone" VARCHAR(40) NOT NULL,
  "address" VARCHAR(300),
  "comment" VARCHAR(500),
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "revision" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "itemsSnapshot" JSONB NOT NULL,
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TestOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TestOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TestOrder_publicReference_key" ON "TestOrder"("publicReference");
CREATE UNIQUE INDEX "TestOrder_userId_requestKey_key" ON "TestOrder"("userId", "requestKey");
CREATE INDEX "TestOrder_userId_placedAt_idx" ON "TestOrder"("userId", "placedAt");
CREATE INDEX "TestOrder_status_placedAt_idx" ON "TestOrder"("status", "placedAt");
