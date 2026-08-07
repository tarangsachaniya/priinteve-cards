import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

/**
 * Records that cash was handed over at the counter.
 *
 * The manual settlement path, and the reason a restaurant with no Razorpay
 * keys is still a working restaurant rather than one whose orders can never
 * be closed.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const order = await db.restoOrder.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true, paymentStatus: true },
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
    data: { paymentStatus: "PAID", paymentMode: "COUNTER" },
    select: { id: true, paymentStatus: true, paymentMode: true },
  });

  return NextResponse.json({ order: updated });
}
