import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/restaurant/customer-auth";

/** Enough to fill the strip; beyond that it stops being a shortcut. */
const FAVOURITE_LIMIT = 8;

/**
 * The dishes this guest orders most at this restaurant.
 *
 * Personal, so it cannot come down with the page the way the trending strip
 * does — that payload is shared by every guest and cached. This is fetched
 * after the session resolves, from the signed cookie, exactly as
 * /customer-auth/orders is: the mobile never comes from the client, so a
 * caller can only ever read their own history and there is nothing to
 * enumerate.
 *
 * Scoping is enforced the same way as in the /me route: the client knows the
 * page slug, never the restaurant id sealed in the cookie, so the slug is
 * resolved server-side and compared against session.restaurantId.
 */
export async function GET(req: Request) {
  const restaurantSlug = new URL(req.url).searchParams.get("restaurantSlug");

  const session = await getCustomerSession();
  if (!session || !restaurantSlug) {
    return NextResponse.json({ itemIds: [] });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true },
  });
  if (!restaurant || restaurant.id !== session.restaurantId) {
    return NextResponse.json({ itemIds: [] });
  }

  const customer = await db.restoCustomer.findUnique({
    where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile: session.mobile } },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ itemIds: [] });
  }

  const rows = await db.restoOrderItem.groupBy({
    by: ["menuItemId"],
    where: {
      // Cancelled orders are excluded: a dish someone never received is not
      // one they order often, and for a cancelled-by-the-kitchen order it is
      // the opposite of a dish worth suggesting again.
      order: { customerId: customer.id, status: { not: "CANCELLED" } },
      menuItemId: { not: null },
    },
    // Counted by how many separate orders it appeared in, not by quantity
    // summed. Someone who orders one sandwich every week has a habit; someone
    // who ordered eight for an office lunch once does not, and quantity would
    // rank the second above the first.
    _count: { orderId: true },
    orderBy: { _count: { orderId: "desc" } },
    take: FAVOURITE_LIMIT,
  });

  return NextResponse.json({
    // Ids only. Prices, availability and options come from the live menu the
    // page already holds, so a favourite can never render stale.
    itemIds: rows.map((row) => row.menuItemId).filter((id): id is string => id !== null),
  });
}
