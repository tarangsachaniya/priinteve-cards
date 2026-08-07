import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/restaurant/payment";
import { verifyPaymentSchema } from "@/lib/validations/restaurant";

/**
 * Called by the browser right after Razorpay Checkout succeeds. The webhook
 * is the authoritative path — this one just lets the customer see a paid
 * order without waiting for the webhook to land. Both are idempotent.
 */
export async function POST(req: Request) {
  const parsed = verifyPaymentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: signature,
  } = parsed.data;

  const order = await db.restoOrder.findUnique({
    where: { razorpayOrderId },
    select: { id: true, paymentStatus: true, restaurant: { select: { slug: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ success: true, orderId: order.id });
  }

  const valid = verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature });

  if (!valid) {
    await db.restoOrder.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await db.restoOrder.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", razorpayPaymentId },
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
