import { NextResponse } from "next/server";
import type { RestoOrderStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

const LIVE_STATUSES: RestoOrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"];

/**
 * Feeds the orders board. `?scope=live` (the default) returns everything
 * still in the kitchen; `?scope=history` returns the recently closed ones.
 */
export async function GET(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "history" ? "history" : "live";

  const orders = await db.restoOrder.findMany({
    where: {
      restaurantId: auth.session.restaurantId,
      status: scope === "live" ? { in: LIVE_STATUSES } : { in: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { placedAt: scope === "live" ? "asc" : "desc" },
    take: scope === "live" ? 200 : 50,
    include: {
      items: { select: { id: true, name: true, quantity: true, lineTotal: true } },
      table: { select: { label: true } },
    },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      tableLabel: order.table?.label ?? null,
      total: order.total,
      note: order.note,
      deliveryAddress: order.deliveryAddress,
      deliveryPincode: order.deliveryPincode,
      pickupInMinutes: order.pickupInMinutes,
      placedAt: order.placedAt,
      items: order.items,
    })),
  });
}
