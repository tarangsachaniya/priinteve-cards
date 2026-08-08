import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { issueCustomerSession } from "@/lib/restaurant/customer-auth";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { clientIp, rateLimit } from "@/lib/restaurant/rate-limit";
import { customerAuthLoginSchema } from "@/lib/validations/restaurant";

/**
 * "Log in with just your mobile number" — no OTP. Whoever POSTs a number
 * gets a session for it (see the file-top comment on
 * lib/restaurant/customer-auth.ts for what that does and doesn't authorize).
 * Without an OTP step, rate limiting is the only defense against someone
 * mass-claiming identities under numbers they don't own, so this limits both
 * the caller's IP and the mobile number itself — same dual-limit shape as
 * app/api/order/track/route.ts.
 */
export async function POST(req: Request) {
  const ipLimited = rateLimit({
    key: `customer-login:${clientIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipLimited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, try again shortly" },
      { status: 429, headers: { "Retry-After": String(ipLimited.retryAfterSeconds) } }
    );
  }

  const parsed = customerAuthLoginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid mobile number" },
      { status: 400 }
    );
  }

  const mobile = normalizeMobile(parsed.data.mobile);
  if (!mobile) {
    return NextResponse.json({ error: "Enter a valid mobile number" }, { status: 400 });
  }

  const mobileLimited = rateLimit({
    key: `customer-login:mobile:${mobile}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!mobileLimited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, try again shortly" },
      { status: 429, headers: { "Retry-After": String(mobileLimited.retryAfterSeconds) } }
    );
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug: parsed.data.restaurantSlug },
    select: { id: true, isActive: true },
  });
  if (!restaurant || !restaurant.isActive) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const existing = await db.restoCustomer.findUnique({
    where: { restaurantId_mobile: { restaurantId: restaurant.id, mobile } },
  });

  let customer: { id: string; name: string };

  if (existing) {
    // Use the stored name, ignoring any name in the request body — a login
    // call must not be able to silently rename someone.
    customer = { id: existing.id, name: existing.name };
  } else {
    const name = parsed.data.name;
    if (!name) {
      return NextResponse.json({ error: "Enter your name" }, { status: 400 });
    }

    // Deliberately not place/route.ts's upsert: that one always bumps
    // orderCount/lastOrderAt as if an order was just placed. Logging in
    // isn't placing an order, so this customer starts with no order history.
    const created = await db.restoCustomer.create({
      data: {
        restaurantId: restaurant.id,
        mobile,
        name,
        orderCount: 0,
        lastOrderAt: null,
      },
    });
    customer = { id: created.id, name: created.name };
  }

  await issueCustomerSession({
    customerId: customer.id,
    restaurantId: restaurant.id,
    mobile,
    name: customer.name,
  });

  return NextResponse.json({ customer: { name: customer.name, mobile } });
}
