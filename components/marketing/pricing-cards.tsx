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
    <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-5">
      {limits.map((limit) => (
        <div
          key={limit.label}
          className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground"
        >
          <limit.icon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">
            <span className="font-medium text-foreground">{limit.value}</span> {limit.label}
          </span>
        </div>
      ))}
    </div>
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

  return (
    <div className="isolate grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-start lg:pt-3">
      {plans.map((plan) => {
        const features = Array.isArray(plan.featuresJson)
          ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
          : [];
        const typeMeta = CARD_TYPE_META[plan.cardType] ?? { label: plan.cardType, icon: Sparkles };
        const perMonth = Math.round((plan.price / plan.validityDays) * 30);

        return (
          <div
            key={plan.id}
            className={cn(
              "relative transition-transform duration-300",
              plan.recommended && "z-10 lg:-translate-y-4"
            )}
          >
            {plan.recommended && (
              <div className="absolute -top-3.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30">
                <Sparkles className="size-3" />
                Most popular
              </div>
            )}
            <Card
              className={cn(
                "relative flex h-full flex-col rounded-2xl border-border/80 transition-all hover:-translate-y-1",
                plan.recommended
                  ? "shadow-glow border-primary/40 bg-gradient-to-b from-primary/5 to-transparent"
                  : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      plan.recommended
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <typeMeta.icon className="size-4" />
                  </span>
                </div>
                <CardDescription>
                  <Badge variant="outline">{typeMeta.label}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div className="border-b border-border/60 pb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.validityDays} days</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">≈ ₹{perMonth} per month</p>
                </div>
                <PlanLimits plan={plan} />
                {features.length > 0 && (
                  <ul className="flex flex-1 flex-col gap-3 text-sm">
                    {features.map((feature) => {
                      const known = FEATURE_BY_KEY.get(feature);
                      const Icon = known?.icon ?? CheckIcon;
                      return (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-3" />
                          </span>
                          <span className="text-muted-foreground">{known?.label ?? feature}</span>
                        </li>
                      );
                    })}
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
          </div>
        );
      })}
    </div>
  );
}
