import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { cloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { menuItemUpdateSchema, type MenuItemCreateInput } from "@/lib/validations/restaurant";

type VariantInput = NonNullable<MenuItemCreateInput["variants"]>[number];
type AddOnInput = NonNullable<MenuItemCreateInput["addOns"]>[number];

/**
 * Diffs the form's full desired list of sizes against what the item currently
 * has: a row with a matching `id` is updated, a row with no `id` is new, and
 * an existing row absent from the incoming list was removed in the form. One
 * list in, the database matches it exactly — reordering rows in the form is
 * what drives sortOrder too.
 */
async function reconcileVariants(
  tx: Prisma.TransactionClient,
  menuItemId: string,
  incoming: VariantInput[]
) {
  const existing = await tx.menuItemVariant.findMany({
    where: { menuItemId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const incomingIds = new Set(incoming.filter((row) => row.id).map((row) => row.id!));

  const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await tx.menuItemVariant.deleteMany({ where: { id: { in: toDelete }, menuItemId } });
  }

  for (let index = 0; index < incoming.length; index += 1) {
    const variant = incoming[index];
    const data = {
      name: variant.name,
      priceDelta: variant.priceDelta,
      isDefault: variant.isDefault,
      sortOrder: index,
    };
    if (variant.id && existingIds.has(variant.id)) {
      await tx.menuItemVariant.update({ where: { id: variant.id }, data });
    } else {
      await tx.menuItemVariant.create({ data: { ...data, menuItemId } });
    }
  }
}

/** Same reconciliation as reconcileVariants, for add-ons. */
async function reconcileAddOns(
  tx: Prisma.TransactionClient,
  menuItemId: string,
  incoming: AddOnInput[]
) {
  const existing = await tx.menuItemAddOn.findMany({
    where: { menuItemId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const incomingIds = new Set(incoming.filter((row) => row.id).map((row) => row.id!));

  const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await tx.menuItemAddOn.deleteMany({ where: { id: { in: toDelete }, menuItemId } });
  }

  for (let index = 0; index < incoming.length; index += 1) {
    const addOn = incoming[index];
    const data = { name: addOn.name, price: addOn.price, sortOrder: index };
    if (addOn.id && existingIds.has(addOn.id)) {
      await tx.menuItemAddOn.update({ where: { id: addOn.id }, data });
    } else {
      await tx.menuItemAddOn.create({ data: { ...data, menuItemId } });
    }
  }
}

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

  const {
    categoryId,
    name,
    description,
    price,
    isVeg,
    isAvailable,
    imageUrl,
    imagePublicId,
    badge,
    sortOrder,
    variants,
    addOns,
  } = parsed.data;

  if (categoryId) {
    const category = await db.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  await db.$transaction(async (tx) => {
    await tx.menuItem.update({
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
        ...(badge !== undefined && { badge: badge ?? null }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // `variants`/`addOns` are omitted (undefined) on most edits — the owner
    // was only changing the price or a toggle — and an omitted key here means
    // leave options untouched. An explicit array, even empty, means this is
    // what the form now shows: rows with a matching `id` are updated, rows
    // with no `id` are new, and any existing row absent from the array was
    // removed in the form and gets deleted.
    if (variants !== undefined) {
      await reconcileVariants(tx, params.id, variants);
    }

    if (addOns !== undefined) {
      await reconcileAddOns(tx, params.id, addOns);
    }
  });

  const item = await db.menuItem.findUniqueOrThrow({
    where: { id: params.id },
    include: { variants: true, addOns: true },
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
