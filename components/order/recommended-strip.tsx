"use client";

import { Flame, ImageOff, RotateCcw } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { formatServeTime } from "@/lib/restaurant/menu-display";
import type { PublicMenuItem } from "@/components/order/types";

/**
 * A shortcut past the menu: either what everyone is ordering right now, or
 * what this particular guest orders every time.
 *
 * A horizontal strip of compact tiles rather than the full MenuItemCard grid.
 * The card is built for deciding between dishes — description, rating, veg
 * mark, quantity stepper — and eight of them stacked above the menu would bury
 * the menu. These tiles are built for recognising a dish you already half-want
 * and getting it into the cart, so they carry a photo, a name, a price and
 * nothing else. Tapping one opens the options sheet where the dish needs it,
 * exactly as tapping Add on a card does.
 *
 * Deliberately unlabelled as to *why* each dish is here. "Ordered 14 times in
 * the last hour" invites arithmetic about how busy the kitchen is; "You've
 * ordered this 6 times" reads as being watched. The heading says the useful
 * part and stops.
 */
export type StripVariant = "trending" | "favourites";

const VARIANT: Record<StripVariant, { title: string; Icon: typeof Flame }> = {
  trending: { title: "Trending now", Icon: Flame },
  // "Order it again" rather than "Your favourites": it names the action the
  // guest is about to take, and it doesn't claim to know what they like.
  favourites: { title: "Order it again", Icon: RotateCcw },
};

export function RecommendedStrip({
  items,
  variant,
  orderingDisabled,
  onSelect,
}: {
  items: PublicMenuItem[];
  variant: StripVariant;
  orderingDisabled: boolean;
  onSelect: (item: PublicMenuItem) => void;
}) {
  if (items.length === 0) return null;

  const { title, Icon } = VARIANT[variant];

  return (
    <section className="mx-auto mt-6 w-full max-w-[var(--resto-measure)]">
      <h2
        className="resto-display flex items-center gap-1.5 px-4 text-base font-semibold"
        style={{ color: "var(--resto-text)" }}
      >
        <Icon className="size-4" style={{ color: "var(--resto-brand-text)" }} aria-hidden />
        {title}
      </h2>

      <ul className="resto-no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => {
          const serveTime = formatServeTime(item.prepMinutes);

          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item)}
                disabled={orderingDisabled}
                className="flex w-[132px] flex-col gap-2 border p-2 text-left transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: "var(--resto-card)",
                  borderColor: "var(--resto-border)",
                  borderRadius: "var(--resto-radius-lg)",
                  boxShadow: "var(--resto-shadow-card)",
                }}
              >
                {item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="w-full object-cover"
                    style={{
                      aspectRatio: "var(--resto-dish-ratio)",
                      borderRadius: "var(--resto-radius-md)",
                    }}
                  />
                ) : (
                  <span
                    className="flex w-full items-center justify-center"
                    style={{
                      aspectRatio: "var(--resto-dish-ratio)",
                      background: "var(--resto-placeholder)",
                      borderRadius: "var(--resto-radius-md)",
                    }}
                    aria-hidden
                  >
                    <ImageOff className="size-4" style={{ color: "var(--resto-text-subtle)" }} />
                  </span>
                )}

                <span
                  className="line-clamp-2 text-[13px] font-semibold leading-snug"
                  style={{ color: "var(--resto-text)" }}
                >
                  {item.name}
                </span>

                <span className="flex items-baseline justify-between gap-1">
                  <span
                    className="resto-numeric text-[13px] font-semibold"
                    style={{ color: "var(--resto-text)" }}
                  >
                    {formatCurrency(item.price)}
                  </span>
                  {serveTime && (
                    <span
                      className="resto-numeric text-[11px]"
                      style={{ color: "var(--resto-text-muted)" }}
                    >
                      {serveTime}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
