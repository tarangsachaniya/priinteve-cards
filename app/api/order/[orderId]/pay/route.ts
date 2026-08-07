import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getRazorpayKeyId,
  isRazorpayConfigured,
  restaurantPaymentGateway,
} from "@/lib/restaurant/payment";
import { settleOrderSchema } from "@/lib/validations/restaurant";

/**
 * The customer choosing how to pay, once the restaurant has closed the bill.
 *
 * UPI opens Razorpay Checkout (UPI is one of its methods, alongside cards and
 * netbanking, so one integration covers all of them). CASH records the
 * intention and hands the order to the counter.
 *
 * Only reachable while paymentStatus is REQUESTED. That single check is what
 * guarantees nobody is charged before the restaurant says the meal is over.
 */
export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const parsed = settleOrderSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a payment method" }, { status: 400 });
  }

  const order = await db.restoOrder.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      total: true,
      customerId: true,
      customerName: true,
      customerMobile: true,
      paymentStatus: true,
      razorpayOrderId: true,
      restaurant: {
        select: {
          name: true,
          onlinePaymentEnabled: true,
          counterPaymentEnabled: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
  }
  // PENDING means the restaurant has not closed the bill yet.
  if (order.paymentStatus !== "REQUESTED" && order.paymentStatus !== "FAILED") {
    return NextResponse.json(
      { error: "The restaurant hasn't asked for payment yet" },
      { status: 409 }
    );
  }

  if (parsed.data.method === "CASH") {
    if (!order.restaurant.counterPaymentEnabled) {
      return NextResponse.json({ error: "This restaurant doesn't take cash" }, { status: 400 });
    }

    // Stays REQUESTED: the money has not arrived, someone still has to take
    // it. The mode is what tells the counter to expect cash.
    const updated = await db.restoOrder.update({
      where: { id: order.id },
      data: { paymentMode: "COUNTER", paymentStatus: "REQUESTED" },
      select: { id: true, paymentStatus: true, paymentMode: true },
    });

    return NextResponse.json({ method: "CASH", order: updated });
  }

  if (!order.restaurant.onlinePaymentEnabled || !isRazorpayConfigured()) {
    return NextResponse.json({ error: "Online payment isn't available here" }, { status: 400 });
  }

  try {
    // Reuse the gateway order if one already exists. A guest who taps Pay,
    // backgrounds the app and comes back must not end up with two open
    // Razorpay orders for one bill.
    let gatewayOrderId = order.razorpayOrderId;

    if (!gatewayOrderId) {
      const gateway = await restaurantPaymentGateway.initiate({
        purchaseId: order.id,
        amount: order.total,
        userId: order.customerId,
      });
      gatewayOrderId = gateway.gatewayOrderId;

      await db.restoOrder.update({
        where: { id: order.id },
        data: { razorpayOrderId: gatewayOrderId, paymentMode: "ONLINE" },
      });
    } else {
      await db.restoOrder.update({
        where: { id: order.id },
        data: { paymentMode: "ONLINE" },
      });
    }

    return NextResponse.json({
      method: "UPI",
      razorpay: {
        keyId: getRazorpayKeyId(),
        orderId: gatewayOrderId,
        amount: order.total * 100,
        currency: "INR",
        restaurantName: order.restaurant.name,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
      },
    });
  } catch (err) {
    console.error("razorpay order creation failed", err);
    // The order is NOT cancelled here — unlike the old checkout flow, the food
    // has already been made and eaten. A gateway failure means "pay another
    // way", not "throw the order away".
    return NextResponse.json(
      { error: "Could not start the payment. Please try again or pay at the counter." },
      { status: 502 }
    );
  }
}
