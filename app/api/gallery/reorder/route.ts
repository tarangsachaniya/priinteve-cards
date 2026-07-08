import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { galleryReorderSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = galleryReorderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { order } = parsed.data;

  const ownedItems = await db.galleryItem.findMany({
    where: { userId },
    select: { id: true },
  });
  const ownedIds = new Set(ownedItems.map((item) => item.id));
  const allOwned = order.every((entry) => ownedIds.has(entry.id));
  if (!allOwned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.$transaction(
    order.map((entry) =>
      db.galleryItem.update({ where: { id: entry.id }, data: { order: entry.order } })
    )
  );

  await revalidateUserCard(userId);

  return NextResponse.json({ success: true });
}
