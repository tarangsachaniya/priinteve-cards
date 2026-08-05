import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { saveThemeSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveThemeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { themeId, themeMode, brandColor, headingFont, bodyFont } = parsed.data;

  const cardSettings = await db.cardSettings.upsert({
    where: { userId },
    update: {
      themeId,
      brandColor,
      ...(themeMode && { themeMode }),
      ...(headingFont && { headingFont }),
      ...(bodyFont && { bodyFont }),
    },
    create: {
      userId,
      themeId,
      brandColor,
      ...(themeMode && { themeMode }),
      ...(headingFont && { headingFont }),
      ...(bodyFont && { bodyFont }),
    },
  });

  await db.user.updateMany({
    where: { id: userId, onboardingStep: { lt: 4 } },
    data: { onboardingStep: 4 },
  });

  // /[slug] is force-static with a 2h revalidate, so without this a theme or
  // light/dark change would not reach the live card until the window expired.
  await revalidateUserCard(userId);

  return NextResponse.json({ success: true, cardSettings });
}
