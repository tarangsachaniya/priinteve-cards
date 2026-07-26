import { db } from "@/lib/db";

/** Fixed allowances for users still in Setup, before they've purchased a plan. */
export const PRE_PURCHASE_MAX_IMAGES = 4;
export const PRE_PURCHASE_MAX_VIDEOS = 1;
export const PRE_PURCHASE_MAX_FIELDS = 10;

export async function getGalleryUsage(userId: string) {
  const [user, count] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { maxGalleryImages: true } } },
    }),
    db.galleryItem.count({ where: { userId, type: "IMAGE" } }),
  ]);

  return { count, max: user?.plan?.maxGalleryImages ?? PRE_PURCHASE_MAX_IMAGES };
}

export async function getVideoUsage(userId: string) {
  const [user, count] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { maxVideos: true } } },
    }),
    db.galleryItem.count({ where: { userId, type: "YOUTUBE" } }),
  ]);

  return { count, max: user?.plan?.maxVideos ?? PRE_PURCHASE_MAX_VIDEOS };
}

export async function getFieldUsage(userId: string) {
  const [user, count] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { maxFields: true } } },
    }),
    db.cardField.count({ where: { userId } }),
  ]);

  return { count, max: user?.plan?.maxFields ?? PRE_PURCHASE_MAX_FIELDS };
}
