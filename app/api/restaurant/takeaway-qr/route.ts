import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { getRestaurantOrderUrl } from "@/lib/restaurant/qr";

/**
 * The one QR for take-away and delivery, as opposed to the per-table codes.
 * It points at the table-less entry point, which filters dine-in out of the
 * order types it offers.
 */
export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.session.restaurantId },
    select: { slug: true, takeAwayEnabled: true, deliveryEnabled: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Dine-in-only restaurants have nothing to serve here: the page this code
  // opens would only tell the guest to scan their table instead.
  if (!restaurant.takeAwayEnabled && !restaurant.deliveryEnabled) {
    return NextResponse.json(
      { error: "Take-away and delivery are both switched off" },
      { status: 400 }
    );
  }

  const buffer = await generateQrPngBuffer(getRestaurantOrderUrl(restaurant.slug));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      // Private: this is a specific restaurant's code, not public content.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
