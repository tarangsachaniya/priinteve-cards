import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { clientIp, rateLimit } from "@/lib/restaurant/rate-limit";
import { customerLookupSchema } from "@/lib/validations/restaurant";

/**
 * Prefills a returning customer's name from their mobile number.
 *
 * This is an enumeration surface by nature — someone could probe numbers to
 * learn names. Three mitigations for the MVP: the number must be well formed,
 * the response carries nothing but a name (never orders or history), and
 * lookups are rate limited per IP. Revisit before real production traffic.
 */
export async function POST(req: Request) {
  const limited = rateLimit({
    key: `customer-lookup:${clientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many lookups, try again shortly" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = customerLookupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ customer: null });
  }

  const mobile = normalizeMobile(parsed.data.mobile);
  if (!mobile) {
    return NextResponse.json({ customer: null });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: parsed.data.restaurantSlug },
    select: { id: true },
  });
  if (!restaurant) {
    return NextResponse.json({ customer: null });
  }

  // Scoped to this restaurant: a guest's name is not shared across venues.
  const customer = await db.restoCustomer.findUnique({
    where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile } },
    select: { name: true },
  });

  return NextResponse.json({ customer: customer ? { name: customer.name } : null });
}
