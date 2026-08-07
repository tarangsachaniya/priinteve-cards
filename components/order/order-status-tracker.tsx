"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleX, Clock, Loader2 } from "lucide-react";
import type { RestoOrderStatus, RestoPaymentStatus } from "@prisma/client";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_CUSTOMER_LABEL,
  ORDER_STATUS_FLOW,
  ORDER_TYPE_LABEL,
} from "@/lib/restaurant/order-status";
import { PaidReceipt, PaymentPanel } from "@/components/order/payment-panel";
import { PlatformCredit } from "@/components/order/platform-credit";
import { ReviewPrompt } from "@/components/order/review-prompt";

const POLL_INTERVAL_MS = 8000;

const STATUS_HINT: Record<RestoOrderStatus, string> = {
  PLACED: "Waiting for the restaurant to confirm.",
  ACCEPTED: "The restaurant has your order.",
  PREPARING: "Your food is being cooked.",
  READY: "Ready — collect it or wait to be served.",
  COMPLETED: "Enjoy your meal.",
  CANCELLED: "This order was cancelled.",
};

export type StatusOrder = {
  id: string;
  orderNumber: number;
  status: RestoOrderStatus;
  paymentStatus: RestoPaymentStatus;
  paymentMode: "ONLINE" | "COUNTER" | null;
  type: "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
  tableLabel: string | null;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  cancelReason: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotal: number;
    variantName: string | null;
    addOns: string[];
  }[];
  restaurantName: string;
  restaurantSlug: string;
  brandColor: string;
  canPayOnline: boolean;
  canPayCash: boolean;
  hasReview: boolean;
};

export function OrderStatusTracker({ order: initialOrder }: { order: StatusOrder }) {
  const [status, setStatus] = useState(initialOrder.status);
  const [paymentStatus, setPaymentStatus] = useState(initialOrder.paymentStatus);
  const [paymentMode, setPaymentMode] = useState(initialOrder.paymentMode);
  const [cancelReason, setCancelReason] = useState(initialOrder.cancelReason);
  const [hasReview, setHasReview] = useState(initialOrder.hasReview);

  const isPaid = paymentStatus === "PAID";
  const isCancelled = status === "CANCELLED";

  /**
   * Polling continues after the kitchen is done, which it did not used to.
   * The interesting events now happen *after* COMPLETED — the restaurant
   * closing the bill, and the counter confirming cash — so stopping at a
   * terminal kitchen status would leave the guest staring at a screen that
   * never opens its payment panel.
   */
  const settled = isCancelled || (isPaid && hasReview);

  useEffect(() => {
    if (settled) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/${initialOrder.id}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.order.status);
        setPaymentStatus(data.order.paymentStatus);
        setPaymentMode(data.order.paymentMode);
        setCancelReason(data.order.cancelReason);
        setHasReview(data.order.hasReview);
      } catch {
        // A dropped poll is harmless — the next tick will catch up.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [initialOrder.id, settled]);

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  const awaitingPayment = paymentStatus === "REQUESTED" || paymentStatus === "FAILED";

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-4 py-8"
      style={{ backgroundColor: "var(--resto-bg)" }}
    >
      <header className="text-center">
        <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
          {initialOrder.restaurantName}
        </p>
        <h1 className="resto-display text-2xl font-bold" style={{ color: "var(--resto-text)" }}>
          Order #{initialOrder.orderNumber}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--resto-text-muted)" }}>
          {ORDER_TYPE_LABEL[initialOrder.type]}
          {initialOrder.tableLabel ? ` · ${initialOrder.tableLabel}` : ""}
        </p>
      </header>

      {/* Payment first once it is due: it is the only thing on this page the
          guest still has to act on. */}
      {!isCancelled && awaitingPayment && (
        <PaymentPanel
          orderId={initialOrder.id}
          total={initialOrder.total}
          brandColor={initialOrder.brandColor}
          restaurantName={initialOrder.restaurantName}
          canPayOnline={initialOrder.canPayOnline}
          canPayCash={initialOrder.canPayCash}
          paymentMode={paymentMode}
          onPaid={() => {
            setPaymentStatus("PAID");
            setPaymentMode((mode) => mode);
          }}
        />
      )}

      {!isCancelled && isPaid && <PaidReceipt total={initialOrder.total} mode={paymentMode} />}

      {!isCancelled && isPaid && !hasReview && (
        <ReviewPrompt orderId={initialOrder.id} onSubmitted={() => setHasReview(true)} />
      )}

      {isCancelled ? (
        <div
          className="flex flex-col items-center gap-2 border p-6 text-center"
          style={{
            backgroundColor: "var(--resto-error-soft)",
            borderColor: "var(--resto-error)",
            borderRadius: "var(--resto-radius-lg)",
          }}
        >
          <CircleX className="size-8" style={{ color: "var(--resto-error)" }} aria-hidden />
          <p className="resto-display font-semibold" style={{ color: "var(--resto-text)" }}>
            Order cancelled
          </p>
          {cancelReason && (
            <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
              {cancelReason}
            </p>
          )}
        </div>
      ) : (
        <ol
          className="flex flex-col gap-0 border p-5"
          style={{
            backgroundColor: "var(--resto-card)",
            borderColor: "var(--resto-border)",
            borderRadius: "var(--resto-radius-lg)",
          }}
        >
          {ORDER_STATUS_FLOW.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;

            return (
              <li key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                    style={{
                      backgroundColor: done
                        ? "var(--resto-success)"
                        : active
                          ? "var(--resto-brand-500)"
                          : "transparent",
                      borderColor: done
                        ? "transparent"
                        : active
                          ? "var(--resto-brand-500)"
                          : "var(--resto-border)",
                      color: done ? "#fff" : active ? "var(--on-brand)" : "var(--resto-text-subtle)",
                    }}
                  >
                    {done ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : active ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Clock className="size-3.5" aria-hidden />
                    )}
                  </span>
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <span
                      className="my-1 w-0.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: done ? "var(--resto-success)" : "var(--resto-border)",
                      }}
                    />
                  )}
                </div>
                <div className={cn("pb-6", index === ORDER_STATUS_FLOW.length - 1 && "pb-0")}>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: done || active ? "var(--resto-text)" : "var(--resto-text-muted)",
                    }}
                  >
                    {ORDER_STATUS_CUSTOMER_LABEL[step]}
                  </p>
                  {active && (
                    <p className="text-xs" style={{ color: "var(--resto-text-muted)" }}>
                      {STATUS_HINT[step]}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <section
        className="border p-5"
        style={{
          backgroundColor: "var(--resto-card)",
          borderColor: "var(--resto-border)",
          borderRadius: "var(--resto-radius-lg)",
        }}
      >
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--resto-text-muted)" }}
        >
          Order summary
        </h2>
        <ul className="flex flex-col gap-2">
          {initialOrder.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="resto-numeric" style={{ color: "var(--resto-text-muted)" }}>
                  {item.quantity}×
                </span>{" "}
                <span style={{ color: "var(--resto-text)" }}>{item.name}</span>
                {(item.variantName || item.addOns.length > 0) && (
                  <span className="block text-xs" style={{ color: "var(--resto-text-muted)" }}>
                    {[item.variantName, ...item.addOns].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <span className="resto-numeric shrink-0" style={{ color: "var(--resto-text)" }}>
                {formatCurrency(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <div
          className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm"
          style={{ borderColor: "var(--resto-border)" }}
        >
          <SummaryRow label="Item total" value={initialOrder.subtotal} />
          {initialOrder.taxAmount > 0 && <SummaryRow label="Tax" value={initialOrder.taxAmount} />}
          {initialOrder.deliveryFee > 0 && (
            <SummaryRow label="Delivery fee" value={initialOrder.deliveryFee} />
          )}
          <div className="flex items-baseline justify-between font-semibold">
            <span style={{ color: "var(--resto-text)" }}>Grand total</span>
            <span className="resto-numeric resto-display" style={{ color: "var(--resto-text)" }}>
              {formatCurrency(initialOrder.total)}
            </span>
          </div>
        </div>

        {!isPaid && !awaitingPayment && !isCancelled && (
          <p
            className="mt-3 px-3 py-1.5 text-center text-xs font-medium"
            style={{
              backgroundColor: "var(--resto-surface-alt)",
              borderRadius: "var(--resto-radius-full)",
              color: "var(--resto-text-muted)",
            }}
          >
            Pay after your meal — the restaurant will open your bill here.
          </p>
        )}
      </section>

      <Link
        href={`/order/${initialOrder.restaurantSlug}`}
        className="self-center border px-4 py-2 text-sm font-medium transition-colors"
        style={{
          borderColor: "var(--resto-border)",
          borderRadius: "var(--resto-radius-full)",
          color: "var(--resto-text)",
        }}
      >
        Order something else
      </Link>

      <PlatformCredit />
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ color: "var(--resto-text-muted)" }}>{label}</span>
      <span className="resto-numeric" style={{ color: "var(--resto-text)" }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
