"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Gem, Sparkles, TreePine } from "lucide-react";
import type { CardMaterial } from "@prisma/client";

import { Button } from "@/components/ui/button";
import type { DisplayCurrency } from "@/lib/currency";
import { formatLocalPrice } from "@/lib/currency-format";
import {
  CARD_MATERIAL_META,
  MATERIAL_ORDER,
  availableDurations,
  durationLabel,
  type PlanOption,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const MATERIAL_ICON: Record<CardMaterial, typeof Sparkles> = {
  PLASTIC: CreditCard,
  WOODEN: TreePine,
  METAL: Gem,
};

export type PlanMatrixProps = {
  plans: PlanOption[];
  currency: DisplayCurrency;
  /** "dashboard" = in-app plan picker, "marketing" = homepage pricing section. */
  variant?: "dashboard" | "marketing";
  /** Plan the user is already on, shown as "Renew". Dashboard variant only. */
  currentPlanId?: string | null;
  /** Marketing variant sends everyone to one CTA instead of straight to checkout. */
  ctaHref?: string;
};

export function PlanMatrix({
  plans,
  currency,
  variant = "dashboard",
  currentPlanId,
  ctaHref,
}: PlanMatrixProps) {
  const durations = availableDurations(plans);
  // Default to whichever duration holds the recommended plan, else the shortest.
  const [duration, setDuration] = useState(
    () => plans.find((p) => p.recommended)?.durationYears ?? durations[0] ?? 1
  );

  const visible = MATERIAL_ORDER.map((material) =>
    plans.find((p) => p.material === material && p.durationYears === duration)
  ).filter((p): p is PlanOption => Boolean(p));

  if (visible.length === 0) return null;

  const isMarketing = variant === "marketing";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Plan duration"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1"
        >
          {durations.map((years) => {
            const isSelected = years === duration;
            return (
              <button
                key={years}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setDuration(years)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-ink shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {durationLabel(years)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
        {visible.map((plan) => {
          const meta = CARD_MATERIAL_META[plan.material];
          const Icon = MATERIAL_ICON[plan.material];
          const isCurrentPlan = currentPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300",
                plan.recommended
                  ? isMarketing
                    ? "border-transparent bg-ink text-white shadow-2xl lg:-translate-y-3"
                    : "border-2 border-primary bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent shadow-xl shadow-primary/10 lg:-translate-y-3"
                  : cn("border-border", isMarketing ? "bg-white" : "hover:border-primary/30 hover:shadow-lg")
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-ink shadow-md shadow-primary/30">
                  <Sparkles className="size-3.5" />
                  Most popular
                </span>
              )}

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold tracking-tight">{meta.label}</h3>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    plan.recommended && isMarketing ? "bg-primary/25 text-white" : "bg-primary/12 text-ink"
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-sm",
                  plan.recommended && isMarketing ? "text-ink-muted" : "text-muted-foreground"
                )}
              >
                {meta.blurb}
              </p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl leading-none font-bold tracking-tight">
                  {formatLocalPrice(plan.price, currency)}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 text-sm",
                  plan.recommended && isMarketing ? "text-ink-muted" : "text-muted-foreground"
                )}
              >
                billed once · valid {durationLabel(plan.durationYears).toLowerCase()}
              </p>

              <Button
                size="lg"
                className="mt-6 w-full"
                variant={plan.recommended ? "default" : "outline"}
                render={<Link href={ctaHref ?? `/checkout/${plan.id}`} />}
              >
                {isCurrentPlan ? "Renew plan" : "Choose plan"}
              </Button>

              {plan.features.length > 0 && (
                <div className="mt-7 flex flex-1 flex-col gap-3.5 border-t border-current/10 pt-6">
                  <h4
                    className={cn(
                      "text-xs font-semibold tracking-wider uppercase",
                      plan.recommended && isMarketing ? "text-ink-muted" : "text-muted-foreground"
                    )}
                  >
                    What&apos;s included
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={cn(
                            "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                            plan.recommended && isMarketing
                              ? "bg-primary text-ink"
                              : "bg-primary/15 text-ink"
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className={cn(!isMarketing && "text-foreground/85")}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
