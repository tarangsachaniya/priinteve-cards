import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShoppingCart } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { computePricing } from "@/lib/wallet";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PageHeader } from "@/components/shared/page-header";

export default async function CheckoutPage({
  params,
}: {
  params: { planId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const plan = await db.plan.findUnique({ where: { id: params.planId } });
  if (!plan || !plan.isActive) {
    notFound();
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { walletPoints: true, planId: true },
  });
  if (!user) {
    redirect("/login");
  }

  const [pricingNoWallet, pricingWithWallet] = await Promise.all([
    computePricing({ planPrice: plan.price, walletPoints: user.walletPoints, useWallet: false }),
    computePricing({ planPrice: plan.price, walletPoints: user.walletPoints, useWallet: true }),
  ]);

  return (
    <main className="mx-auto max-w-lg p-6 sm:p-8">
      <PageHeader
        icon={ShoppingCart}
        title="Checkout"
        description={`${user.planId ? "Renewing" : "Purchasing"} ${plan.name}`}
      />

      <CheckoutSummary
        plan={{ id: plan.id, name: plan.name, price: plan.price, validityDays: plan.validityDays }}
        pricingNoWallet={pricingNoWallet}
        pricingWithWallet={pricingWithWallet}
      />
    </main>
  );
}
