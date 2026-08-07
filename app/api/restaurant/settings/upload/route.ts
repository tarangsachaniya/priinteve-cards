import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads a cover photo or logo to Cloudinary. Same data-URI approach as
 * menu-items/upload, in its own restaurant-branding folder rather than mixed
 * in with dish photos, and with a transform matched to how each is actually
 * displayed: the cover fills a 16:9 strip behind the restaurant's name, the
 * logo sits at a fixed square size on a card — see restaurant-hero.tsx.
 */
export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (kind !== "cover" && kind !== "logo") {
    return NextResponse.json({ error: "Unknown image type" }, { status: 400 });
  }
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
    folder: `restaurant-branding/${auth.session.restaurantId}`,
    resource_type: "image",
    transformation:
      kind === "cover"
        ? [{ width: 1600, height: 900, crop: "limit" }]
        : // A logo is shown small and square (restaurant-hero.tsx), so it's
          // limited rather than cropped — an owner's non-square logo keeps
          // its shape and just gets fitted inside the frame.
          [{ width: 512, height: 512, crop: "limit" }],
  });

  return NextResponse.json({
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  });
}
