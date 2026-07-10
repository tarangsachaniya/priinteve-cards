import Link from "next/link";
import {
  CheckIcon,
  FileTextIcon,
  HardDriveIcon,
  ImagesIcon,
  Nfc,
  QrCode,
  Sparkles,
  VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Plan } from "@prisma/client";
import { PLAN_FEATURES } from "@/lib/constants/plan-features";
import { cn } from "@/lib/utils";

const CARD_TYPE_META: Record<string, { label: string; icon: typeof Nfc }> = {
  NFC: { label: "NFC", icon: Nfc },
  QR: { label: "QR", icon: QrCode },
  BOTH: { label: "NFC + QR", icon: Sparkles },
};

const FEATURE_BY_KEY = new Map<string, (typeof PLAN_FEATURES)[number]>(
  PLAN_FEATURES.map((feature) => [feature.key, feature])
);

function PlanLimits({ plan }: { plan: Plan }) {
  const limits = [
    { icon: ImagesIcon, value: plan.maxGalleryImages, label: "gallery images" },
    { icon: VideoIcon, value: plan.maxVideos, label: "videos" },
    { icon: FileTextIcon, value: plan.maxPdfs, label: "PDFs" },
    { icon: HardDriveIcon, value: plan.storageLimitMb, label: "MB storage" },
  ].filter((limit, index) => index === 0 || limit.value > 0);

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
      {limits.map((limit) => (
        <li key={limit.label} className="flex items-center gap-2 text-muted-foreground">
          <limit.icon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">
            <span className="font-medium text-foreground">{limit.value}</span> {limit.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PricingCards({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Plans are being updated — check back shortly.
      </p>
    );
  }

  // Sort plans to put recommended one in the middle on desktop
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.recommended) return 1;
    if (b.recommended) return -1;
    return 0;
  });

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-8">
      {sortedPlans.map((plan) => {
        const features = Array.isArray(plan.featuresJson)
          ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
          : [];
        const typeMeta = CARD_TYPE_META[plan.cardType] ?? { label: plan.cardType, icon: Sparkles };
        const perMonth = Math.round((plan.price / plan.validityDays) * 30);

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
                  <CardTitle className="text-xl font-bold tracking-tight">{plan.name}</CardTitle>
                  <CardDescription className="mt-1 text-sm">{typeMeta.label} card plan</CardDescription>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <typeMeta.icon className="size-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-7 px-6 pb-6">
              {/* Pricing Section */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground">₹</span>
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  for {plan.validityDays} days (≈₹{perMonth}/month)
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
                render={<Link href="/signup" />}
              >
                {plan.recommended ? "Get Started" : "Choose Plan"}
              </Button>

              {/* Limits Section */}
              <div className="space-y-3 border-t border-border/40 pt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What&apos;s Included
                </h4>
                <PlanLimits plan={plan} />
              </div>

              {/* Features Section */}
              {features.length > 0 && (
                <div className="space-y-3 border-t border-border/40 pt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Features
                  </h4>
                  <ul className="space-y-2.5">
                    {features.map((feature) => {
                      const known = FEATURE_BY_KEY.get(feature);
                      const Icon = known?.icon ?? CheckIcon;
                      return (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <span className="flex size-5 items-center justify-center text-primary">
                            <Icon className="size-4" />
                          </span>
                          <span className="text-foreground/85">{known?.label ?? feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
