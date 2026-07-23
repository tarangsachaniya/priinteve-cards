import Link from "next/link";
import type { Plan } from "@prisma/client";
import { CheckIcon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { getDisplayCurrency } from "@/lib/currency";
import { formatLocalPrice } from "@/lib/currency-format";
import { cn } from "@/lib/utils";

const CARD_TYPE_LABEL: Record<Plan["cardType"], string> = {
  NFC: "NFC card",
  QR: "QR card",
  BOTH: "NFC + QR card",
};

function planFeatures(plan: Plan): string[] {
  const parsed = Array.isArray(plan.featuresJson)
    ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
    : [];
  return [CARD_TYPE_LABEL[plan.cardType], ...parsed];
}

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

        <Reveal
          stagger
          className={cn(
            "mt-14 grid gap-6",
            plans.length === 1 && "mx-auto max-w-sm",
            plans.length === 2 && "sm:mx-auto sm:max-w-3xl sm:grid-cols-2",
            plans.length >= 3 && "lg:grid-cols-3"
          )}
        >
          {plans.map((plan) => (
            <RevealItem
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.recommended
                  ? "border-transparent bg-ink text-white shadow-2xl lg:-translate-y-3"
                  : "border-border bg-white"
              )}
            >
              {plan.recommended && (
                <span className="absolute top-6 right-6 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-ink">
                  <Sparkles className="size-3" />
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
              <p className={cn("mt-1 text-sm", plan.recommended ? "text-ink-muted" : "text-muted-foreground")}>
                Valid for {plan.validityDays} days · up to {plan.maxGalleryImages} gallery images
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {formatLocalPrice(plan.price, currency)}
                </span>
                <span className={cn("text-sm", plan.recommended ? "text-ink-muted" : "text-muted-foreground")}>
                  /{plan.validityDays} days
                </span>
              </div>

              <Button
                size="lg"
                variant={plan.recommended ? "default" : "outline"}
                className="mt-6 w-full"
                render={<Link href={ctaHref} />}
              >
                Get started
              </Button>

              <ul className="mt-8 flex flex-col gap-3 border-t border-current/10 pt-6">
                {planFeatures(plan).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                        plan.recommended ? "bg-primary text-ink" : "bg-primary/15 text-foreground"
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
