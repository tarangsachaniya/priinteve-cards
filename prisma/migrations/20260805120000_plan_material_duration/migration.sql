-- Plans move from a cardType (NFC/QR/BOTH) model to a material x duration matrix.
-- Every card now ships with both NFC and QR, so cardType no longer describes a choice.

-- CreateEnum
CREATE TYPE "CardMaterial" AS ENUM ('PLASTIC', 'WOODEN', 'METAL');

-- The old NFC/QR/BOTH plans have no equivalent in the new matrix and are replaced
-- by the 9 seeded material x duration rows. Safe: purchases referencing them were
-- already removed by scripts/wipe-data.ts, and no user still points at a plan.
DELETE FROM "Plan";

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "cardType",
ADD COLUMN     "durationYears" INTEGER NOT NULL,
ADD COLUMN     "material" "CardMaterial" NOT NULL;

-- DropEnum
DROP TYPE "CardType";

-- CreateIndex
CREATE UNIQUE INDEX "Plan_material_durationYears_key" ON "Plan"("material", "durationYears");
