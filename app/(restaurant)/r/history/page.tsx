import { redirect } from "next/navigation";
import { History } from "lucide-react";

import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import {
  HISTORY_PAGE_SIZE,
  buildHistoryWhere,
  parseHistoryFilters,
  type HistorySearchParams,
} from "@/lib/restaurant/order-history";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { OrderHistoryFilters } from "@/components/restaurant/order-history-filters";
import { OrderHistoryTable } from "@/components/restaurant/order-history-table";

export const dynamic = "force-dynamic";

/**
 * The records view. The orders board deliberately drops an order the moment it
 * closes, so this is the only place a completed or cancelled order can be
 * looked at again — and the only place a day's takings can be reconciled.
 */
export default async function RestaurantHistoryPage({
  searchParams,
}: {
  searchParams: HistorySearchParams;
}) {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { timezone: true },
  });
  if (!restaurant) redirect("/r/login");

  const filters = parseHistoryFilters(searchParams, restaurant.timezone);
  const where = buildHistoryWhere(session.restaurantId, filters);

  const [total, orders, cancelledCount, revenue, menuItems] = await Promise.all([
    db.restoOrder.count({ where }),
    db.restoOrder.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (filters.page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        paymentStatus: true,
        customerName: true,
        customerMobile: true,
        total: true,
        placedAt: true,
        cancelReason: true,
        table: { select: { label: true } },
        items: { select: { id: true, name: true, quantity: true, variantName: true } },
      },
    }),
    db.restoOrder.count({ where: { ...where, status: "CANCELLED" } }),
    // Cancelled orders are not money taken, so they never count toward revenue
    // — same rule the dashboard applies.
    db.restoOrder.aggregate({
      where: { ...where, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.menuItem.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));

  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={History}
        title="Order history"
        description="Every past order, cancelled ones included."
      />

      <div className="flex flex-col gap-6">
        <OrderHistoryFilters
          filters={{
            preset: filters.preset,
            status: filters.status,
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            menuItemId: filters.menuItemId,
          }}
          menuItems={menuItems}
        />

        <Card className="border-border/80">
          <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {formatCurrency(revenue._sum.total ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Revenue · {filters.fromDate} to {filters.toDate}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{total}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{cancelledCount}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>

        <OrderHistoryTable
          rows={orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            type: order.type,
            paymentStatus: order.paymentStatus,
            customerName: order.customerName,
            customerMobile: order.customerMobile,
            tableLabel: order.table?.label ?? null,
            total: order.total,
            placedAt: order.placedAt.toISOString(),
            cancelReason: order.cancelReason,
            items: order.items,
          }))}
          page={filters.page}
          totalPages={totalPages}
        />
      </div>
    </main>
  );
}
