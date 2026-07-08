import { cookies } from "next/headers";

import { db } from "@/lib/db";

export async function createPendingReferralIfPresent(referredUserId: string): Promise<void> {
  const cookieStore = cookies();
  const referralCode = cookieStore.get("referralCode")?.value;
  if (!referralCode) {
    return;
  }

  const referrer = await db.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });

  if (referrer && referrer.id !== referredUserId) {
    await db.referral.create({
      data: { referrerId: referrer.id, referredId: referredUserId },
    });
  }

  try {
    cookieStore.delete("referralCode");
  } catch {
    // best-effort cleanup only
  }
}
