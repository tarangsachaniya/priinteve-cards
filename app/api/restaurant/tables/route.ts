import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { generateUniqueTableCode } from "@/lib/restaurant/codes";
import { tableBulkCreateSchema, tableCreateSchema } from "@/lib/validations/restaurant";

export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const tables = await db.restaurantTable.findMany({
    where: { restaurantId: auth.session.restaurantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ tables });
}

/**
 * Creates one table, or a run of them when `count` is present — restaurants
 * setting up for the first time usually want "Table 1" through "Table 12"
 * rather than twelve separate clicks.
 */
export async function POST(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { restaurantId } = auth.session;

  if (typeof body?.count === "number") {
    const parsed = tableBulkCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { prefix, count, startAt, seats } = parsed.data;
    const existing = await db.restaurantTable.findMany({
      where: { restaurantId },
      select: { label: true },
    });
    const taken = new Set(existing.map((t) => t.label));

    const created = [];
    for (let n = startAt; n < startAt + count; n += 1) {
      const label = `${prefix} ${n}`;
      if (taken.has(label)) continue;
      created.push(
        await db.restaurantTable.create({
          data: { restaurantId, label, code: await generateUniqueTableCode(), seats: seats ?? null },
        })
      );
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "Those table names already exist" },
        { status: 409 }
      );
    }

    return NextResponse.json({ tables: created });
  }

  const parsed = tableCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { label, seats } = parsed.data;

  const duplicate = await db.restaurantTable.findFirst({
    where: { restaurantId, label },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json({ error: "A table with that name already exists" }, { status: 409 });
  }

  const table = await db.restaurantTable.create({
    data: { restaurantId, label, code: await generateUniqueTableCode(), seats: seats ?? null },
  });

  return NextResponse.json({ tables: [table] });
}
