import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import {
  buildHistoryWhere,
  csvRow,
  parseHistoryFilters,
  type HistorySearchParams,
} from "@/lib/restaurant/order-history";

/** No pagination here — an export of one page of a range is not an export. */
const EXPORT_LIMIT = 5000;

const HEADERS = [
  "Order number",
  "Placed at",
  "Status",
  "Type",
  "Table",
  "Customer",
  "Mobile",
  "Items",
  "Subtotal",
  "Tax",
  "Delivery fee",
  "Total",
  "Payment status",
  "Payment mode",
  "Completed at",
  "Cancelled at",
  "Cancel reason",
  "Note",
];

/**
 * The order history as a spreadsheet. Reads the same query params and calls the
 * same buildHistoryWhere() as /r/history, so the file always matches the list
 * that produced it rather than drifting into a second definition of "the range".
 */
export async function GET(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.session.restaurantId },
    select: { slug: true, timezone: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const filters = parseHistoryFilters(
    Object.fromEntries(searchParams) as HistorySearchParams,
    restaurant.timezone
  );

  const orders = await db.restoOrder.findMany({
    where: buildHistoryWhere(auth.session.restaurantId, filters),
    orderBy: { placedAt: "desc" },
    take: EXPORT_LIMIT,
    select: {
      orderNumber: true,
      placedAt: true,
      status: true,
      type: true,
      customerName: true,
      customerMobile: true,
      subtotal: true,
      taxAmount: true,
      deliveryFee: true,
      total: true,
      paymentStatus: true,
      paymentMode: true,
      completedAt: true,
      cancelledAt: true,
      cancelReason: true,
      note: true,
      table: { select: { label: true } },
      items: { select: { name: true, quantity: true, variantName: true } },
    },
  });

  const lines = [
    csvRow(HEADERS),
    ...orders.map((order) =>
      csvRow([
        order.orderNumber,
        order.placedAt.toISOString(),
        order.status,
        order.type,
        order.table?.label ?? "",
        order.customerName,
        order.customerMobile,
        order.items
          .map(
            (item) =>
              `${item.quantity}x ${item.name}` + (item.variantName ? ` (${item.variantName})` : "")
          )
          .join("; "),
        order.subtotal,
        order.taxAmount,
        order.deliveryFee,
        order.total,
        order.paymentStatus,
        order.paymentMode ?? "",
        order.completedAt?.toISOString() ?? "",
        order.cancelledAt?.toISOString() ?? "",
        order.cancelReason ?? "",
        order.note ?? "",
      ])
    ),
  ];

  const filename = `${restaurant.slug}-orders-${filters.fromDate}-to-${filters.toDate}.csv`;

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
