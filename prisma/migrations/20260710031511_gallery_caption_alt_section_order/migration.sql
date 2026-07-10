-- AlterTable
ALTER TABLE "CardSettings" ADD COLUMN     "gallerySectionOrder" INTEGER NOT NULL DEFAULT 9999;

-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "caption" TEXT;
