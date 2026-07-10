import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CreditCard, Sparkles } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
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
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const CARD_TYPE_LABEL: Record<string, string> = {
  NFC: "NFC",
  QR: "QR",
  BOTH: "NFC + QR",
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const features = Array.isArray(plan.featuresJson)
            ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
            : [];
          const isCurrentPlan = user?.planId === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.recommended && "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary"
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
                  <Sparkles className="size-3" />
                  Most popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline">{CARD_TYPE_LABEL[plan.cardType] ?? plan.cardType}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <span className="text-2xl font-semibold">₹{plan.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / {plan.validityDays} days
                  </span>
                </div>
                {features.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  render={<Link href={`/dashboard/checkout/${plan.id}`} />}
                >
                  {isCurrentPlan ? "Renew" : "Select"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
