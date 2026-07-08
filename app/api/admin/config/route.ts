import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { configSchema } from "@/lib/validations/admin";

const SETTINGS_KEY: Record<keyof typeof configSchema.shape, string> = {
  pointsPerReferral: "referral_points_per_referral",
  conversionRate: "wallet_conversion_rate",
  minimumRedemption: "wallet_min_redeem_points",
};

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = configSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await Promise.all(
    Object.entries(parsed.data).map(([field, value]) => {
      const key = SETTINGS_KEY[field as keyof typeof SETTINGS_KEY];
      return db.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    })
  );

  return NextResponse.json({ success: true });
}
