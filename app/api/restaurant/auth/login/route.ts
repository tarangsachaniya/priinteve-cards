import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { issueRestaurantSession } from "@/lib/restaurant/auth";
import { restaurantLoginSchema } from "@/lib/validations/restaurant";

export async function POST(req: Request) {
  const parsed = restaurantLoginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await db.restaurantUser.findUnique({
    where: { email },
    include: { restaurant: { select: { id: true, isActive: true, slug: true } } },
  });

  // One generic message for every failure below, so this endpoint can't be
  // used to discover which emails exist.
  const invalid = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user || !user.isActive) return invalid;
  if (!(await bcrypt.compare(password, user.passwordHash))) return invalid;

  if (!user.restaurant.isActive) {
    return NextResponse.json(
      { error: "This restaurant account is paused. Contact the administrator." },
      { status: 403 }
    );
  }

  await issueRestaurantSession({
    userId: user.id,
    restaurantId: user.restaurantId,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await db.restaurantUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
