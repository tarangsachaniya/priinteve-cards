import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { menuItemCreateSchema } from "@/lib/validations/restaurant";

export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const items = await db.menuItem.findMany({
    where: { restaurantId: auth.session.restaurantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = menuItemCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { restaurantId } = auth.session;
  const { categoryId, name, description, price, isVeg, isAvailable, imageUrl, imagePublicId } =
    parsed.data;

  // The category must belong to this restaurant — otherwise a caller could
  // attach an item to someone else's menu.
  const category = await db.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const last = await db.menuItem.findFirst({
    where: { restaurantId, categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await db.menuItem.create({
    data: {
      restaurantId,
      categoryId,
      name,
      description: description || null,
      price,
      isVeg,
      isAvailable,
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ item });
}
