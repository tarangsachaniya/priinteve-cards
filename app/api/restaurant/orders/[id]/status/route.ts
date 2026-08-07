import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { canTransition, isSettled, timestampFieldFor } from "@/lib/restaurant/order-status";
import { orderStatusUpdateSchema } from "@/lib/validations/restaurant";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = orderStatusUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const order = await db.restoOrder.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { id: true, status: true, paymentMode: true, paymentStatus: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status, cancelReason } = parsed.data;

  // The transition map is the authority — no jumping from PLACED straight to
  // COMPLETED, and nothing moves out of a terminal state.
  if (!canTransition(order.status, status)) {
    return NextResponse.json(
      { error: `An order that is ${order.status.toLowerCase()} can't move to ${status.toLowerCase()}` },
      { status: 409 }
    );
  }

  // Payment is no longer inferred from the kitchen status. Completing an order
  // used to silently mark a counter order paid; now money is only ever
  // recorded by the customer paying or the owner confirming cash, because
  // "the food went out" and "we were paid" are genuinely different facts.
  // But the reverse still holds: an order can't be marked complete until that
  // separate fact — payment — is actually settled.
  if (status === "COMPLETED" && !isSettled(order.paymentStatus)) {
    return NextResponse.json(
      { error: "Mark this order paid before completing it" },
      { status: 409 }
    );
  }

  const timestampField = timestampFieldFor(status);
  const data: Prisma.RestoOrderUpdateInput = {
    status,
    ...(timestampField ? { [timestampField]: new Date() } : {}),
    ...(status === "CANCELLED" && cancelReason ? { cancelReason } : {}),
  };

  const updated = await db.restoOrder.update({ where: { id: order.id }, data });

  return NextResponse.json({
    order: { id: updated.id, status: updated.status, paymentStatus: updated.paymentStatus },
  });
}
