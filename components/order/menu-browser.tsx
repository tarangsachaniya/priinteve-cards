"use client";

import { useMemo, useRef, useState } from "react";
import { Clock, SearchX, UtensilsCrossed } from "lucide-react";

import { CartBar, CartSheet } from "@/components/order/cart-sheet";
import { CheckoutSheet } from "@/components/order/checkout-sheet";
import { ItemOptionsSheet } from "@/components/order/item-options-sheet";
import { MenuItemCard } from "@/components/order/menu-item-card";
import { MenuToolbar } from "@/components/order/menu-toolbar";
import { PlatformCredit } from "@/components/order/platform-credit";
import { RestaurantHero } from "@/components/order/restaurant-hero";
import { ResumeOrderBanner } from "@/components/order/resume-order-banner";
import { ReviewsSection } from "@/components/order/reviews-section";
import { TrackOrderDialog } from "@/components/order/track-order-dialog";
import { isCustomisable, useCart } from "@/components/order/use-cart";
import type {
  PublicMenuCategory,
  PublicMenuItem,
  PublicRestaurant,
  PublicTable,
} from "@/components/order/types";

/**
 * The customer menu.
 *
 * This component owns state only — cart, search, filter, which panel is open —
 * and delegates every pixel to the components below it. It used to render its
 * own hero, toolbar and dish row inline while parallel versions of all three
 * sat unused next to it; keeping rendering out of here is what stops that
 * happening again.
 *
 * Filtering is client-side: a menu is small and already fully loaded, so a
 * round trip per keystroke would be slower and would fail on the patchy
 * connections this page is usually opened over.
 */
export function MenuBrowser({
  restaurant,
  table,
  categories,
}: {
  restaurant: PublicRestaurant;
  table: PublicTable | null;
  categories: PublicMenuCategory[];
}) {
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [panel, setPanel] = useState<"none" | "cart" | "checkout">("none");
  const [optionsFor, setOptionsFor] = useState<PublicMenuItem | null>(null);
  // Independent of `panel`: this is a lookup dialog reachable from anywhere
  // on the page, not a step in the cart → checkout flow.
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const cart = useCart(categories);

  /**
   * A closed restaurant still shows its full menu — browsing is the point of a
   * QR code on a table at 3pm — but nothing can be added to a cart. Hiding the
   * menu instead would leave a guest unable to tell whether the place is shut
   * or the link is broken.
   */
  const { isOpen } = restaurant.openState;

  /**
   * Categories left empty by the filters are dropped entirely rather than
   * shown with a heading and nothing under it — spec §6. The categories
   * themselves still drive the chip row, so the strip does not reflow as the
   * guest types.
   */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
          if (!needle) return true;
          return (
            item.name.toLowerCase().includes(needle) ||
            (item.description?.toLowerCase().includes(needle) ?? false)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, query, vegOnly]);

  const isFiltering = query.trim().length > 0 || vegOnly;

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * A plain dish goes straight into the cart; anything with a size or an
   * add-on has to be asked about first. Tapping + on a card that is already in
   * the cart bumps the plain line, since that is the one the card's count came
   * from.
   */
  function handleAdd(item: PublicMenuItem) {
    if (!isOpen) return;
    if (isCustomisable(item)) {
      setOptionsFor(item);
      return;
    }
    cart.add({ itemId: item.id, variantId: null, addOnIds: [] });
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "var(--resto-bg)" }}>
      <RestaurantHero restaurant={restaurant} table={table} />

      <ResumeOrderBanner slug={restaurant.slug} />

      <div className="mx-auto mt-3 w-full max-w-[var(--resto-measure)] px-4 text-right">
        <button
          type="button"
          onClick={() => setShowTrackOrder(true)}
          className="text-xs font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--resto-text-muted)" }}
        >
          Track my order
        </button>
      </div>

      {!isOpen && (
        <div className="mx-auto mt-6 w-full max-w-[var(--resto-measure)] px-4">
          <p
            className="flex items-center gap-2 border px-4 py-3 text-sm font-medium"
            role="status"
            style={{
              backgroundColor: "var(--resto-error-soft)",
              borderColor: "var(--resto-error)",
              borderRadius: "var(--resto-radius-md)",
              color: "var(--resto-error)",
            }}
          >
            <Clock className="size-4 shrink-0" aria-hidden />
            {restaurant.openState.label}. You can browse the menu, but orders
            aren&apos;t being taken right now.
          </p>
        </div>
      )}

      <div className="mt-6">
        <MenuToolbar
          categories={categories}
          query={query}
          onQueryChange={setQuery}
          vegOnly={vegOnly}
          onVegOnlyChange={setVegOnly}
          activeCategory={activeCategory}
          onCategorySelect={scrollToCategory}
        />
      </div>

      <main className="mx-auto w-full max-w-[var(--resto-measure)] px-4 py-8">
        {categories.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="size-8" aria-hidden />}
            title="The menu isn't ready yet"
            body="Please check back shortly."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-8" aria-hidden />}
            title="No dishes match your search"
            body="Try a different name or clear the filters."
            action={
              isFiltering
                ? {
                    label: "Clear search",
                    onClick: () => {
                      setQuery("");
                      setVegOnly(false);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-8">
            {visible.map((category) => (
              <section
                key={category.id}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="scroll-mt-32"
              >
                <h2
                  className="resto-display text-xl font-semibold"
                  style={{ color: "var(--resto-text)" }}
                >
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mt-1 text-sm" style={{ color: "var(--resto-text-muted)" }}>
                    {category.description}
                  </p>
                )}

                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {category.items.map((item) => {
                    const plainKey = cart.plainLineKey(item);
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        quantity={cart.quantityByItem.get(item.id) ?? 0}
                        orderingDisabled={!isOpen}
                        onAdd={() => handleAdd(item)}
                        onIncrement={() => handleAdd(item)}
                        onDecrement={() => cart.decrement(plainKey)}
                      />
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <ReviewsSection summary={restaurant.reviewSummary} />
      </main>

      <PlatformCredit />

      {cart.itemCount > 0 && panel === "none" && !optionsFor && (
        <CartBar
          itemCount={cart.itemCount}
          subtotal={cart.subtotal}
          onOpen={() => setPanel("cart")}
        />
      )}

      {optionsFor && (
        <ItemOptionsSheet
          item={optionsFor}
          onClose={() => setOptionsFor(null)}
          onConfirm={({ quantity, ...selection }) => {
            cart.add(selection, quantity);
            setOptionsFor(null);
          }}
        />
      )}

      {panel === "cart" && (
        <CartSheet
          lines={cart.lines}
          subtotal={cart.subtotal}
          onClose={() => setPanel("none")}
          onIncrement={cart.increment}
          onDecrement={cart.decrement}
          onCheckout={() => setPanel("checkout")}
        />
      )}

      {panel === "checkout" && (
        <CheckoutSheet
          restaurant={restaurant}
          table={table}
          lines={cart.lines}
          onClose={() => setPanel("cart")}
        />
      )}

      {showTrackOrder && (
        <TrackOrderDialog restaurant={restaurant} onClose={() => setShowTrackOrder(false)} />
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 border border-dashed py-16 text-center"
      style={{ borderColor: "var(--resto-border)", borderRadius: "var(--resto-radius-lg)" }}
    >
      <span style={{ color: "var(--resto-text-subtle)" }}>{icon}</span>
      <div>
        <p className="resto-display text-base font-semibold" style={{ color: "var(--resto-text)" }}>
          {title}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--resto-text-muted)" }}>
          {body}
        </p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--resto-brand-text)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
