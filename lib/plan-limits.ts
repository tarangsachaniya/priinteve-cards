import { db } from "@/lib/db";

export async function getGalleryUsage(userId: string) {
  const [user, count] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: { select: { maxGalleryImages: true } } },
    }),
    db.galleryItem.count({ where: { userId, type: "IMAGE" } }),
  ]);

  return { count, max: user?.plan?.maxGalleryImages ?? 0 };
}
