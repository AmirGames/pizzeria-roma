ALTER TABLE "Product" ADD COLUMN "removableIngredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
