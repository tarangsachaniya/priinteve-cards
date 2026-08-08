import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { LIVE_STATUSES } from "@/lib/restaurant/order-status";

/**
 * Feeds the orders board — live orders only.
 *
 * A `?scope=history` branch used to live here, unused by anything and with no
 * date filtering. Closed orders are served by /r/history now, so it is gone
 * rather than left looking supported.
 */
export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const orders = await db.restoOrder.findMany({
    where: {
      restaurantId: auth.session.restaurantId,
      status: { in: LIVE_STATUSES },
    },
    orderBy: { placedAt: "desc" },
    take: 200,
    include: {
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          lineTotal: true,
          variantName: true,
          addOns: { select: { name: true } },
        },
      },
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
      items: order.items.map((item) => ({
        ...item,
        addOns: item.addOns.map((addOn) => addOn.name),
      })),
    })),
  });
}
