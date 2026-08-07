import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { menuItemUpdateSchema } from "@/lib/validations/restaurant";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = menuItemUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { restaurantId } = auth.session;

  const existing = await db.menuItem.findFirst({
    where: { id: params.id, restaurantId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { categoryId, name, description, price, isVeg, isAvailable, imageUrl, imagePublicId, sortOrder } =
    parsed.data;

  if (categoryId) {
    const category = await db.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const item = await db.menuItem.update({
    where: { id: params.id },
    data: {
      ...(categoryId !== undefined && { categoryId }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(price !== undefined && { price }),
      ...(isVeg !== undefined && { isVeg }),
      ...(isAvailable !== undefined && { isAvailable }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(imagePublicId !== undefined && { imagePublicId: imagePublicId || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const existing = await db.menuItem.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true, imagePublicId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Past orders keep their snapshot of the name and price (RestoOrderItem
  // holds menuItemId with onDelete: SetNull), so deleting is safe.
  await db.menuItem.delete({ where: { id: params.id } });

  if (existing.imagePublicId) {
    await cloudinary.uploader
      .destroy(existing.imagePublicId)
      .catch((err) => console.error("menu image cleanup failed", err));
  }

  return NextResponse.json({ success: true });
}
