import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { restaurantUpdateSchema } from "@/lib/validations/restaurant";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const restaurant = await db.restaurant.findUnique({
    where: { id: params.id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { tables: true, menuItems: true, categories: true, orders: true } },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ restaurant });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const parsed = restaurantUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.restaurant.findUnique({
    where: { id: params.id },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, branch, phone, email, address, isActive } = parsed.data;

  const restaurant = await db.restaurant.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(branch !== undefined && { branch: branch || null }),
      ...(phone !== undefined && { phone: phone ? normalizeMobile(phone) : null }),
      ...(email !== undefined && { email: email || null }),
      ...(address !== undefined && { address: address || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  const action =
    isActive !== undefined && isActive !== existing.isActive
      ? isActive
        ? "restaurant.enable"
        : "restaurant.disable"
      : "restaurant.update";

  await writeAuditLog({
    actorId: auth.session.user.id,
    actorEmail: auth.session.user.email!,
    action,
    targetType: "restaurant",
    targetId: restaurant.id,
    metadata: { name: restaurant.name },
  });

  return NextResponse.json({ restaurant });
}
