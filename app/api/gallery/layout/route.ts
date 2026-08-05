import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { setGalleryLayoutForUser } from "@/lib/services/gallery-service";
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

  const cardSettings = await setGalleryLayoutForUser(session.user.id, parsed.data.galleryLayout);

  await db.user.updateMany({
    where: { id: session.user.id, onboardingStep: { lt: 4 } },
    data: { onboardingStep: 4 },
  });

  return NextResponse.json({ success: true, cardSettings });
}
