import { NextResponse } from "next/server";

import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { buildInvoicePdf, invoiceFilename } from "@/lib/restaurant/invoice";
import { loadInvoiceData } from "@/lib/restaurant/invoice-data";

export const runtime = "nodejs";

/**
 * The restaurant's copy, for reprinting at the counter or filing.
 *
 * Byte-identical to what the guest downloads — same builder, same data — which
 * is the whole reason both routes go through loadInvoiceData(). Two copies of
 * one bill that disagreed would be useless in the only situation either gets
 * used, which is an argument about what was charged.
 *
 * Scoped by restaurantId as well as order id, so a signed-in owner can only
 * ever print their own restaurant's bills.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const data = await loadInvoiceData({
    orderId: params.id,
    restaurantId: auth.session.restaurantId,
  });
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await buildInvoicePdf({
    restaurant: data.restaurant,
    order: data.order,
    timezone: data.timezone,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFilename(data.slug, data.order.orderNumber)}"`,
    },
  });
}
