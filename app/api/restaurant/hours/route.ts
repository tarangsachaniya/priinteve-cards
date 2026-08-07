import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { hoursUpdateSchema } from "@/lib/validations/restaurant";

export async function GET() {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const restaurant = await db.restaurant.findUnique({
    where: { id: auth.session.restaurantId },
    select: {
      timezone: true,
      acceptingOrders: true,
      closedMessage: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ hours: restaurant });
}

export async function PATCH(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = hoursUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { days, ...restaurantFields } = parsed.data;

  await db.$transaction(async (tx) => {
    if (Object.keys(restaurantFields).length > 0) {
      await tx.restaurant.update({
        where: { id: auth.session.restaurantId },
        data: {
          ...(restaurantFields.timezone !== undefined
            ? { timezone: restaurantFields.timezone }
            : {}),
          ...(restaurantFields.acceptingOrders !== undefined
            ? { acceptingOrders: restaurantFields.acceptingOrders }
            : {}),
          ...(restaurantFields.closedMessage !== undefined
            ? { closedMessage: restaurantFields.closedMessage || null }
            : {}),
        },
      });
    }

    if (days) {
      // Upsert rather than delete-and-recreate: a wipe would briefly leave the
      // restaurant with no hours, which the resolver reads as always open. A
      // customer loading the menu in that window would be told the wrong thing.
      for (const day of days) {
        await tx.restaurantHours.upsert({
          where: {
            restaurantId_dayOfWeek: {
              restaurantId: auth.session.restaurantId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          create: { restaurantId: auth.session.restaurantId, ...day },
          update: {
            opensAt: day.opensAt,
            closesAt: day.closesAt,
            isClosed: day.isClosed,
          },
        });
      }
    }
  });

  const hours = await db.restaurant.findUnique({
    where: { id: auth.session.restaurantId },
    select: {
      timezone: true,
      acceptingOrders: true,
      closedMessage: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  return NextResponse.json({ hours });
}
