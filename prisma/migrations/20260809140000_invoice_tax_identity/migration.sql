-- Tax identity for downloadable bills.
--
-- All nullable: an existing restaurant keeps working and simply gets a bill
-- headed "Bill" rather than "Tax Invoice" until it fills these in. The state
-- is not stored — it is the first two digits of the GSTIN.

-- AlterTable
ALTER TABLE "resto_restaurant" ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "fssaiLicence" TEXT;
