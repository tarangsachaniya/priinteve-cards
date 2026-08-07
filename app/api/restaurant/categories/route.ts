import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { categoryCreateSchema } from "@/lib/validations/restaurant";

export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const categories = await db.menuCategory.findMany({
    where: { restaurantId: auth.session.restaurantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = categoryCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { restaurantId } = auth.session;
  const { name, description } = parsed.data;

  const duplicate = await db.menuCategory.findFirst({
    where: { restaurantId, name },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }

  const last = await db.menuCategory.findFirst({
    where: { restaurantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await db.menuCategory.create({
    data: {
      restaurantId,
      name,
      description: description || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ category: { ...category, _count: { items: 0 } } });
}
