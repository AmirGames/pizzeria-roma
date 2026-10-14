CREATE TYPE "FulfillmentCategory" AS ENUM ('PIZZA', 'PASTA', 'OTHER');

ALTER TABLE "MenuCategory"
ADD COLUMN "fulfillmentCategory" "FulfillmentCategory" NOT NULL DEFAULT 'OTHER';
