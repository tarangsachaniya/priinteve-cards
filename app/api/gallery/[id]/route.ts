import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await db.galleryItem.findUnique({ where: { id: params.id } });
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (item.cloudinaryId) {
    await cloudinary.uploader.destroy(item.cloudinaryId).catch((err) => {
      console.error("cloudinary destroy failed", err);
    });
  }

  await db.galleryItem.delete({ where: { id: params.id } });

  await revalidateUserCard(session.user.id);

  return NextResponse.json({ success: true });
}
