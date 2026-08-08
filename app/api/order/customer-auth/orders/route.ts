import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/restaurant/customer-auth";
import { getOrderStatusUrl } from "@/lib/restaurant/qr";

/** Matches the cap on /api/order/track — a history, not an archive. */
const HISTORY_LIMIT = 20;

/**
 * The signed-in guest's own order history at one restaurant.
 *
 * Deliberately not the same thing as /api/order/track: that route takes a
 * mobile number from anyone who asks and is rate limited because of it. Here
 * the mobile comes from the signed cookie instead, so there is nothing to
 * enumerate and no rate limit to apply — a caller can only ever read their
 * own orders.
 *
 * Scoping is enforced exactly as in the /me route: the client knows the page
 * slug, never the restaurant id sealed in the cookie, so the slug is resolved
 * server-side and compared against session.restaurantId.
 */
export async function GET(req: Request) {
  const restaurantSlug = new URL(req.url).searchParams.get("restaurantSlug");

  const session = await getCustomerSession();
  if (!session || !restaurantSlug) {
    return NextResponse.json({ orders: [] });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true },
  });
  if (!restaurant || restaurant.id !== session.restaurantId) {
    return NextResponse.json({ orders: [] });
  }

  const customer = await db.restoCustomer.findUnique({
    where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile: session.mobile } },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await db.restoOrder.findMany({
    where: { customerId: customer.id },
    orderBy: { placedAt: "desc" },
    take: HISTORY_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      placedAt: true,
    },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      ...order,
      statusUrl: getOrderStatusUrl(restaurantSlug, order.id),
    })),
  });
}
