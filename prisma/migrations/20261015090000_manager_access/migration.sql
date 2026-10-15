CREATE TABLE "ManagerAccessToken" (
  "tokenHash" CHAR(64) NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagerAccessToken_pkey" PRIMARY KEY ("tokenHash"),
  CONSTRAINT "ManagerAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ManagerAccessToken_expiresAt_idx" ON "ManagerAccessToken"("expiresAt");
