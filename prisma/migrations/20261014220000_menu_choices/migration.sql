CREATE TYPE "ExtraSelectionMode" AS ENUM ('MULTIPLE', 'SINGLE');

ALTER TABLE "Product"
ADD COLUMN "choiceLabel" TEXT,
ADD COLUMN "extraSelectionMode" "ExtraSelectionMode" NOT NULL DEFAULT 'MULTIPLE';
