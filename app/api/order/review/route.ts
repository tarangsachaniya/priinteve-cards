import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/restaurant/rate-limit";
import { reviewCreateSchema } from "@/lib/validations/restaurant";

/**
 * A guest rating their meal, after their bill was paid.
 *
 * Two rules make the rating mean something, and both are enforced here rather
 * than in the UI:
 *
 *   1. The order must be PAID. An unpaid order is not proof anyone ate.
 *   2. One review per order, held by a unique index on orderId — so a
 *      restaurant cannot manufacture a rating without manufacturing paid
 *      orders, and a guest cannot pile on after a bad night.
 */
export async function POST(req: Request) {
  const limited = rateLimit({ key: `review:${clientIp(req)}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, try again shortly" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = reviewCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your review" },
      { status: 400 }
    );
  }

  const { orderId, rating, comment } = parsed.data;

  const order = await db.restoOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      restaurantId: true,
      customerName: true,
      paymentStatus: true,
      review: { select: { id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "You can leave a review once the bill is paid" },
      { status: 409 }
    );
  }
  if (order.review) {
    return NextResponse.json({ error: "You've already reviewed this order" }, { status: 409 });
  }

  const review = await db.restoReview.create({
    data: {
      restaurantId: order.restaurantId,
      orderId: order.id,
      customerName: order.customerName,
      rating,
      comment: comment?.trim() || null,
    },
    select: { id: true, rating: true },
  });

  return NextResponse.json({ review });
}
