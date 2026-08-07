import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { categoryUpdateSchema } from "@/lib/validations/restaurant";

/**
 * Every handler filters by restaurantId as well as id, so a request for
 * another restaurant's category is indistinguishable from one that doesn't
 * exist.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = categoryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await db.menuCategory.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, description, isActive, sortOrder } = parsed.data;

  const category = await db.menuCategory.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const existing = await db.menuCategory.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing._count.items > 0) {
    return NextResponse.json(
      { error: "Move or delete this category's items first" },
      { status: 409 }
    );
  }

  await db.menuCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
