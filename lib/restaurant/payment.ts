import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";

import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentGateway,
} from "@/lib/payment";

/**
 * Razorpay for the restaurant ordering module.
 *
 * PaymentGateway is imported as a *type only*, so this module reuses the
 * card product's payment contract without importing any of its runtime code
 * — the card checkout keeps running on its own mock gateway, untouched.
 *
 * Razorpay works in paise; every amount in this module's database is whole
 * rupees, so ×100 happens here and nowhere else.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/**
 * Whether this deployment can actually take an online payment. When false,
 * restaurants can't enable online payment and customers only ever see
 * "Pay at counter" — the demo degrades instead of failing at checkout.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

export function getRazorpayKeyId(): string | null {
  return KEY_ID ?? null;
}

let client: Razorpay | null = null;

function razorpay(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }
  if (!client) {
    client = new Razorpay({ key_id: KEY_ID!, key_secret: KEY_SECRET! });
  }
  return client;
}

/** Constant-time compare, so signature checks don't leak timing information. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Verifies the signature Razorpay Checkout hands back to the browser.
 * The signed payload is `<order_id>|<payment_id>`, keyed with the API secret.
 */
export function verifyCheckoutSignature({
  razorpayOrderId,
  razorpayPaymentId,
  signature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  if (!KEY_SECRET) return false;
  const expected = createHmac("sha256", KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

/**
 * Verifies a webhook. `rawBody` must be the exact bytes Razorpay sent — parse
 * the JSON only after this passes, or the HMAC won't match.
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

class RazorpayGateway implements PaymentGateway {
  async initiate({ purchaseId, amount }: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const order = await razorpay().orders.create({
      amount: amount * 100, // rupees → paise
      currency: "INR",
      receipt: purchaseId,
      notes: { orderId: purchaseId },
    });

    return {
      gatewayName: "razorpay",
      gatewayOrderId: order.id,
      clientPayload: {
        keyId: KEY_ID,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }

  async verifyAndConfirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    const verified =
      !!input.gatewayPaymentId &&
      !!input.signatureHeader &&
      verifyCheckoutSignature({
        razorpayOrderId: input.gatewayOrderId,
        razorpayPaymentId: input.gatewayPaymentId,
        signature: input.signatureHeader,
      });

    return {
      verified,
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.gatewayPaymentId,
    };
  }
}

export const restaurantPaymentGateway: PaymentGateway = new RazorpayGateway();
