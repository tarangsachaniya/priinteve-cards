-- Opening hours, and moving payment to after the meal.

-- AlterEnum
-- REQUESTED sits between PENDING and PAID: the restaurant has closed the bill
-- and the customer's payment screen is open.
ALTER TYPE "RestoPaymentStatus" ADD VALUE 'REQUESTED' BEFORE 'PAID';

-- AlterTable
-- paymentMode is now unknown until the customer picks cash or UPI on the
-- payment screen, so it becomes nullable. Existing rows keep their value.
ALTER TABLE "resto_order" ALTER COLUMN "paymentMode" DROP NOT NULL;

ALTER TABLE "resto_order" ADD COLUMN     "paymentRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "resto_restaurant" ADD COLUMN     "acceptingOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "closedMessage" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateTable
CREATE TABLE "resto_hours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAt" INTEGER NOT NULL DEFAULT 600,
    "closesAt" INTEGER NOT NULL DEFAULT 1380,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "resto_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resto_hours_restaurantId_idx" ON "resto_hours"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "resto_hours_restaurantId_dayOfWeek_key" ON "resto_hours"("restaurantId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "resto_hours" ADD CONSTRAINT "resto_hours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
-- Reviews are anchored to a paid order, so one order earns exactly one rating.
CREATE TABLE "resto_review" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resto_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resto_review_orderId_key" ON "resto_review"("orderId");

-- CreateIndex
CREATE INDEX "resto_review_restaurantId_isHidden_createdAt_idx" ON "resto_review"("restaurantId", "isHidden", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "resto_review" ADD CONSTRAINT "resto_review_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resto_review" ADD CONSTRAINT "resto_review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "resto_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
