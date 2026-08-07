import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/restaurant/payment";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the authoritative record of whether an order was paid.
 *
 * Two things matter here:
 *  1. The signature is computed over the *raw* body, so we read req.text()
 *     and only parse afterwards. Parsing first and re-stringifying would
 *     change the bytes and break the HMAC.
 *  2. Razorpay retries, so every branch must be idempotent — a repeat
 *     delivery for an order that's already PAID is a no-op, not an error.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entity = payload.payload?.payment?.entity;
  const razorpayOrderId = entity?.order_id;
  const razorpayPaymentId = entity?.id;

  if (!razorpayOrderId) {
    // Not an event we act on — acknowledge so Razorpay stops retrying.
    return NextResponse.json({ received: true });
  }

  const order = await db.restoOrder.findUnique({
    where: { razorpayOrderId },
    select: { id: true, paymentStatus: true },
  });
  if (!order) {
    return NextResponse.json({ received: true });
  }

  if (payload.event === "payment.captured" || payload.event === "order.paid") {
    if (order.paymentStatus !== "PAID") {
      await db.restoOrder.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", razorpayPaymentId: razorpayPaymentId ?? undefined },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (payload.event === "payment.failed" && order.paymentStatus === "PENDING") {
    await db.restoOrder.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
