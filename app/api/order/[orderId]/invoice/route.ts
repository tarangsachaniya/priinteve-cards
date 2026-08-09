import { NextResponse } from "next/server";

import { buildInvoicePdf, invoiceFilename } from "@/lib/restaurant/invoice";
import { loadInvoiceData } from "@/lib/restaurant/invoice-data";

export const runtime = "nodejs";

/**
 * The guest's own copy of their bill.
 *
 * Reachable with the order id and nothing else, which is the same posture as
 * the status page and /api/order/[orderId]/status: the id is an unguessable
 * cuid, and it is the only thing a guest who has closed the tab and reopened
 * their link still has. Adding a session check here would lock a paying
 * customer out of their own receipt to defend against someone who would have
 * had to guess a cuid to read a restaurant bill.
 *
 * Available before payment too. An unpaid bill is exactly what a guest wants
 * to look at while deciding whether it is right, and the PDF says "Not paid"
 * across it rather than pretending otherwise.
 */
export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const data = await loadInvoiceData({ orderId: params.orderId });
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
