import type { RestoItemBadge } from "@prisma/client";

/**
 * Formatting for the presentation fields the customer template renders.
 *
 * Every helper returns null when there is nothing worth showing, so the UI can
 * omit a block rather than render an empty one — a restaurant that filled in
 * half the form still looks deliberate.
 */

/** Stored ×10 (see Restaurant.ratingValue); read back as "4.7". */
export function formatRating(value: number | null | undefined): string | null {
  if (value == null) return null;
  return (value / 10).toFixed(1);
}

/** "2,148" — the review count beside a rating. */
export function formatRatingCount(count: number | null | undefined): string | null {
  if (count == null) return null;
  return new Intl.NumberFormat("en-IN").format(count);
}

/** "30–40 min", or "30 min" when only one bound is set. */
export function formatPrepTime(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min != null && max != null) return min === max ? `${min} min` : `${min}–${max} min`;
  const single = min ?? max;
  return single == null ? null : `${single} min`;
}

/** "₹900 for two". Deliberately not formatCurrency: no decimals, no space. */
export function formatCostForTwo(value: number | null | undefined): string | null {
  return value == null ? null : `₹${new Intl.NumberFormat("en-IN").format(value)} for two`;
}

export const ITEM_BADGE_LABEL: Record<RestoItemBadge, string> = {
  BESTSELLER: "Bestseller",
  CHEFS_PICK: "Chef's pick",
  POPULAR: "Popular",
  NEW: "New",
};

export const ITEM_BADGE_OPTIONS: { value: RestoItemBadge; label: string }[] = (
  Object.keys(ITEM_BADGE_LABEL) as RestoItemBadge[]
).map((value) => ({ value, label: ITEM_BADGE_LABEL[value] }));
