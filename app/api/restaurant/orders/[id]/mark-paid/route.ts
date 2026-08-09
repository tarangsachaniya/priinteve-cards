import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

/**
 * A staff member confirming the money arrived.
 *
 * The manual settlement path, and the reason a restaurant with no Razorpay
 * keys is still a working restaurant rather than one whose orders can never
 * be closed. It covers both gateway-less methods: notes handed over at the
 * counter, and a UPI transfer the staff member has seen land.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const order = await db.restoOrder.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true, paymentStatus: true, paymentMode: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.paymentStatus === "PAID") {
    // Idempotent: two staff tapping the same button must not be an error.
    const current = await db.restoOrder.findUnique({
      where: { id: order.id },
      select: { id: true, paymentStatus: true, paymentMode: true },
    });
    return NextResponse.json({ order: current });
  }

  const updated = await db.restoOrder.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      // A guest who chose UPI QR already told us how they were paying, and
      // overwriting that with COUNTER would file a bank credit as cash — which
      // is precisely the distinction the till report exists to make. COUNTER
      // is only assumed when nothing was chosen, which is the walk-up case.
      paymentMode: order.paymentMode === "UPI_QR" ? "UPI_QR" : "COUNTER",
    },
    select: { id: true, paymentStatus: true, paymentMode: true },
  });

  return NextResponse.json({ order: updated });
}
