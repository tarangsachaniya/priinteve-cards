import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  purchaseConfirmationEmailHtml,
  referralRewardEmailHtml,
  renewalConfirmationEmailHtml,
} from "@/lib/email-templates";
import { paymentGateway } from "@/lib/payment";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { getReferralSettings, getWalletSettings } from "@/lib/settings";

const confirmSchema = z.object({
  gatewayOrderId: z.string(),
  gatewayPaymentId: z.string().optional(),
});

// Called by the payment gateway's webhook in production (or, for now, by
// the mock checkout flow directly). No session-based auth here since a
// real webhook is a server-to-server call, not a logged-in browser request.
// TODO: once a real gateway is wired up, verify its signature header here
// (e.g. X-Razorpay-Signature) before trusting the payload.
export async function POST(req: Request) {
  const parsed = confirmSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { gatewayOrderId, gatewayPaymentId } = parsed.data;

  const purchase = await db.purchase.findFirst({
    where: { gatewayOrderId },
    include: { plan: true, user: true },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status === "COMPLETED") {
    return NextResponse.json({ success: true, planExpiresAt: purchase.user.planExpiresAt });
  }

  const verify = await paymentGateway.verifyAndConfirm({
    gatewayOrderId,
    gatewayPaymentId,
    rawPayload: parsed.data,
  });

  if (!verify.verified) {
    await db.purchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const now = new Date();
  const existingExpiry = purchase.user.planExpiresAt;
  const newExpiry =
    purchase.isRenewal && existingExpiry && existingExpiry > now
      ? new Date(existingExpiry.getTime() + purchase.plan.validityDays * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + purchase.plan.validityDays * 24 * 60 * 60 * 1000);

  const referralReward = await db.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: "COMPLETED", gatewayPaymentId: verify.gatewayPaymentId },
    });

    await tx.user.update({
      where: { id: purchase.userId },
      data: { cardPublished: true, planId: purchase.planId, planExpiresAt: newExpiry },
    });

    if (purchase.walletUsed > 0) {
      const { conversionRate } = await getWalletSettings();
      const walletInr = Math.round(purchase.walletUsed / conversionRate);

      await tx.user.update({
        where: { id: purchase.userId },
        data: { walletPoints: { decrement: purchase.walletUsed } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: purchase.userId,
          type: "REDEEMED",
          points: purchase.walletUsed,
          inrValue: -walletInr,
          description: `Redeemed for ${purchase.plan.name}`,
        },
      });
    }

    const pendingReferral = await tx.referral.findFirst({
      where: { referredId: purchase.userId, purchaseId: null },
    });

    if (!pendingReferral) {
      return null;
    }

    const { pointsPerReferral } = await getReferralSettings();
    const { conversionRate } = await getWalletSettings();
    const referralInr = Math.round(pointsPerReferral / conversionRate);

    const referrer = await tx.user.update({
      where: { id: pendingReferral.referrerId },
      data: { walletPoints: { increment: pointsPerReferral } },
    });

    await tx.walletTransaction.create({
      data: {
        userId: pendingReferral.referrerId,
        type: "EARNED",
        points: pointsPerReferral,
        inrValue: referralInr,
        description: "Referral reward",
      },
    });

    await tx.referral.update({
      where: { id: pendingReferral.id },
      data: { pointsAwarded: pointsPerReferral, purchaseId: purchase.id },
    });

    return { referrer, pointsPerReferral };
  });

  await sendEmail({
    to: purchase.user.email,
    subject: purchase.isRenewal ? "Renewal confirmed" : "Purchase confirmed",
    html: purchase.isRenewal
      ? renewalConfirmationEmailHtml({
          name: purchase.user.name,
          planName: purchase.plan.name,
          expiresAt: newExpiry,
        })
      : purchaseConfirmationEmailHtml({
          name: purchase.user.name,
          planName: purchase.plan.name,
          expiresAt: newExpiry,
        }),
  }).catch((err) => console.error("purchase confirmation email failed", err));

  if (referralReward) {
    await sendEmail({
      to: referralReward.referrer.email,
      subject: "Referral reward credited",
      html: referralRewardEmailHtml({
        name: referralReward.referrer.name,
        points: referralReward.pointsPerReferral,
        walletBalance: referralReward.referrer.walletPoints,
      }),
    }).catch((err) => console.error("referral reward email failed", err));
  }

  await revalidateUserCard(purchase.userId);

  return NextResponse.json({ success: true, planExpiresAt: newExpiry });
}
