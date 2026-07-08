import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReferralSettings, getWalletSettings } from "@/lib/settings";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, totalReferrals, redemptions, { pointsPerReferral }, { conversionRate }] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { referralCode: true, walletPoints: true } }),
      db.referral.count({ where: { referrerId: userId } }),
      db.walletTransaction.findMany({
        where: { userId, type: "REDEEMED" },
        orderBy: { createdAt: "desc" },
      }),
      getReferralSettings(),
      getWalletSettings(),
    ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    referralCode: user.referralCode,
    referralLink: `${process.env.NEXTAUTH_URL}/signup?ref=${user.referralCode}`,
    pointsPerReferral,
    totalReferrals,
    walletPoints: user.walletPoints,
    walletInr: Math.round(user.walletPoints / conversionRate),
    redemptions,
  });
}
