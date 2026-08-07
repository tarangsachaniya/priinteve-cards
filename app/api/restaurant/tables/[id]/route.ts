import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { tableUpdateSchema } from "@/lib/validations/restaurant";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = tableUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await db.restaurantTable.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { label, seats, isActive } = parsed.data;

  const table = await db.restaurantTable.update({
    where: { id: params.id },
    data: {
      ...(label !== undefined && { label }),
      ...(seats !== undefined && { seats }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ table });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const existing = await db.restaurantTable.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Orders keep a nullable tableId (onDelete: SetNull), so history survives —
  // but a table with orders is usually one the restaurant wants to retire,
  // not erase. Deactivating keeps the record readable on past orders.
  if (existing._count.orders > 0) {
    const table = await db.restaurantTable.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ table, deactivated: true });
  }

  await db.restaurantTable.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
