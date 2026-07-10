import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { cardBuilderReorderSchema } from "@/lib/validations/onboarding";

/**
 * Reorders the whole builder (CardField.order + CardSettings.gallerySectionOrder)
 * in one transaction. Both live in the same integer order-space, so a partial
 * failure (one write succeeding, the other failing) would leave the section
 * order visibly corrupted — a single transaction avoids that.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardBuilderReorderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { fieldOrder, gallerySectionOrder } = parsed.data;

  if (fieldOrder.length > 0) {
    const ownedFields = await db.cardField.findMany({ where: { userId }, select: { id: true } });
    const ownedIds = new Set(ownedFields.map((field) => field.id));
    const allOwned = fieldOrder.every((entry) => ownedIds.has(entry.id));
    if (!allOwned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await db.$transaction([
    ...fieldOrder.map((entry) =>
      db.cardField.update({ where: { id: entry.id }, data: { order: entry.order } })
    ),
    db.cardSettings.upsert({
      where: { userId },
      update: { gallerySectionOrder },
      create: { userId, gallerySectionOrder },
    }),
  ]);

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true });
}
