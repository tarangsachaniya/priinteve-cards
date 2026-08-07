import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";

const schema = z.object({ isHidden: z.boolean() });

/**
 * Hide or restore one review.
 *
 * There is deliberately no DELETE. Reviews are anchored to paid orders, and a
 * restaurant that can erase them has a rating worth nothing to the guests
 * reading it.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Scoped by restaurantId, so one restaurant can't touch another's reviews.
  const { count } = await db.restoReview.updateMany({
    where: { id: params.id, restaurantId: auth.session.restaurantId },
    data: { isHidden: parsed.data.isHidden },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
