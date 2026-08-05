import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPastGracePeriod } from "@/lib/card-expiry";
import { revalidateUserCard } from "@/lib/revalidate-card";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Publishing is what a plan buys. Without this check any signed-in user could
  // POST here and take their card live for free, bypassing checkout entirely.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true, planExpiresAt: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    if (!user.planId) {
      return NextResponse.json({ error: "Choose a plan to publish your card" }, { status: 403 });
    }
    if (isPastGracePeriod(user.planExpiresAt)) {
      return NextResponse.json({ error: "Your plan has expired — renew to publish" }, { status: 403 });
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { cardPublished: true },
  });

  await revalidateUserCard(session.user.id);

  return NextResponse.json({ success: true });
}
