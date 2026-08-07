import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads a menu photo to Cloudinary and returns the URL for the caller to
 * attach to an item. Same data-URI upload approach as
 * uploadGalleryImageForUser() in lib/services/gallery-service.ts, but into a
 * separate folder so restaurant media never mixes with card galleries.
 */
export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image is too large (max 5MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `restaurant-menu/${auth.session.restaurantId}`,
    resource_type: "image",
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  });

  return NextResponse.json({
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  });
}
