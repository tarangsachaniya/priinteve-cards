-- Menu pagination and steering: peak windows, per-dish serve times, and a
-- UPI QR payment mode.

-- AlterEnum
-- UPI_QR settles like COUNTER — a staff member confirms it — but is recorded
-- separately so the till report can tell notes from a bank credit.
ALTER TYPE "RestoPaymentMode" ADD VALUE 'UPI_QR';

-- AlterTable
-- The owner's UPI details. Nullable and off by default: a restaurant that
-- never fills these in simply never sees the option.
ALTER TABLE "resto_restaurant" ADD COLUMN     "upiVpa" TEXT,
ADD COLUMN     "upiPayeeName" TEXT,
ADD COLUMN     "upiQrEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- prepMinutes is nullable rather than defaulted: "not quoted" and "quoted as
-- zero" are different facts, and only the first is true of an existing menu.
ALTER TABLE "resto_menu_item" ADD COLUMN     "prepMinutes" INTEGER,
ADD COLUMN     "demoteAtPeak" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- Snapshot on the order line, so an edit to the dish never rewrites the
-- estimate a waiting guest was already given. Existing rows stay null, which
-- the status page renders as no estimate at all.
ALTER TABLE "resto_order_item" ADD COLUMN     "prepMinutes" INTEGER;

-- CreateTable
-- No unique constraint on (restaurantId, dayOfWeek): a day may hold several
-- rushes, and lunch plus dinner is the ordinary case.
CREATE TABLE "resto_peak_window" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startsAt" INTEGER NOT NULL,
    "endsAt" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resto_peak_window_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resto_peak_window_restaurantId_dayOfWeek_idx" ON "resto_peak_window"("restaurantId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "resto_peak_window" ADD CONSTRAINT "resto_peak_window_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "resto_restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
