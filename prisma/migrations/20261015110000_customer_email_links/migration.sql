ALTER TABLE "CustomerCredential" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
CREATE TYPE "CustomerEmailPurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');
CREATE TABLE "CustomerEmailToken" (
  "tokenHash" CHAR(64) NOT NULL,
  "userId" TEXT NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "purpose" "CustomerEmailPurpose" NOT NULL,
  "credentialVersion" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerEmailToken_pkey" PRIMARY KEY ("tokenHash"),
  CONSTRAINT "CustomerEmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CustomerEmailToken_userId_purpose_idx" ON "CustomerEmailToken"("userId", "purpose");
CREATE INDEX "CustomerEmailToken_expiresAt_idx" ON "CustomerEmailToken"("expiresAt");
