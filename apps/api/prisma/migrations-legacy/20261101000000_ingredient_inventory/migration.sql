CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING', 'RECEIPT', 'ADJUSTMENT', 'CONSUMPTION', 'REVERSAL');
CREATE TYPE "ProductSize" AS ENUM ('S', 'M', 'L');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "products" DROP COLUMN "stock";

CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "onHand" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

CREATE TABLE "product_recipes" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "size" "ProductSize" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    CONSTRAINT "product_recipes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_recipes_productId_size_ingredientId_key" ON "product_recipes"("productId", "size", "ingredientId");
CREATE INDEX "product_recipes_ingredientId_idx" ON "product_recipes"("ingredientId");
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_recipes" ADD CONSTRAINT "product_recipes_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "topping_recipes" (
    "id" SERIAL NOT NULL,
    "toppingId" TEXT NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    CONSTRAINT "topping_recipes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "topping_recipes_toppingId_ingredientId_key" ON "topping_recipes"("toppingId", "ingredientId");
CREATE INDEX "topping_recipes_ingredientId_idx" ON "topping_recipes"("ingredientId");
ALTER TABLE "topping_recipes" ADD CONSTRAINT "topping_recipes_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "inventory_movements" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_movements_orderId_ingredientId_type_key" ON "inventory_movements"("orderId", "ingredientId", "type");
CREATE INDEX "inventory_movements_ingredientId_createdAt_idx" ON "inventory_movements"("ingredientId", "createdAt");
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
