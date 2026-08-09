import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { peakWindowsUpdateSchema } from "@/lib/validations/restaurant";

const WINDOW_SELECT = {
  dayOfWeek: true,
  startsAt: true,
  endsAt: true,
  label: true,
} as const;

const WINDOW_ORDER = [{ dayOfWeek: "asc" }, { startsAt: "asc" }] as const;

export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const windows = await db.restaurantPeakWindow.findMany({
    where: { restaurantId: auth.session.restaurantId },
    select: WINDOW_SELECT,
    orderBy: [...WINDOW_ORDER],
  });

  return NextResponse.json({ windows });
}

/**
 * Replaces the whole set.
 *
 * The hours route upserts row by row precisely to avoid a moment with no rows,
 * which the open-state resolver would read as "always open" — a wrong answer
 * shown to a guest. Peak windows have no such hazard: an empty set means "not
 * a rush", which is the quiet default anyway, and these rows carry no natural
 * key to reconcile against. Delete-then-create inside one transaction is both
 * simpler and correct here.
 */
export async function PUT(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = peakWindowsUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { restaurantId } = auth.session;

  const windows = await db.$transaction(async (tx) => {
    await tx.restaurantPeakWindow.deleteMany({ where: { restaurantId } });

    if (parsed.data.windows.length > 0) {
      await tx.restaurantPeakWindow.createMany({
        data: parsed.data.windows.map((window) => ({ ...window, restaurantId })),
      });
    }

    return tx.restaurantPeakWindow.findMany({
      where: { restaurantId },
      select: WINDOW_SELECT,
      orderBy: [...WINDOW_ORDER],
    });
  });

  return NextResponse.json({ windows });
}
