import { db } from "@/lib/db";
import type { InvoiceOrder, InvoiceRestaurant } from "@/lib/restaurant/invoice";

/**
 * Loads one order in the shape the invoice builder wants.
 *
 * Shared by the guest's download and the restaurant's, so the two copies of a
 * bill are byte-identical. Whoever is allowed to ask is decided by the routes;
 * this only answers what the bill says.
 */
export async function loadInvoiceData(where: {
  orderId: string;
  /** Set by the staff route, so one restaurant can't print another's bill. */
  restaurantId?: string;
}): Promise<{
  restaurant: InvoiceRestaurant;
  order: InvoiceOrder;
  timezone: string;
  slug: string;
} | null> {
  const order = await db.restoOrder.findFirst({
    where: {
      id: where.orderId,
      ...(where.restaurantId ? { restaurantId: where.restaurantId } : {}),
    },
    include: {
      items: {
        include: { addOns: { select: { name: true } } },
        orderBy: { id: "asc" },
      },
      table: { select: { label: true } },
      restaurant: {
        select: {
          name: true,
          slug: true,
          legalName: true,
          branch: true,
          address: true,
          phone: true,
          email: true,
          gstin: true,
          fssaiLicence: true,
          taxPercent: true,
          timezone: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    slug: order.restaurant.slug,
    timezone: order.restaurant.timezone,
    restaurant: {
      name: order.restaurant.name,
      legalName: order.restaurant.legalName,
      branch: order.restaurant.branch,
      address: order.restaurant.address,
      phone: order.restaurant.phone,
      email: order.restaurant.email,
      gstin: order.restaurant.gstin,
      fssaiLicence: order.restaurant.fssaiLicence,
      taxPercent: order.restaurant.taxPercent,
    },
    order: {
      orderNumber: order.orderNumber,
      placedAt: order.placedAt,
      type: order.type,
      tableLabel: order.table?.label ?? null,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMode: order.paymentMode,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name,
        variantName: item.variantName,
        addOns: item.addOns.map((addOn) => addOn.name),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    },
  };
}
