import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { fieldType, label } = parsed.data;
  const value = fieldType === "bio" ? sanitizeRichTextServer(parsed.data.value) : parsed.data.value;

  const last = await db.cardField.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const field = await db.cardField.create({
    data: { userId, fieldType, label, value, order: (last?.order ?? -1) + 1 },
  });

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true, field });
}
