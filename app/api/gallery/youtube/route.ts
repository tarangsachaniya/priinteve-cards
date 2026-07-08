import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { getYoutubeVideoId } from "@/lib/youtube";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveYoutubeItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { url } = parsed.data;
  if (!getYoutubeVideoId(url)) {
    return NextResponse.json({ error: "Not a valid YouTube URL" }, { status: 400 });
  }

  const userId = session.user.id;
  const lastItem = await db.galleryItem.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
  });

  const item = await db.galleryItem.create({
    data: {
      userId,
      type: "YOUTUBE",
      url,
      order: (lastItem?.order ?? -1) + 1,
    },
  });

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true, item });
}
