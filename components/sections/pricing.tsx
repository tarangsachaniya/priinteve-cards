import Link from "next/link";
import { CheckIcon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Basic",
    price: 9,
    description: "For individuals just getting started.",
    features: ["1 digital card", "Unlimited profile views", "Basic customization", "Email support"],
    featured: false,
  },
  {
    name: "Smart",
    price: 19,
    description: "For professionals who network often.",
    features: [
      "3 digital cards",
      "Custom branding",
      "Lead capture forms",
      "Analytics dashboard",
      "Priority support",
    ],
    featured: false,
  },
  {
    name: "Premium",
    price: 39,
    description: "For teams that need full control.",
    features: [
      "Unlimited digital cards",
      "Team management dashboard",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
    featured: true,
  },
];

export function Pricing() {
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
            <Link href="#faq" className="font-semibold text-foreground hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <RevealItem
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.featured
                  ? "border-transparent bg-ink text-white shadow-2xl lg:-translate-y-3"
                  : "border-border bg-white"
              )}
            >
              {plan.featured && (
                <span className="absolute top-6 right-6 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-ink">
                  <Sparkles className="size-3" />
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
              <p className={cn("mt-1 text-sm", plan.featured ? "text-ink-muted" : "text-muted-foreground")}>
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                <span className={cn("text-sm", plan.featured ? "text-ink-muted" : "text-muted-foreground")}>
                  /month
                </span>
              </div>

              <Button
                size="lg"
                className={cn("mt-6 w-full", plan.featured ? "" : "")}
                variant={plan.featured ? "default" : "outline"}
                render={<Link href="/signup" />}
              >
                Get started
              </Button>

              <ul className="mt-8 flex flex-col gap-3 border-t border-current/10 pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                        plan.featured ? "bg-primary text-ink" : "bg-primary/15 text-foreground"
                      )}
                    >
                      <CheckIcon className="size-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
