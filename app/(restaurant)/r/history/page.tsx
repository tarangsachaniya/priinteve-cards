import { redirect } from "next/navigation";
import { History } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import {
  buildHistoryOrderBy,
  buildHistoryWhere,
  historyQuery,
  parseHistoryFilters,
  type HistorySearchParams,
} from "@/lib/restaurant/order-history";
import { PageHeader } from "@/components/shared/page-header";
import { OrderHistoryView } from "@/components/restaurant/order-history-view";

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

  // Cancelled orders are not money taken, so neither the revenue figure nor
  // the dish report counts them — one rule, applied in both places.
  const soldWhere = { ...where, status: { not: "CANCELLED" as const } };

  const [total, orders, cancelledCount, revenue, menuItems, dishSales] = await Promise.all([
    db.restoOrder.count({ where }),
    db.restoOrder.findMany({
      where,
      orderBy: buildHistoryOrderBy(filters),
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
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
    db.restoOrder.aggregate({ where: soldWhere, _sum: { total: true } }),
    db.menuItem.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    /**
     * Grouped by the snapshot `name`, not `menuItemId`: that column is
     * nullable with onDelete SetNull so history survives a deleted dish, and
     * grouping on it would tip every deleted dish into one anonymous null row.
     * The name is what was actually sold and is always present.
     */
    db.restoOrderItem.groupBy({
      by: ["name"],
      where: { order: soldWhere },
      _sum: { quantity: true, lineTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { lineTotal: "desc" } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={History}
        title="Order history"
        description="Every past order, cancelled ones included."
      />

      <OrderHistoryView
        filters={{
          preset: filters.preset,
          status: filters.status,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          menuItemId: filters.menuItemId,
        }}
        currentParams={historyQuery(filters)}
        menuItems={menuItems}
        rangeLabel={`${filters.fromDate} to ${filters.toDate}`}
        search={filters.q}
        sort={{ key: filters.sort, dir: filters.dir }}
        pageSize={filters.pageSize}
        total={total}
        summary={{
          revenue: revenue._sum.total ?? 0,
          orders: total,
          cancelled: cancelledCount,
        }}
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
        dishRows={dishSales.map((dish) => ({
          name: dish.name,
          quantity: dish._sum.quantity ?? 0,
          revenue: dish._sum.lineTotal ?? 0,
          timesOrdered: dish._count._all,
        }))}
        page={filters.page}
        totalPages={totalPages}
      />
    </main>
  );
}
