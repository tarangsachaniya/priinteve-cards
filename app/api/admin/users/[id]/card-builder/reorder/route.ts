import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { cardBuilderReorderSchema } from "@/lib/validations/onboarding";

/** Admin-scoped mirror of /api/card-builder/reorder — same transaction, target user's id instead of the session user's. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardBuilderReorderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = params.id;
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
    ...fieldOrder.map((entry) => db.cardField.update({ where: { id: entry.id }, data: { order: entry.order } })),
    db.cardSettings.upsert({
      where: { userId },
      update: { gallerySectionOrder },
      create: { userId, gallerySectionOrder },
    }),
  ]);

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true });
}
