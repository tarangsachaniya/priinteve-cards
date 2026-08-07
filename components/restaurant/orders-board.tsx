"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bike,
  Clock,
  IndianRupee,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
  Store,
  StickyNote,
} from "lucide-react";
import type { RestoOrderStatus, RestoOrderType } from "@prisma/client";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { formatMobile } from "@/lib/restaurant/mobile";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  nextStatus,
} from "@/lib/restaurant/order-status";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 8000;

const TYPE_ICON: Record<RestoOrderType, typeof Store> = {
  DINE_IN: Store,
  TAKE_AWAY: ShoppingBag,
  DELIVERY: Bike,
};

const COLUMNS: { status: RestoOrderStatus; hint: string }[] = [
  { status: "PLACED", hint: "Needs confirming" },
  { status: "ACCEPTED", hint: "Queued for the kitchen" },
  { status: "PREPARING", hint: "Being cooked" },
  { status: "READY", hint: "Waiting for pickup" },
];

export type BoardOrder = {
  id: string;
  orderNumber: number;
  status: RestoOrderStatus;
  type: RestoOrderType;
  /** Null until the customer picks cash or UPI on the payment screen. */
  paymentMode: "ONLINE" | "COUNTER" | null;
  paymentStatus: "PENDING" | "REQUESTED" | "PAID" | "FAILED" | "REFUNDED";
  customerName: string;
  customerMobile: string;
  tableLabel: string | null;
  total: number;
  note: string | null;
  deliveryAddress: string | null;
  deliveryPincode: string | null;
  pickupInMinutes: number | null;
  placedAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotal: number;
    variantName: string | null;
    addOns: string[];
  }[];
};

function minutesAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/**
 * The payment pill.
 *
 * Five states now, not two. The one that matters operationally is "Cash at
 * counter" — the customer has said they will pay in cash and is waiting for
 * someone to take it, which is a different job from an unpaid order nobody has
 * been asked about yet.
 */
function PaymentPill({ order }: { order: BoardOrder }) {
  const { paymentStatus, paymentMode } = order;

  const { label, tone } =
    paymentStatus === "PAID"
      ? { label: paymentMode === "COUNTER" ? "Paid · cash" : "Paid · UPI", tone: "bg-emerald-500/10 text-emerald-700" }
      : paymentStatus === "FAILED"
        ? { label: "Payment failed", tone: "bg-destructive/10 text-destructive" }
        : paymentStatus === "REFUNDED"
          ? { label: "Refunded", tone: "bg-muted text-muted-foreground" }
          : paymentStatus === "REQUESTED"
            ? paymentMode === "COUNTER"
              ? { label: "Cash at counter", tone: "bg-blue-500/10 text-blue-700" }
              : { label: "Awaiting payment", tone: "bg-violet-500/10 text-violet-700" }
            : { label: "Bill open", tone: "bg-amber-500/10 text-amber-700" };

  return <Badge className={cn("border-transparent", tone)}>{label}</Badge>;
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
  onRequestPayment,
  onMarkPaid,
  isBusy,
}: {
  order: BoardOrder;
  onAdvance: (order: BoardOrder) => void;
  onCancel: (order: BoardOrder) => void;
  onRequestPayment: (order: BoardOrder) => void;
  onMarkPaid: (order: BoardOrder) => void;
  isBusy: boolean;
}) {
  const TypeIcon = TYPE_ICON[order.type];
  const advanceTo = nextStatus(order.status);

  // The bill can be closed once the kitchen has accepted; before that there is
  // nothing to charge for yet.
  const canRequestPayment =
    order.paymentStatus === "PENDING" && order.status !== "PLACED";
  const canMarkPaid = order.paymentStatus === "REQUESTED" || order.paymentStatus === "FAILED";
  // Completing is gated on the money actually having arrived — cash included,
  // via "Mark paid" below — not just on the kitchen being done.
  const blockedByPayment = advanceTo === "COMPLETED" && order.paymentStatus !== "PAID";
  // A dine-in order with no table is a data problem the kitchen has to know
  // about — they have no way to deliver it.
  const missingTable = order.type === "DINE_IN" && !order.tableLabel;

  return (
    <Card className="border-border/80">
      <CardContent className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">#{order.orderNumber}</p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customerName} · {formatMobile(order.customerMobile)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {minutesAgo(order.placedAt)}
          </span>
        </div>

        {/* The table is the single most important routing fact on a dine-in
            ticket, so it gets its own line rather than competing with the
            other pills. */}
        {order.tableLabel ? (
          <p className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1.5 text-sm font-semibold text-ink">
            <Store className="size-4 shrink-0" />
            {order.tableLabel}
          </p>
        ) : (
          missingTable && (
            <p className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-2.5 py-1.5 text-sm font-semibold text-destructive">
              <Store className="size-4 shrink-0" />
              No table on a dine-in order
            </p>
          )
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <TypeIcon className="size-3" />
            {ORDER_TYPE_LABEL[order.type]}
          </Badge>
          <PaymentPill order={order} />
        </div>

        <ul className="flex flex-col gap-1 rounded-xl bg-muted/60 p-2 text-sm">
          {order.items.map((item) => {
            const options = [item.variantName, ...item.addOns].filter(Boolean).join(" · ");
            return (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="min-w-0">
                  <span className="truncate">
                    <span className="text-muted-foreground tabular-nums">{item.quantity}×</span>{" "}
                    {item.name}
                  </span>
                  {options && (
                    <span className="block truncate text-xs text-muted-foreground">{options}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(item.lineTotal)}
                </span>
              </li>
            );
          })}
        </ul>

        {order.note && (
          <p className="flex gap-1.5 rounded-xl bg-amber-500/10 p-2 text-xs text-amber-800">
            <StickyNote className="size-3.5 shrink-0" />
            {order.note}
          </p>
        )}

        {order.deliveryAddress && (
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {order.deliveryAddress}
            {order.deliveryPincode ? `, ${order.deliveryPincode}` : ""}
          </p>
        )}

        {order.pickupInMinutes !== null && (
          <p className="text-xs text-muted-foreground">
            Pickup: {order.pickupInMinutes === 0 ? "ASAP" : `in ${order.pickupInMinutes} min`}
          </p>
        )}

        {(canRequestPayment || canMarkPaid) && (
          <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
            {canRequestPayment && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={isBusy}
                onClick={() => onRequestPayment(order)}
              >
                <IndianRupee data-icon="inline-start" />
                Request payment
              </Button>
            )}
            {canMarkPaid && (
              <Button type="button" variant="outline" size="xs" disabled={isBusy} onClick={() => onMarkPaid(order)}>
                Mark paid (cash)
              </Button>
            )}
          </div>
        )}

        {blockedByPayment && (
          <p className="rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-800">
            Mark paid to complete
          </p>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <span className="font-semibold tabular-nums">{formatCurrency(order.total)}</span>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isBusy}
              onClick={() => onCancel(order)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              render={<a href={`tel:${order.customerMobile}`} aria-label="Call customer" />}
            >
              <Phone />
            </Button>
            {advanceTo && (
              <Button
                type="button"
                size="xs"
                disabled={isBusy || blockedByPayment}
                title={blockedByPayment ? "Mark this order paid before completing it" : undefined}
                onClick={() => onAdvance(order)}
              >
                {advanceTo === "ACCEPTED"
                  ? "Accept"
                  : advanceTo === "PREPARING"
                    ? "Start cooking"
                    : advanceTo === "READY"
                      ? "Mark ready"
                      : "Complete"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdersBoard({ initialOrders }: { initialOrders: BoardOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const knownIds = useRef(new Set(initialOrders.map((o) => o.id)));

  /**
   * Built from the live orders rather than from the table list, so the filter
   * only ever offers tables that currently have something on them. A dropdown
   * of sixty tables, fifty-eight of them empty, is not a filter.
   */
  const tablesInPlay = Array.from(
    new Set(orders.map((order) => order.tableLabel).filter((label): label is string => !!label))
  ).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

  const visibleOrders =
    tableFilter === "all"
      ? orders
      : orders.filter((order) => order.tableLabel === tableFilter);

  const refresh = useCallback(async (announce: boolean) => {
    try {
      const res = await fetch("/api/restaurant/orders?scope=live", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const fetched: BoardOrder[] = data.orders;

      if (announce) {
        const fresh = fetched.filter((order) => !knownIds.current.has(order.id));
        if (fresh.length > 0) {
          toast.success(
            fresh.length === 1
              ? `New order #${fresh[0].orderNumber}`
              : `${fresh.length} new orders`
          );
        }
      }

      knownIds.current = new Set(fetched.map((o) => o.id));
      setOrders(fetched);
    } catch {
      // Transient failures are fine — the next tick retries.
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => refresh(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function updateStatus(order: BoardOrder, status: RestoOrderStatus, cancelReason?: string) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not update the order");
        return;
      }

      if (status === "COMPLETED" || status === "CANCELLED") {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        knownIds.current.delete(order.id);
      } else {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      }
    } finally {
      setBusyId(null);
    }
  }

  function advance(order: BoardOrder) {
    const next = nextStatus(order.status);
    if (next) updateStatus(order, next);
  }

  function cancel(order: BoardOrder) {
    const reason = prompt(`Why is order #${order.orderNumber} being cancelled?`);
    if (reason === null) return;
    updateStatus(order, "CANCELLED", reason.trim() || undefined);
  }

  /**
   * Closing the bill and settling it are two separate endpoints because they
   * are two separate decisions: the first opens the customer's payment screen,
   * the second records that money actually arrived.
   */
  async function callPaymentAction(order: BoardOrder, action: "request-payment" | "mark-paid") {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}/${action}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not update the payment");
        return;
      }

      toast.success(
        action === "request-payment"
          ? `Payment screen opened for #${order.orderNumber}`
          : `#${order.orderNumber} marked paid`
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, paymentStatus: data.order.paymentStatus, paymentMode: data.order.paymentMode }
            : o
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function manualRefresh() {
    setIsRefreshing(true);
    await refresh(false);
    setIsRefreshing(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Updating automatically every {POLL_INTERVAL_MS / 1000} seconds.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={manualRefresh} disabled={isRefreshing}>
          <RefreshCw data-icon="inline-start" className={cn(isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {tablesInPlay.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Table</span>
          {["all", ...tablesInPlay].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setTableFilter(label)}
              aria-pressed={tableFilter === label}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                tableFilter === label
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {label === "all" ? "All" : label}
            </button>
          ))}
        </div>
      )}

      {visibleOrders.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-ink">
              <Store className="size-6" />
            </span>
            <p className="font-medium">
              {tableFilter === "all" ? "No live orders" : `Nothing open on ${tableFilter}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {tableFilter === "all"
                ? "New orders appear here the moment a customer places one."
                : "Switch back to All to see the rest of the board."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnOrders = visibleOrders.filter((order) => order.status === column.status);

            return (
              <section key={column.status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-full bg-card px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      ORDER_STATUS_BADGE[column.status]
                    )}
                  >
                    {ORDER_STATUS_LABEL[column.status]}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {columnOrders.length}
                  </span>
                </div>

                {columnOrders.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {column.hint}
                  </p>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={advance}
                      onCancel={cancel}
                      onRequestPayment={(o) => callPaymentAction(o, "request-payment")}
                      onMarkPaid={(o) => callPaymentAction(o, "mark-paid")}
                      isBusy={busyId === order.id}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
