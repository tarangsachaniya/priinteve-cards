import type { CardMaterial, Plan } from "@prisma/client";

import { db } from "@/lib/db";

export const MATERIAL_ORDER: CardMaterial[] = ["PLASTIC", "WOODEN", "METAL"];

export const CARD_MATERIAL_META: Record<CardMaterial, { label: string; blurb: string }> = {
  PLASTIC: { label: "Plastic", blurb: "Light, durable and everyday-ready." },
  WOODEN: { label: "Wooden", blurb: "Eco-friendly engraved finish." },
  METAL: { label: "Metal", blurb: "Premium laser-etched statement card." },
};

export const DURATION_OPTIONS = [1, 2, 3] as const;
export type DurationYears = (typeof DURATION_OPTIONS)[number];

export function durationLabel(years: number) {
  return years === 1 ? "1 Year" : `${years} Years`;
}

export function getActivePlans() {
  return db.plan.findMany({
    where: { isActive: true, isDraft: false },
    orderBy: [{ material: "asc" }, { durationYears: "asc" }],
  });
}

/** Plan data trimmed to what the client-side pickers need. */
export type PlanOption = {
  id: string;
  name: string;
  material: CardMaterial;
  durationYears: number;
  price: number;
  validityDays: number;
  maxGalleryImages: number;
  recommended: boolean;
  features: string[];
};

export function toPlanOption(plan: Plan): PlanOption {
  return {
    id: plan.id,
    name: plan.name,
    material: plan.material,
    durationYears: plan.durationYears,
    price: plan.price,
    validityDays: plan.validityDays,
    maxGalleryImages: plan.maxGalleryImages,
    recommended: plan.recommended,
    features: Array.isArray(plan.featuresJson)
      ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
      : [],
  };
}

/** Durations that actually have a plan, so the toggle never offers a dead option. */
export function availableDurations(plans: PlanOption[]): number[] {
  return Array.from(new Set(plans.map((p) => p.durationYears))).sort((a, b) => a - b);
}
