import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";

import { db } from "@/lib/db";
import { getRestaurantSession } from "@/lib/restaurant/auth";
import { PageHeader } from "@/components/shared/page-header";
import { OrdersBoard } from "@/components/restaurant/orders-board";

export const dynamic = "force-dynamic";

export default async function RestaurantOrdersPage() {
  const session = await getRestaurantSession();
  if (!session) redirect("/r/login");

  const orders = await db.restoOrder.findMany({
    where: {
      restaurantId: session.restaurantId,
      status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] },
    },
    orderBy: { placedAt: "asc" },
    include: {
      items: { select: { id: true, name: true, quantity: true, lineTotal: true } },
      table: { select: { label: true } },
    },
  });

  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={ReceiptText}
        title="Orders"
        description="Live kitchen board — move each order along as you work through it."
      />

      <OrdersBoard
        initialOrders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          paymentMode: order.paymentMode,
          paymentStatus: order.paymentStatus,
          customerName: order.customerName,
          customerMobile: order.customerMobile,
          tableLabel: order.table?.label ?? null,
          total: order.total,
          note: order.note,
          deliveryAddress: order.deliveryAddress,
          deliveryPincode: order.deliveryPincode,
          pickupInMinutes: order.pickupInMinutes,
          placedAt: order.placedAt.toISOString(),
          items: order.items,
        }))}
      />
    </main>
  );
}
