import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireRestaurantSession } from "@/lib/restaurant/auth";
import { normalizeMobile } from "@/lib/restaurant/mobile";
import { isRazorpayConfigured } from "@/lib/restaurant/payment";
import { restaurantSettingsSchema } from "@/lib/validations/restaurant";

export async function PATCH(req: Request) {
  const auth = await requireRestaurantSession();
  if (!auth.ok) return auth.response;

  const parsed = restaurantSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { name, branch, phone, email, address, ...rest } = parsed.data;

  // Turning on online payment without keys would show customers a Pay Online
  // button that can't work, so refuse it here rather than at checkout.
  if (rest.onlinePaymentEnabled && !isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't configured on this deployment yet" },
      { status: 400 }
    );
  }

  const restaurant = await db.restaurant.update({
    where: { id: auth.session.restaurantId },
    data: {
      name,
      branch: branch || null,
      phone: phone ? normalizeMobile(phone) : null,
      email: email || null,
      address: address || null,
      ...rest,
    },
  });

  return NextResponse.json({ restaurant });
}
