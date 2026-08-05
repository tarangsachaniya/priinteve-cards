import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CreditCard } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlans, toPlanOption } from "@/lib/plans";
import { getDisplayCurrency } from "@/lib/currency";
import { PlanMatrix } from "@/components/plans/plan-matrix";

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, plans, currency] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { planId: true },
    }),
    getActivePlans(),
    getDisplayCurrency(),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
          <CreditCard className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick your card material and how long you want it active. Every card includes NFC tap and a QR
            code.
          </p>
        </div>
      </div>

      <PlanMatrix
        plans={plans.map(toPlanOption)}
        currency={currency}
        currentPlanId={user?.planId ?? null}
      />
    </main>
  );
}
