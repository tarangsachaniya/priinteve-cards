import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { getTableOrderUrl } from "@/lib/restaurant/qr";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const table = await db.restaurantTable.findFirst({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    select: { code: true, label: true, restaurant: { select: { slug: true } } },
  });

  if (!table) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await generateQrPngBuffer(getTableOrderUrl(table.restaurant.slug, table.code));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      // Private: this is a specific restaurant's table, not public content.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
