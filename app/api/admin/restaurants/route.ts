import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { db } from "@/lib/db";
import {
  generateInitialPassword,
  generateUniqueRestaurantSlug,
  generateUniqueTableCode,
} from "@/lib/restaurant/codes";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { restaurantCreateSchema } from "@/lib/validations/restaurant";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const restaurants = await db.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "OWNER" },
        select: { email: true, name: true },
        take: 1,
      },
      _count: { select: { tables: true, menuItems: true, orders: true } },
    },
  });

  return NextResponse.json({
    restaurants: restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      phone: r.phone,
      isActive: r.isActive,
      ownerEmail: r.users[0]?.email ?? null,
      tableCount: r._count.tables,
      menuItemCount: r._count.menuItems,
      orderCount: r._count.orders,
      createdAt: r.createdAt,
    })),
    stats: {
      total: restaurants.length,
      active: restaurants.filter((r) => r.isActive).length,
      inactive: restaurants.filter((r) => !r.isActive).length,
      orders: restaurants.reduce((sum, r) => sum + r._count.orders, 0),
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const parsed = restaurantCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, branch, slug, ownerName, ownerEmail, ownerPassword, phone, address, tableCount } =
    parsed.data;

  const emailTaken = await db.restaurantUser.findUnique({
    where: { email: ownerEmail },
    select: { id: true },
  });
  if (emailTaken) {
    return NextResponse.json(
      { error: "That owner email is already used by another restaurant" },
      { status: 409 }
    );
  }

  // Two outlets of one brand must not collide, so the branch feeds the slug:
  // "Spice Garden" + "Bandra" → spice-garden-bandra.
  const resolvedSlug = await generateUniqueRestaurantSlug(slug || [name, branch].filter(Boolean).join(" "));

  // Shown to the admin exactly once, in the create-response. We only ever
  // store the hash.
  const plainPassword = ownerPassword || generateInitialPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  /**
   * Table codes are generated up front rather than inside the create, because
   * each one checks the database for a collision and that cannot happen mid
   * transaction. The local Set guards the only case the database cannot: two
   * codes drawn in this same loop, before either has been written.
   */
  const codes: string[] = [];
  const seen = new Set<string>();
  while (codes.length < tableCount) {
    const code = await generateUniqueTableCode();
    if (seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  const tables = codes.map((code, index) => ({
    label: `Table ${index + 1}`,
    code,
  }));

  // One statement, so a restaurant is never created without the tables the
  // admin asked for — a half-built tenant means QR codes printed for tables
  // that do not exist.
  const restaurant = await db.restaurant.create({
    data: {
      name,
      branch: branch || null,
      slug: resolvedSlug,
      phone: phone ? normalizeMobile(phone) : null,
      email: ownerEmail,
      address: address || null,
      createdByAdminId: auth.session.user.id,
      users: {
        create: {
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: "OWNER",
        },
      },
      ...(tables.length > 0 ? { tables: { create: tables } } : {}),
    },
  });

  await writeAuditLog({
    actorId: auth.session.user.id,
    actorEmail: auth.session.user.email!,
    action: "restaurant.create",
    targetType: "restaurant",
    targetId: restaurant.id,
    metadata: { name: restaurant.name, slug: restaurant.slug, ownerEmail, tableCount: tables.length },
  });

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      isActive: restaurant.isActive,
      tableCount: tables.length,
    },
    credentials: { email: ownerEmail, password: plainPassword },
  });
}
