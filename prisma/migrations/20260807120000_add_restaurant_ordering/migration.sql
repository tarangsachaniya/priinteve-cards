-- CreateEnum
CREATE TYPE "RestoUserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "RestoOrderType" AS ENUM ('DINE_IN', 'TAKE_AWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "RestoOrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RestoPaymentMode" AS ENUM ('ONLINE', 'COUNTER');

-- CreateEnum
CREATE TYPE "RestoPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "resto_restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#16A34A',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dineInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "takeAwayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "onlinePaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "counterPaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxPercent" INTEGER NOT NULL DEFAULT 0,
    "deliveryFee" INTEGER NOT NULL DEFAULT 0,
    "minOrderValue" INTEGER NOT NULL DEFAULT 0,
    "orderSeq" INTEGER NOT NULL DEFAULT 0,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_user" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "RestoUserRole" NOT NULL DEFAULT 'OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_menu_category" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_menu_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_menu_item" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "isVeg" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_table" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seats" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_customer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_order" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "tableId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerMobile" TEXT NOT NULL,
    "type" "RestoOrderType" NOT NULL,
    "status" "RestoOrderStatus" NOT NULL DEFAULT 'PLACED',
    "paymentMode" "RestoPaymentMode" NOT NULL,
    "paymentStatus" "RestoPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "deliveryFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryPincode" TEXT,
    "deliveryNotes" TEXT,
    "pickupInMinutes" INTEGER,
    "note" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "preparingAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resto_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resto_order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "name" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "resto_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resto_restaurant_slug_key" ON "resto_restaurant"("slug");

-- CreateIndex
CREATE INDEX "resto_restaurant_isActive_idx" ON "resto_restaurant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "resto_user_email_key" ON "resto_user"("email");

-- CreateIndex
CREATE INDEX "resto_user_restaurantId_idx" ON "resto_user"("restaurantId");

-- CreateIndex
CREATE INDEX "resto_menu_category_restaurantId_idx" ON "resto_menu_category"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_menu_category_restaurantId_name_key" ON "resto_menu_category"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "resto_menu_item_restaurantId_idx" ON "resto_menu_item"("restaurantId");

-- CreateIndex
CREATE INDEX "resto_menu_item_categoryId_idx" ON "resto_menu_item"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_table_code_key" ON "resto_table"("code");

-- CreateIndex
CREATE INDEX "resto_table_restaurantId_idx" ON "resto_table"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_table_restaurantId_label_key" ON "resto_table"("restaurantId", "label");

-- CreateIndex
CREATE INDEX "resto_customer_restaurantId_idx" ON "resto_customer"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_customer_restaurantId_mobile_key" ON "resto_customer"("restaurantId", "mobile");

-- CreateIndex
CREATE UNIQUE INDEX "resto_order_razorpayOrderId_key" ON "resto_order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "resto_order_restaurantId_status_idx" ON "resto_order"("restaurantId", "status");

-- CreateIndex
CREATE INDEX "resto_order_restaurantId_placedAt_idx" ON "resto_order"("restaurantId", "placedAt" DESC);

-- CreateIndex
CREATE INDEX "resto_order_customerId_idx" ON "resto_order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_order_restaurantId_orderNumber_key" ON "resto_order"("restaurantId", "orderNumber");

-- CreateIndex
CREATE INDEX "resto_order_item_orderId_idx" ON "resto_order_item"("orderId");

-- AddForeignKey
ALTER TABLE "resto_user" ADD CONSTRAINT "resto_user_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_menu_category" ADD CONSTRAINT "resto_menu_category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_menu_item" ADD CONSTRAINT "resto_menu_item_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_menu_item" ADD CONSTRAINT "resto_menu_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "resto_menu_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_table" ADD CONSTRAINT "resto_table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_customer" ADD CONSTRAINT "resto_customer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order" ADD CONSTRAINT "resto_order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order" ADD CONSTRAINT "resto_order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "resto_table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order" ADD CONSTRAINT "resto_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "resto_customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order_item" ADD CONSTRAINT "resto_order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "resto_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_order_item" ADD CONSTRAINT "resto_order_item_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "resto_menu_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

