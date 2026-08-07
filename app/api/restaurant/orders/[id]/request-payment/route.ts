import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

/**
 * Closes the bill: moves the order to REQUESTED, which is what makes the
 * payment screen appear on the customer's status page.
 *
 * This is the only way a customer is ever asked for money. Nothing charges
 * anyone at checkout any more — the guest orders, eats, and the restaurant
 * decides when the meal is over.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const order = await db.restoOrder.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "This order was cancelled" }, { status: 409 });
  }
  // Before the kitchen has accepted there is nothing to charge for, and a
  // guest asked to pay for an order that might still be rejected has a bad
  // time getting their money back.
  if (order.status === "PLACED") {
    return NextResponse.json(
      { error: "Accept the order before asking for payment" },
      { status: 409 }
    );
  }

  const updated = await db.restoOrder.update({
    where: { id: order.id },
    data: { paymentStatus: "REQUESTED", paymentRequestedAt: new Date() },
    select: { id: true, paymentStatus: true, paymentMode: true },
  });

  return NextResponse.json({ order: updated });
}
