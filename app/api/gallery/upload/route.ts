import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { revalidateUserCard } from "@/lib/revalidate-card";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  }

  const userId = session.user.id;

  const { count, max } = await getGalleryUsage(userId);
  if (count >= max) {
    return NextResponse.json({ error: "Image limit reached for your plan" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "gallery",
    resource_type: "image",
  });

  const lastItem = await db.galleryItem.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
  });

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

  return NextResponse.json({ success: true, item });
}
