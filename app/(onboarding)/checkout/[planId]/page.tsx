import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShoppingCart } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { computePricing } from "@/lib/wallet";
import { getDisplayCurrency } from "@/lib/currency";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";

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

  const [pricingNoWallet, pricingWithWallet, currency] = await Promise.all([
    computePricing({ planPrice: plan.price, walletPoints: user.walletPoints, useWallet: false }),
    computePricing({ planPrice: plan.price, walletPoints: user.walletPoints, useWallet: true }),
    getDisplayCurrency(),
  ]);

  return (
    <main className="mx-auto max-w-lg p-6 sm:p-8">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
          <ShoppingCart className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.planId ? "Renewing" : "Purchasing"} {plan.name}
          </p>
        </div>
      </div>

      <CheckoutSummary
        plan={{ id: plan.id, name: plan.name, price: plan.price, validityDays: plan.validityDays }}
        pricingNoWallet={pricingNoWallet}
        pricingWithWallet={pricingWithWallet}
        currency={currency}
      />
    </main>
  );
}
