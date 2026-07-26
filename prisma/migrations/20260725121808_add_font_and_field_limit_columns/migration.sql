-- AlterTable
ALTER TABLE "CardSettings" ADD COLUMN     "bodyFont" TEXT NOT NULL DEFAULT 'font-sans',
ADD COLUMN     "headingFont" TEXT NOT NULL DEFAULT 'font-sans';

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "maxFields" INTEGER NOT NULL DEFAULT 20;
