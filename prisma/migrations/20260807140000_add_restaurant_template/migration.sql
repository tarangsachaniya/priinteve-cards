-- CreateEnum
CREATE TYPE "RestoItemBadge" AS ENUM ('BESTSELLER', 'CHEFS_PICK', 'POPULAR', 'NEW');

-- AlterTable
ALTER TABLE "resto_menu_item" ADD COLUMN     "badge" "RestoItemBadge",
ADD COLUMN     "ratingValue" INTEGER;

-- AlterTable
ALTER TABLE "resto_order_item" ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "variantName" TEXT,
ADD COLUMN     "variantPriceDelta" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "resto_restaurant" ADD COLUMN     "costForTwo" INTEGER,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "coverPublicId" TEXT,
ADD COLUMN     "cuisineTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "prepTimeMaxMins" INTEGER,
ADD COLUMN     "prepTimeMinMins" INTEGER,
ADD COLUMN     "ratingCount" INTEGER,
ADD COLUMN     "ratingValue" INTEGER,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "themeMode" TEXT NOT NULL DEFAULT 'dark';

-- CreateTable
CREATE TABLE "resto_menu_item_variant" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_menu_item_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_menu_item_addon" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_menu_item_addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_order_item_addon" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "resto_order_item_addon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resto_menu_item_variant_menuItemId_idx" ON "resto_menu_item_variant"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_menu_item_variant_menuItemId_name_key" ON "resto_menu_item_variant"("menuItemId", "name");

-- CreateIndex
CREATE INDEX "resto_menu_item_addon_menuItemId_idx" ON "resto_menu_item_addon"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_menu_item_addon_menuItemId_name_key" ON "resto_menu_item_addon"("menuItemId", "name");

-- CreateIndex
CREATE INDEX "resto_order_item_addon_orderItemId_idx" ON "resto_order_item_addon"("orderItemId");

-- AddForeignKey
ALTER TABLE "resto_menu_item_variant" ADD CONSTRAINT "resto_menu_item_variant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "resto_menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_menu_item_addon" ADD CONSTRAINT "resto_menu_item_addon_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "resto_menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order_item_addon" ADD CONSTRAINT "resto_order_item_addon_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "resto_order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

