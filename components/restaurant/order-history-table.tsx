"use client";

import type { RestoOrderStatus, RestoOrderType, RestoPaymentStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { formatMobile } from "@/lib/restaurant/mobile";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/restaurant/order-status";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type HistoryRow = {
  id: string;
  orderNumber: number;
  status: RestoOrderStatus;
  type: RestoOrderType;
  paymentStatus: RestoPaymentStatus;
  customerName: string;
  customerMobile: string;
  tableLabel: string | null;
  total: number;
  placedAt: string;
  cancelReason: string | null;
  items: { id: string; name: string; quantity: number; variantName: string | null }[];
};

/**
 * Past orders as a table rather than the board's cards: a closed order has no
 * actions left to take, and a table is what actually scans on the desktop
 * screens restaurants run this on.
 */
export function OrderHistoryTable({
  rows,
  page,
  totalPages,
  currentParams,
  onNavigate,
}: {
  rows: HistoryRow[];
  page: number;
  totalPages: number;
  /** The filters currently in the URL, so paging preserves them. */
  currentParams: URLSearchParams;
  onNavigate: (params: URLSearchParams) => void;
}) {
  // The page itself is a server component; paging is a navigation so the range
  // stays in the URL and stays shareable.
  function goToPage(next: number) {
    const params = new URLSearchParams(currentParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    onNavigate(params);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        No orders in this range.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">#{row.orderNumber}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(row.placedAt)}
                </TableCell>
                <TableCell>
                  <span className="block break-words">{row.customerName}</span>
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    {formatMobile(row.customerMobile)}
                  </span>
                </TableCell>
                <TableCell className="max-w-[22rem]">
                  <span className="block break-words text-xs text-muted-foreground">
                    {row.items
                      .map(
                        (item) =>
                          `${item.quantity}× ${item.name}` +
                          (item.variantName ? ` (${item.variantName})` : "")
                      )
                      .join(", ")}
                  </span>
                  {/* Why an order was cancelled is the whole reason to look it
                      up later, and the board never surfaced it. */}
                  {row.cancelReason && (
                    <span className="mt-0.5 block break-words text-xs text-destructive">
                      {row.cancelReason}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {ORDER_TYPE_LABEL[row.type]}
                  {row.tableLabel ? ` · ${row.tableLabel}` : ""}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                      ORDER_STATUS_BADGE[row.status]
                    )}
                  >
                    {ORDER_STATUS_LABEL[row.status]}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {PAYMENT_STATUS_LABEL[row.paymentStatus]}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatCurrency(row.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          className="justify-end"
        />
      )}
    </div>
  );
}
