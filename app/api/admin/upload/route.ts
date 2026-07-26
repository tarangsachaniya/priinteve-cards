import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const mode = formData.get("mode") === "video" ? "video" : "image";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (mode === "video") {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported video type" }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "File is too large (max 50MB)" }, { status: 400 });
    }
  } else {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "site-content",
    resource_type: mode === "video" ? "video" : "image",
  });

  return NextResponse.json({ url: uploadResult.secure_url });
}
