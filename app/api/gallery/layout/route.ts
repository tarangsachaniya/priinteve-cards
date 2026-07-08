import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { saveGalleryLayoutSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveGalleryLayoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { galleryLayout } = parsed.data;

  const cardSettings = await db.cardSettings.upsert({
    where: { userId },
    update: { galleryLayout },
    create: { userId, galleryLayout },
  });

  await db.user.updateMany({
    where: { id: userId, onboardingStep: { lt: 4 } },
    data: { onboardingStep: 4 },
  });

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true, cardSettings });
}
