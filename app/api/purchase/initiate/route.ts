import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentGateway } from "@/lib/payment";
import { computePricing } from "@/lib/wallet";

const initiateSchema = z.object({
  planId: z.string(),
  useWallet: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = initiateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { planId, useWallet } = parsed.data;

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { walletPoints: true, planId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pricing is always recomputed server-side — never trust a client-sent amount.
  const pricing = await computePricing({
    planPrice: plan.price,
    walletPoints: user.walletPoints,
    useWallet,
  });

  const isRenewal = user.planId !== null;

  const purchase = await db.purchase.create({
    data: {
      userId,
      planId: plan.id,
      amountPaid: pricing.amountDue,
      walletUsed: pricing.walletPointsUsed,
      status: "PENDING",
      isRenewal,
      gatewayName: "mock",
    },
  });

  const result = await paymentGateway.initiate({
    purchaseId: purchase.id,
    amount: pricing.amountDue,
    userId,
  });

  await db.purchase.update({
    where: { id: purchase.id },
    data: { gatewayOrderId: result.gatewayOrderId, gatewayName: result.gatewayName },
  });

  return NextResponse.json({
    purchaseId: purchase.id,
    gatewayOrderId: result.gatewayOrderId,
    amountDue: pricing.amountDue,
    clientPayload: result.clientPayload,
  });
}
