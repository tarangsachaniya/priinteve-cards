"use client";

import { useState } from "react";
import Script from "next/script";
import { Banknote, Check, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * How a guest settles their bill, shown once the restaurant closes it.
 *
 * UPI goes through Razorpay Checkout, which offers UPI alongside cards and
 * netbanking — one integration, and the guest picks their app inside it.
 * Cash tells the counter to expect money and then waits: the panel keeps
 * showing "show this at the counter" until a staff member confirms receipt,
 * because the guest saying they will pay is not the same as having paid.
 *
 * Both options are gated on the restaurant's own settings, so a place that
 * only takes cash never shows a UPI button that would fail.
 */
export function PaymentPanel({
  orderId,
  total,
  brandColor,
  restaurantName,
  canPayOnline,
  canPayCash,
  paymentMode,
  onPaid,
}: {
  orderId: string;
  total: number;
  brandColor: string;
  restaurantName: string;
  canPayOnline: boolean;
  canPayCash: boolean;
  /** Set once the guest has declared cash; drives the waiting state. */
  paymentMode: "ONLINE" | "COUNTER" | null;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState<"UPI" | "CASH" | null>(null);
  const cashDeclared = paymentMode === "COUNTER";

  async function choose(method: "UPI" | "CASH") {
    setBusy(method);
    try {
      const res = await fetch(`/api/order/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not start the payment");
        return;
      }

      if (method === "CASH") {
        toast.success("Let the counter know — they'll confirm your payment.");
        onPaid();
        return;
      }

      openRazorpay(data.razorpay);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function openRazorpay(razorpay: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    customerName: string;
    customerMobile: string;
  }) {
    if (!window.Razorpay) {
      toast.error("Payment could not start. Please try again or pay at the counter.");
      return;
    }

    const checkout = new window.Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: restaurantName,
      description: "Food order",
      order_id: razorpay.orderId,
      prefill: { name: razorpay.customerName, contact: razorpay.customerMobile },
      theme: { color: brandColor },
      handler: async (response: RazorpayHandlerResponse) => {
        const verify = await fetch("/api/order/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (!verify.ok) {
          // The webhook is the authoritative path and will land shortly, so
          // this is a "wait", not a "failed".
          toast.error("We couldn't confirm your payment yet. The restaurant will follow up.");
        } else {
          toast.success("Payment received. Thank you!");
        }
        onPaid();
      },
      modal: {
        ondismiss: () => toast.info("Payment cancelled — you can still pay at the counter."),
      },
    });

    checkout.open();
  }

  if (cashDeclared) {
    return (
      <section
        className="flex flex-col items-center gap-2 border p-5 text-center"
        style={{
          backgroundColor: "var(--resto-surface)",
          borderColor: "var(--resto-border)",
          borderRadius: "var(--resto-radius-lg)",
        }}
      >
        <span
          className="grid size-12 place-items-center rounded-full"
          style={{ backgroundColor: "var(--resto-brand-tint)" }}
        >
          <Banknote className="size-6" style={{ color: "var(--resto-brand-text)" }} aria-hidden />
        </span>
        <p className="resto-display text-lg font-semibold" style={{ color: "var(--resto-text)" }}>
          Show this at the counter
        </p>
        <p className="resto-numeric text-2xl font-bold" style={{ color: "var(--resto-text)" }}>
          {formatCurrency(total)}
        </p>
        <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
          This screen updates automatically once the restaurant confirms your payment.
        </p>
        {canPayOnline && (
          <button
            type="button"
            onClick={() => choose("UPI")}
            disabled={busy !== null}
            className="mt-1 text-xs font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--resto-brand-text)" }}
          >
            Pay by UPI instead
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      {canPayOnline && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      )}

      <section
        className="flex flex-col gap-4 border p-5"
        style={{
          backgroundColor: "var(--resto-surface)",
          borderColor: "var(--resto-brand-tint-border)",
          borderRadius: "var(--resto-radius-lg)",
        }}
      >
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
            Your bill is ready
          </p>
          <p
            className="resto-display resto-numeric text-3xl font-bold"
            style={{ color: "var(--resto-text)" }}
          >
            {formatCurrency(total)}
          </p>
        </div>

        {!canPayOnline && !canPayCash ? (
          <p className="text-center text-sm" style={{ color: "var(--resto-text-muted)" }}>
            Please settle with the restaurant directly.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {canPayOnline && (
              <button
                type="button"
                onClick={() => choose("UPI")}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: "var(--resto-brand-500)",
                  color: "var(--on-brand)",
                  borderRadius: "var(--resto-radius-full)",
                }}
              >
                {busy === "UPI" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Smartphone className="size-4" aria-hidden />
                )}
                Pay by UPI
              </button>
            )}
            {canPayCash && (
              <button
                type="button"
                onClick={() => choose("CASH")}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 border py-3 text-sm font-semibold transition-colors disabled:opacity-60"
                style={{
                  borderColor: "var(--resto-border)",
                  color: "var(--resto-text)",
                  borderRadius: "var(--resto-radius-full)",
                }}
              >
                {busy === "CASH" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Banknote className="size-4" aria-hidden />
                )}
                Pay by cash
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}

/** The receipt state, once money has actually arrived. */
export function PaidReceipt({ total, mode }: { total: number; mode: "ONLINE" | "COUNTER" | null }) {
  return (
    <section
      className="flex flex-col items-center gap-2 border p-5 text-center"
      style={{
        backgroundColor: "var(--resto-success-soft)",
        borderColor: "var(--resto-success)",
        borderRadius: "var(--resto-radius-lg)",
      }}
    >
      <span
        className="grid size-12 place-items-center rounded-full"
        style={{ backgroundColor: "var(--resto-success)" }}
      >
        <Check className="size-6 text-white" aria-hidden />
      </span>
      <p className="resto-display text-lg font-semibold" style={{ color: "var(--resto-text)" }}>
        Paid
      </p>
      <p className="resto-numeric text-2xl font-bold" style={{ color: "var(--resto-text)" }}>
        {formatCurrency(total)}
      </p>
      <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
        {mode === "COUNTER" ? "Paid in cash at the counter." : "Paid online. Thank you!"}
      </p>
    </section>
  );
}
