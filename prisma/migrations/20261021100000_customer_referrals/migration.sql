ALTER TABLE "User" ADD COLUMN "referralCode" VARCHAR(32);
UPDATE "User" SET "referralCode" = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'REWARDED');
ALTER TYPE "StoreCreditEntryKind" ADD VALUE 'REFERRAL_REWARD';

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardedAt" TIMESTAMP(3),
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");
CREATE UNIQUE INDEX "Referral_rewardedOrderId_key" ON "Referral"("rewardedOrderId");
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
