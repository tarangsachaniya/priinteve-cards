import Link from "next/link";
import { CheckIcon, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

const CARD_TYPE_LABEL: Record<string, string> = {
  NFC: "NFC",
  QR: "QR",
  BOTH: "NFC + QR",
};

export default async function PricingPage() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: [{ recommended: "desc" }, { price: "asc" }],
  });

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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const features = Array.isArray(plan.featuresJson)
              ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
              : [];

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col border-border/80 transition-all hover:-translate-y-1",
                  plan.recommended
                    ? "shadow-glow border-primary/40"
                    : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-emerald-700 px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                    <Sparkles className="size-3" />
                    Most popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{CARD_TYPE_LABEL[plan.cardType] ?? plan.cardType}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.validityDays} days</span>
                  </div>
                  {features.length > 0 && (
                    <ul className="flex flex-1 flex-col gap-3 text-sm">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CheckIcon className="size-3" />
                          </span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="bg-transparent p-(--card-spacing) pt-0">
                  <Button
                    size="lg"
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    render={<Link href="/signup" />}
                  >
                    Get started
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Plans are being updated — check back shortly.
          </p>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Not sure which plan fits? <Link href="/contact" className="font-medium text-primary hover:underline">Talk to us</Link> or read the{" "}
          <Link href="/faq" className="font-medium text-primary hover:underline">FAQ</Link>.
        </p>
      </div>
    </section>
  );
}
