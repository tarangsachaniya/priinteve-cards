import Link from "next/link";
import type { Plan } from "@prisma/client";

import { Reveal } from "@/components/ui/reveal";
import { PlanMatrix } from "@/components/plans/plan-matrix";
import { getDisplayCurrency } from "@/lib/currency";
import { toPlanOption } from "@/lib/plans";

export async function Pricing({ plans, ctaHref }: { plans: Plan[]; ctaHref: string }) {
  if (plans.length === 0) return null;

  const currency = await getDisplayCurrency();

  return (
    <section id="pricing" className="bg-secondary py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Choose the plan that fits you.
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Need a custom team plan?{" "}
            <Link href="#contact" className="font-semibold text-foreground hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <PlanMatrix
            plans={plans.map(toPlanOption)}
            currency={currency}
            variant="marketing"
            ctaHref={ctaHref}
          />
        </Reveal>
      </div>
    </section>
  );
}
