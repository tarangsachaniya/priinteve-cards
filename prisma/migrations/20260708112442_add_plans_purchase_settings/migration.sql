/*
  Warnings:

  - The `status` column on the `Purchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "recommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "gatewayName" TEXT NOT NULL DEFAULT 'mock',
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "isRenewal" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "Purchase_gatewayOrderId_idx" ON "Purchase"("gatewayOrderId");
