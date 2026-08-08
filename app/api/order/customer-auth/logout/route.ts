import { NextResponse } from "next/server";

import { clearCustomerSession } from "@/lib/restaurant/customer-auth";

/**
 * Clears the caller's own customer-session cookie. No rate limit: this is
 * idempotent and has no side effect beyond the cookie in the requester's own
 * browser, unlike the login route which can create a RestoCustomer row.
 */
export async function POST() {
  clearCustomerSession();
  return NextResponse.json({ ok: true });
}
