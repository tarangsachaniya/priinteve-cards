import Link from "next/link";
import { CheckIcon, FileTextIcon, HardDriveIcon, ImagesIcon, Sparkles, VideoIcon } from "lucide-react";

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

const CARD_TYPE_LABEL: Record<string, string> = {
  NFC: "NFC",
  QR: "QR",
  BOTH: "NFC + QR",
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
    <ul className="flex flex-col gap-2 border-b border-border/60 pb-5 text-sm">
      {limits.map((limit) => (
        <li key={limit.label} className="flex items-center gap-2.5 text-muted-foreground">
          <limit.icon className="size-4 shrink-0 text-primary" />
          <span>
            {limit.value} {limit.label}
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

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        );
      })}
    </div>
  );
}
