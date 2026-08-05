import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { getGalleryUsage, getVideoUsage } from "@/lib/plan-limits";
import { getYoutubeVideoId } from "@/lib/youtube";
import type { ServiceResult } from "@/lib/services/card-field-service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type GalleryItemRow = {
  id: string;
  type: "IMAGE" | "YOUTUBE";
  url: string;
  cloudinaryId: string | null;
  caption: string | null;
  altText: string | null;
  order: number;
};

export async function uploadGalleryImageForUser(
  userId: string,
  file: File,
  options?: { bypassLimit?: boolean }
): Promise<ServiceResult<GalleryItemRow>> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, status: 400, error: "Unsupported image type" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, status: 400, error: "File is too large (max 10MB)" };
  }

  if (!options?.bypassLimit) {
    const { count, max } = await getGalleryUsage(userId);
    if (count >= max) {
      return { ok: false, status: 400, error: "Image limit reached for your plan" };
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(dataUri, { folder: "gallery", resource_type: "image" });

  const lastItem = await db.galleryItem.findFirst({ where: { userId }, orderBy: { order: "desc" } });
  const item = await db.galleryItem.create({
    data: {
      userId,
      type: "IMAGE",
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      order: (lastItem?.order ?? -1) + 1,
    },
  });

  await revalidateUserCard(userId);
  return { ok: true, data: item };
}

export async function addYoutubeItemForUser(
  userId: string,
  url: string,
  options?: { bypassLimit?: boolean }
): Promise<ServiceResult<GalleryItemRow>> {
  if (!getYoutubeVideoId(url)) {
    return { ok: false, status: 400, error: "Not a valid YouTube URL" };
  }

  if (!options?.bypassLimit) {
    const { count, max } = await getVideoUsage(userId);
    if (count >= max) {
      return { ok: false, status: 400, error: "Video limit reached for your plan" };
    }
  }

  const lastItem = await db.galleryItem.findFirst({ where: { userId }, orderBy: { order: "desc" } });
  const item = await db.galleryItem.create({ data: { userId, type: "YOUTUBE", url, order: (lastItem?.order ?? -1) + 1 } });

  await revalidateUserCard(userId);
  return { ok: true, data: item };
}

export async function updateGalleryItemForUser(
  userId: string,
  itemId: string,
  input: { caption?: string; altText?: string }
): Promise<ServiceResult<GalleryItemRow>> {
  const item = await db.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const updated = await db.galleryItem.update({ where: { id: itemId }, data: input });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}

export async function deleteGalleryItemForUser(userId: string, itemId: string): Promise<ServiceResult<null>> {
  const item = await db.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  if (item.cloudinaryId) {
    await cloudinary.uploader.destroy(item.cloudinaryId).catch((err) => {
      console.error("cloudinary destroy failed", err);
    });
  }

  await db.galleryItem.delete({ where: { id: itemId } });
  await revalidateUserCard(userId);
  return { ok: true, data: null };
}

export async function setGalleryLayoutForUser(userId: string, galleryLayout: string) {
  const cardSettings = await db.cardSettings.upsert({
    where: { userId },
    update: { galleryLayout },
    create: { userId, galleryLayout },
  });
  await revalidateUserCard(userId);
  return cardSettings;
}
