import type { Metadata } from "next";

import { db } from "@/lib/db";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
import { ClosedNotice } from "@/components/order/closed-notice";
import { OrderStatusTracker } from "@/components/order/order-status-tracker";
import { RestoPage } from "@/components/order/resto-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; orderId: string };
}): Promise<Metadata> {
  const order = await db.restoOrder.findFirst({
    where: { id: params.orderId, restaurant: { slug: params.slug } },
    select: {
      orderNumber: true,
      restaurant: { select: { name: true, branch: true } },
    },
  });

  if (!order) return { title: "Order not found" };

  const restaurantTitle = order.restaurant.branch
    ? `${order.restaurant.name} — ${order.restaurant.branch}`
    : order.restaurant.name;
  return { title: `Order #${order.orderNumber} · ${restaurantTitle}` };
}

/**
 * Live status for one order. `status` is a static segment, so it always wins
 * over the sibling [tableCode] route — "status" is reserved as a table code
 * in lib/restaurant/codes.ts to keep it that way.
 */
export default async function OrderStatusPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const order = await db.restoOrder.findFirst({
    where: { id: params.orderId, restaurant: { slug: params.slug } },
    include: {
      items: { include: { addOns: { select: { name: true } } } },
      table: { select: { label: true } },
      review: { select: { id: true } },
      restaurant: {
        select: {
          name: true,
          slug: true,
          branch: true,
          brandColor: true,
          themeMode: true,
          onlinePaymentEnabled: true,
          counterPaymentEnabled: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <ClosedNotice
        title="Order not found"
        message="We couldn't find this order. Check the link, or ask the restaurant for help."
      />
    );
  }

  return (
    <RestoPage
      slug={order.restaurant.slug}
      brandColor={order.restaurant.brandColor}
      themeMode={order.restaurant.themeMode}
    >
      <OrderStatusTracker
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMode: order.paymentMode,
          type: order.type,
          tableLabel: order.table?.label ?? null,
          customerName: order.customerName,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          deliveryFee: order.deliveryFee,
          total: order.total,
          cancelReason: order.cancelReason,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            variantName: item.variantName,
            addOns: item.addOns.map((addOn) => addOn.name),
          })),
          restaurantName: order.restaurant.branch
            ? `${order.restaurant.name} — ${order.restaurant.branch}`
            : order.restaurant.name,
          restaurantSlug: order.restaurant.slug,
          brandColor: order.restaurant.brandColor,
          // Same gate as the menu: never offer a payment method that would
          // fail, whether because the restaurant disabled it or because this
          // deployment has no Razorpay keys.
          canPayOnline: order.restaurant.onlinePaymentEnabled && isRazorpayConfigured(),
          canPayCash: order.restaurant.counterPaymentEnabled,
          hasReview: order.review !== null,
        }}
      />
    </RestoPage>
  );
}
