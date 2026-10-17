ALTER TABLE "Order"
  ADD COLUMN "loyaltyDiscountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyaltyPaidDishCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loyaltyFreeDishCount" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "Order_loyaltyDiscountCents_check" CHECK ("loyaltyDiscountCents" >= 0 AND "loyaltyDiscountCents" + "discountCents" <= "subtotalCents"),
  ADD CONSTRAINT "Order_loyaltyPaidDishCount_check" CHECK ("loyaltyPaidDishCount" >= 0),
  ADD CONSTRAINT "Order_loyaltyFreeDishCount_check" CHECK ("loyaltyFreeDishCount" >= 0);
