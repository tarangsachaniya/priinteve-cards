import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { menuBulkImportSchema } from "@/lib/validations/restaurant";

/**
 * Bulk-creates a menu from pasted JSON: categories, dishes, and — for the
 * first time anywhere in the owner UI — variants and add-ons. Both have
 * always existed in the schema and in the customer order flow; there has
 * just never been a screen to set them, so JSON entry is currently the only
 * way an owner can add a size choice or an extra.
 *
 * Idempotent on purpose. An owner drafting a menu in JSON will paste the same
 * document more than once while iterating, so:
 *   - a category is matched by name rather than always created;
 *   - an item already in that category (by name) is never recreated or its
 *     base fields touched — but if the pasted document has a variant or
 *     add-on the existing item doesn't have yet (matched by name), that one
 *     option is added onto it. This is the only path today for putting a
 *     size or an extra onto a dish that was created before this screen
 *     existed, or onto one a previous import left without them.
 *   - nothing here ever changes or deletes an existing name, price or option.
 */
export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = menuBulkImportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { restaurantId } = auth.session;
  const { categories: incomingCategories } = parsed.data;

  const [existingCategories, lastCategory] = await Promise.all([
    db.menuCategory.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    }),
    db.menuCategory.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    }),
  ]);
  const categoryByName = new Map(
    existingCategories.map((category) => [category.name.toLowerCase(), category.id])
  );
  let nextCategorySort = (lastCategory?.sortOrder ?? -1) + 1;

  const createdCategories: { id: string; name: string; description: string | null; sortOrder: number; isActive: boolean }[] = [];
  const createdItems: Awaited<ReturnType<typeof db.menuItem.create>>[] = [];
  const augmented: { category: string; item: string; variantsAdded: number; addOnsAdded: number }[] = [];
  const skipped: { category: string; item: string; reason: string }[] = [];

  await db.$transaction(async (tx) => {
    for (const incomingCategory of incomingCategories) {
      let categoryId = categoryByName.get(incomingCategory.name.toLowerCase());

      if (!categoryId) {
        const category = await tx.menuCategory.create({
          data: {
            restaurantId,
            name: incomingCategory.name,
            description: incomingCategory.description || null,
            sortOrder: nextCategorySort++,
          },
        });
        categoryId = category.id;
        categoryByName.set(incomingCategory.name.toLowerCase(), categoryId);
        createdCategories.push(category);
      }

      // Full existing items for THIS category, including their options —
      // reloaded per category (not once up front) because a category created
      // earlier in this same import has items the loop itself just added,
      // which still need to be checked against.
      const existingItems = await tx.menuItem.findMany({
        where: { restaurantId, categoryId },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          variants: { select: { name: true, sortOrder: true } },
          addOns: { select: { name: true, sortOrder: true } },
        },
      });
      const itemByName = new Map(existingItems.map((item) => [item.name.toLowerCase(), item]));
      let nextItemSort = existingItems.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

      for (const incomingItem of incomingCategory.items) {
        const existingItem = itemByName.get(incomingItem.name.toLowerCase());

        if (!existingItem) {
          const item = await tx.menuItem.create({
            data: {
              restaurantId,
              categoryId,
              name: incomingItem.name,
              description: incomingItem.description || null,
              price: incomingItem.price,
              isVeg: incomingItem.isVeg,
              isAvailable: incomingItem.isAvailable,
              imageUrl: incomingItem.imageUrl || null,
              badge: incomingItem.badge ?? null,
              sortOrder: nextItemSort++,
              variants: {
                create: incomingItem.variants.map((variant, index) => ({
                  name: variant.name,
                  priceDelta: variant.priceDelta,
                  isDefault: variant.isDefault,
                  sortOrder: index,
                })),
              },
              addOns: {
                create: incomingItem.addOns.map((addOn, index) => ({
                  name: addOn.name,
                  price: addOn.price,
                  sortOrder: index,
                })),
              },
            },
            include: { variants: true, addOns: true },
          });

          itemByName.set(incomingItem.name.toLowerCase(), {
            id: item.id,
            name: item.name,
            sortOrder: item.sortOrder,
            variants: incomingItem.variants.map((v, i) => ({ name: v.name, sortOrder: i })),
            addOns: incomingItem.addOns.map((a, i) => ({ name: a.name, sortOrder: i })),
          });
          createdItems.push(item);
          continue;
        }

        // The item already exists. Its name, price and description are left
        // alone — this path only ever adds an option that isn't there yet,
        // it never edits what already is.
        const existingVariantNames = new Set(
          existingItem.variants.map((v) => v.name.toLowerCase())
        );
        const existingAddOnNames = new Set(existingItem.addOns.map((a) => a.name.toLowerCase()));

        const missingVariants = incomingItem.variants.filter(
          (v) => !existingVariantNames.has(v.name.toLowerCase())
        );
        const missingAddOns = incomingItem.addOns.filter(
          (a) => !existingAddOnNames.has(a.name.toLowerCase())
        );

        if (missingVariants.length === 0 && missingAddOns.length === 0) {
          skipped.push({
            category: incomingCategory.name,
            item: incomingItem.name,
            reason: "Already on the menu with the same options",
          });
          continue;
        }

        const nextVariantSort =
          existingItem.variants.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1;
        const nextAddOnSort =
          existingItem.addOns.reduce((max, a) => Math.max(max, a.sortOrder), -1) + 1;

        await tx.menuItem.update({
          where: { id: existingItem.id },
          data: {
            variants: {
              create: missingVariants.map((variant, index) => ({
                name: variant.name,
                priceDelta: variant.priceDelta,
                isDefault: variant.isDefault,
                sortOrder: nextVariantSort + index,
              })),
            },
            addOns: {
              create: missingAddOns.map((addOn, index) => ({
                name: addOn.name,
                price: addOn.price,
                sortOrder: nextAddOnSort + index,
              })),
            },
          },
        });

        augmented.push({
          category: incomingCategory.name,
          item: incomingItem.name,
          variantsAdded: missingVariants.length,
          addOnsAdded: missingAddOns.length,
        });
      }
    }
  });

  return NextResponse.json({
    categories: createdCategories,
    items: createdItems,
    augmented,
    skipped,
    summary: {
      categoriesCreated: createdCategories.length,
      itemsCreated: createdItems.length,
      itemsAugmented: augmented.length,
      itemsSkipped: skipped.length,
    },
  });
}
