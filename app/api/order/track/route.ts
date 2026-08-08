import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrderStatusUrl } from "@/lib/restaurant/qr";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { clientIp, rateLimit } from "@/lib/restaurant/rate-limit";
import { trackOrderSchema } from "@/lib/validations/restaurant";

/**
 * Looks up a guest's recent orders by mobile number — the fallback for a
 * guest on a different device or with cleared storage, who can't use the
 * localStorage-backed resume banner (see resume-order-banner.tsx).
 *
 * This is the sharpest enumeration surface left on the public API: a hit here
 * returns real order data, not just a name. Mitigated for the MVP by
 * requiring a well-formed mobile number, rate limiting on both the caller's
 * IP and the mobile number itself (so one number can't be hammered from many
 * IPs, and one IP can't sweep many numbers), and capping the response to the
 * 5 most recent orders. Revisit before real production traffic.
 */
export async function POST(req: Request) {
  const ipLimited = rateLimit({
    key: `track-order:${clientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipLimited.allowed) {
    return NextResponse.json(
      { error: "Too many lookups, try again shortly" },
      { status: 429, headers: { "Retry-After": String(ipLimited.retryAfterSeconds) } }
    );
  }

  const parsed = trackOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ orders: [] });
  }

  const mobile = normalizeMobile(parsed.data.mobile);
  if (!mobile) {
    return NextResponse.json({ orders: [] });
  }

  const mobileLimited = rateLimit({
    key: `track-order:mobile:${mobile}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!mobileLimited.allowed) {
    return NextResponse.json(
      { error: "Too many lookups, try again shortly" },
      { status: 429, headers: { "Retry-After": String(mobileLimited.retryAfterSeconds) } }
    );
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: parsed.data.restaurantSlug },
    select: { id: true },
  });
  if (!restaurant) {
    return NextResponse.json({ orders: [] });
  }

  // Scoped to this restaurant, same as the customer session: a guest's order
  // history at one venue is not shared with another.
  const customer = await db.restoCustomer.findUnique({
    where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile } },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await db.restoOrder.findMany({
    where: { customerId: customer.id },
    orderBy: { placedAt: "desc" },
    take: 5,
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, placedAt: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      statusUrl: getOrderStatusUrl(parsed.data.restaurantSlug, o.id),
    })),
  });
}
