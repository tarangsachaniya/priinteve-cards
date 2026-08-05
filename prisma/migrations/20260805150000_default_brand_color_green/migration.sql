-- The old placeholder default (#000000) was never a deliberate colour choice,
-- and a black accent does not match the PrintEve reference palette. Move the
-- default to the reference green so a new card matches the design out of the
-- box, and migrate rows that still carry the old placeholder.
--
-- Deliberately scoped to the exact old default: any user who actually picked a
-- colour (including a genuine black) keeps it.

-- AlterTable
ALTER TABLE "CardSettings" ALTER COLUMN "brandColor" SET DEFAULT '#16A34A';

-- Backfill untouched rows only
UPDATE "CardSettings" SET "brandColor" = '#16A34A' WHERE "brandColor" = '#000000';
