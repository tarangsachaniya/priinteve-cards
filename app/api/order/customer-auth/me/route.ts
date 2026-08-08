import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/restaurant/customer-auth";

/**
 * Reports the caller's current customer session, scoped to one restaurant.
 *
 * The client only ever knows the current page's slug, never the restaurant
 * id sealed inside the cookie, so ?restaurantSlug= is resolved to an id
 * server-side and compared against session.restaurantId. A mismatch (the
 * cookie belongs to a *different* restaurant) reports no customer — this
 * comparison is what actually enforces the per-restaurant scope.
 */
export async function GET(req: Request) {
  const restaurantSlug = new URL(req.url).searchParams.get("restaurantSlug");

  const session = await getCustomerSession();
  if (!session || !restaurantSlug) {
    return NextResponse.json({ customer: null });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true },
  });
  if (!restaurant || restaurant.id !== session.restaurantId) {
    return NextResponse.json({ customer: null });
  }

  return NextResponse.json({ customer: { name: session.name, mobile: session.mobile } });
}
