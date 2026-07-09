import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { getActivePlans } from "@/lib/plans";

export const revalidate = 3600;

export default async function PricingPage() {
  const plans = await getActivePlans();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-dot mask-fade-b pointer-events-none absolute inset-0 -z-10 opacity-30"
      />

      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Pricing
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-muted-foreground">
            Choose the plan that fits how you network. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-14">
          <PricingCards plans={plans} />
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Not sure which plan fits? <Link href="/contact" className="font-medium text-primary hover:underline">Talk to us</Link> or read the{" "}
          <Link href="/faq" className="font-medium text-primary hover:underline">FAQ</Link>.
        </p>
      </div>
    </section>
  );
}
