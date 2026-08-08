"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, PackageSearch, X } from "lucide-react";
import type { RestoOrderStatus, RestoPaymentStatus } from "@prisma/client";

import { formatCurrency, formatDateTime } from "@/lib/format";
import { extractNationalDigits, INDIAN_MOBILE_REGEX } from "@/lib/restaurant/mobile";
import { ORDER_STATUS_CUSTOMER_LABEL } from "@/lib/restaurant/order-status";
import type { PublicRestaurant } from "@/components/order/types";

type TrackedOrder = {
  id: string;
  orderNumber: number;
  status: RestoOrderStatus;
  paymentStatus: RestoPaymentStatus;
  total: number;
  placedAt: string;
  statusUrl: string;
};

/**
 * No-login fallback for a guest who placed an order on a different device,
 * or whose local storage got cleared — so Task 1's resume banner has nothing
 * to show. Looks up recent orders by mobile number instead of a stored id.
 */
export function TrackOrderDialog({
  restaurant,
  onClose,
}: {
  restaurant: PublicRestaurant;
  onClose: () => void;
}) {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);

  const nationalDigits = extractNationalDigits(mobile);
  const mobileValid = INDIAN_MOBILE_REGEX.test(nationalDigits);
  const mobileTouched = mobile.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileValid) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug: restaurant.slug, mobile: nationalDigits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        setOrders(null);
        return;
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setError("Something went wrong. Please try again.");
      setOrders(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Track my order"
        className="relative flex max-h-[90vh] w-full flex-col overflow-hidden sm:max-w-sm sm:rounded-[var(--resto-radius-xl)]"
        style={{
          backgroundColor: "var(--resto-bg)",
          borderTopLeftRadius: "var(--resto-radius-xl)",
          borderTopRightRadius: "var(--resto-radius-xl)",
          boxShadow: "var(--resto-shadow-overlay)",
        }}
      >
        <header
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--resto-border)" }}
        >
          <div>
            <h2 className="resto-display text-xl font-semibold" style={{ color: "var(--resto-text)" }}>
              Track my order
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--resto-text-muted)" }}>
              Look up your recent orders by mobile number.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1 transition-opacity hover:opacity-70"
            style={{ color: "var(--resto-text-muted)" }}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="track-order-mobile"
                className="text-sm font-medium"
                style={{ color: "var(--resto-text)" }}
              >
                Mobile number
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-10 items-center px-3 text-sm"
                  style={{
                    backgroundColor: "var(--resto-surface-alt)",
                    borderRadius: "var(--resto-radius-md)",
                    color: "var(--resto-text-muted)",
                  }}
                >
                  +91
                </span>
                <input
                  id="track-order-mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={13}
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setOrders(null);
                    setError(null);
                  }}
                  aria-invalid={mobileTouched && !mobileValid}
                  className="h-10 w-full border px-3 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--resto-card)",
                    borderColor: "var(--resto-border)",
                    borderRadius: "var(--resto-radius-md)",
                    color: "var(--resto-text)",
                  }}
                />
              </div>
              {mobileTouched && !mobileValid && (
                <p className="text-xs" style={{ color: "var(--resto-error)" }}>
                  Enter a 10-digit number starting with 6, 7, 8 or 9.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!mobileValid || isLoading}
              className="resto-numeric flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--resto-brand-500)",
                color: "var(--on-brand)",
                borderRadius: "var(--resto-radius-full)",
              }}
            >
              {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isLoading ? "Searching…" : "Find my orders"}
            </button>
          </form>

          {error && (
            <p
              className="px-3 py-2 text-sm"
              role="alert"
              style={{
                backgroundColor: "var(--resto-error-soft)",
                borderRadius: "var(--resto-radius-md)",
                color: "var(--resto-error)",
              }}
            >
              {error}
            </p>
          )}

          {orders && orders.length === 0 && (
            <div
              className="flex flex-col items-center gap-2 border border-dashed py-8 text-center"
              style={{ borderColor: "var(--resto-border)", borderRadius: "var(--resto-radius-lg)" }}
            >
              <PackageSearch className="size-6" style={{ color: "var(--resto-text-subtle)" }} aria-hidden />
              <p className="text-sm" style={{ color: "var(--resto-text-muted)" }}>
                No recent orders found for this number.
              </p>
            </div>
          )}

          {orders && orders.length > 0 && (
            <ul className="flex flex-col gap-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={order.statusUrl}
                    className="flex flex-col gap-1 border px-3 py-2.5 transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: "var(--resto-card)",
                      borderColor: "var(--resto-border)",
                      borderRadius: "var(--resto-radius-md)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="resto-numeric text-sm font-semibold"
                        style={{ color: "var(--resto-text)" }}
                      >
                        Order #{order.orderNumber}
                      </span>
                      <span
                        className="resto-numeric text-sm font-medium"
                        style={{ color: "var(--resto-text)" }}
                      >
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span style={{ color: "var(--resto-text-muted)" }}>
                        {ORDER_STATUS_CUSTOMER_LABEL[order.status]}
                      </span>
                      <span style={{ color: "var(--resto-text-subtle)" }}>
                        {formatDateTime(order.placedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
