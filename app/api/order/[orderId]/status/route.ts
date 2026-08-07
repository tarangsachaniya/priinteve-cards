import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Polled by the customer's status page. The order id is a cuid, which is
 * unguessable in practice, and the response carries only what the person who
 * placed the order already knows.
 */
export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const order = await db.restoOrder.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMode: true,
      total: true,
      cancelReason: true,
      acceptedAt: true,
      preparingAt: true,
      readyAt: true,
      completedAt: true,
      // Drives whether the page offers the review prompt or the thank-you.
      review: { select: { id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { review, ...rest } = order;
  return NextResponse.json({ order: { ...rest, hasReview: review !== null } });
}
