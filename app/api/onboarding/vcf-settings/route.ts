import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveVcfSettingsSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveVcfSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { vcfIncludePhoto } = parsed.data;

  const cardSettings = await db.cardSettings.upsert({
    where: { userId },
    update: { vcfIncludePhoto },
    create: { userId, vcfIncludePhoto },
  });

  await db.user.updateMany({
    where: { id: userId, onboardingStep: { lt: 5 } },
    data: { onboardingStep: 5 },
  });

  return NextResponse.json({ success: true, cardSettings });
}
