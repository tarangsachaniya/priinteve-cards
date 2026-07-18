import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Check, CreditCard, Sparkles, Nfc, QrCode } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
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
                "relative flex h-full flex-col overflow-visible !py-0 transition-all duration-300",
                plan.recommended
                  ? "border-2 border-primary bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent shadow-xl shadow-primary/10 lg:-translate-y-3"
                  : "border-border/80 shadow-none hover:border-primary/30 hover:shadow-lg"
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-ink shadow-md shadow-primary/30">
                  <Sparkles className="size-3.5" />
                  Most popular
                </span>
              )}

              <CardContent className={cn("flex flex-1 flex-col px-7 pb-7", plan.recommended ? "pt-9" : "pt-7")}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-ink">
                    <typeMeta.icon className="size-4" />
                  </span>
                </div>
                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {typeMeta.label} card plan
                </span>

                <div className="mt-6 flex items-end gap-1">
                  <span className="mb-1 text-lg font-semibold text-muted-foreground">₹</span>
                  <span className="text-5xl leading-none font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  billed once · valid {plan.validityDays} days
                </p>

                <Button
                  size="lg"
                  className="mt-6 w-full"
                  variant={plan.recommended ? "default" : "outline"}
                  render={<Link href={`/dashboard/checkout/${plan.id}`} />}
                >
                  {isCurrentPlan ? "Renew plan" : "Choose plan"}
                </Button>

                {features.length > 0 && (
                  <div className="mt-7 flex flex-1 flex-col gap-3.5 border-t border-border pt-6">
                    <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      What&apos;s included
                    </h4>
                    <ul className="flex flex-col gap-3">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
                            <Check className="size-3" strokeWidth={3} />
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
