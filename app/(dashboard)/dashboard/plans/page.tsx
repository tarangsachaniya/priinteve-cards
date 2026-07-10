import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CreditCard, Sparkles, Nfc, QrCode } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const CARD_TYPE_META: Record<string, { label: string; icon: typeof Sparkles }> = {
  NFC: { label: "NFC", icon: Nfc },
  QR: { label: "QR", icon: QrCode },
  BOTH: { label: "NFC + QR", icon: Sparkles },
};

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, plans] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { planId: true },
    }),
    db.plan.findMany({
      where: { isActive: true },
      orderBy: [{ recommended: "desc" }, { price: "asc" }],
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={CreditCard}
        title="Plans"
        description="Choose a plan to publish your digital business card."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-8">
        {plans.map((plan) => {
          const features = Array.isArray(plan.featuresJson)
            ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
            : [];
          const isCurrentPlan = user?.planId === plan.id;
          const typeMeta = CARD_TYPE_META[plan.cardType] ?? { label: plan.cardType, icon: Sparkles };

          return (
            <Card
              key={plan.id}
              className={cn(
                "flex h-full flex-col rounded-2xl transition-all duration-300 border-2",
                plan.recommended
                  ? "border-primary bg-primary/[0.02] shadow-md lg:scale-105 lg:shadow-lg"
                  : "border-border/40 hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {plan.recommended && (
                <div className="rounded-t-xl border-b border-primary/20 bg-primary/8 px-6 py-2.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Most Popular</span>
                  </div>
                </div>
              )}

              <CardHeader className={cn(plan.recommended && "pt-6")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-sm">{typeMeta.label} card plan</CardDescription>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <typeMeta.icon className="size-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-7 px-6 pb-6">
                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-muted-foreground">₹</span>
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    for {plan.validityDays} days
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className={cn(
                    "w-full font-semibold transition-all duration-200",
                    plan.recommended
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "border border-primary/40 hover:border-primary/60 hover:bg-primary/5"
                  )}
                  variant={plan.recommended ? "default" : "outline"}
                  render={<Link href={`/dashboard/checkout/${plan.id}`} />}
                >
                  {isCurrentPlan ? "Renew Plan" : "Choose Plan"}
                </Button>

                {/* Features */}
                {features.length > 0 && (
                  <div className="space-y-3 border-t border-border/40 pt-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Features
                    </h4>
                    <ul className="space-y-2.5">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <span className="flex size-5 items-center justify-center text-primary">
                            <Sparkles className="size-3.5" />
                          </span>
                          <span className="text-foreground/85">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
