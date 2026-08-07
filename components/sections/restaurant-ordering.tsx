import Link from "next/link";
import {
  Bike,
  CreditCard,
  QrCode,
  ReceiptText,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, RevealItem } from "@/components/ui/reveal";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: QrCode,
    title: "A QR code on every table",
    description:
      "Each table gets its own link. Guests scan, and the menu opens on their phone — no app, no waiting for a card.",
  },
  {
    icon: UtensilsCrossed,
    title: "A menu you control",
    description:
      "Categories, photos and prices you can edit any time. Mark a dish out of stock and it greys out instantly.",
  },
  {
    icon: ReceiptText,
    title: "A live kitchen board",
    description:
      "Orders land the moment they're placed. Move each one from accepted to preparing to ready as you work.",
  },
  {
    icon: CreditCard,
    title: "Paid before it's cooked",
    description:
      "Take UPI, cards and wallets through Razorpay, or let guests settle at the counter. You choose.",
  },
];

const ORDER_TYPES: { icon: LucideIcon; label: string }[] = [
  { icon: Store, label: "Dine-In" },
  { icon: ShoppingBag, label: "Take Away" },
  { icon: Bike, label: "Delivery" },
];

/**
 * Homepage section for the restaurant ordering product. Deliberately static
 * rather than SiteContent-driven — it's a new product line, not a block the
 * admin content editor knows about yet.
 */
export function RestaurantOrdering() {
  return (
    <section id="restaurant-ordering" className="bg-ink py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal>
          <SectionHeader
            tone="dark"
            eyebrow="Also from PrintEve"
            title="QR ordering for your restaurant."
            description="Guests scan the code on their table, browse your menu, and pay — while your kitchen watches every order arrive in real time."
          />
        </Reveal>

        <Reveal stagger className="mt-16 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <RevealItem
              key={feature.title}
              className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-ink">
                <feature.icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {feature.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {ORDER_TYPES.map((type) => (
              <span
                key={type.label}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
              >
                <type.icon className="size-4 text-primary" />
                {type.label}
              </span>
            ))}
          </div>

          <p className="max-w-md text-center text-sm text-ink-muted">
            Turn any of these on or off per outlet — guests only ever see what you offer.
          </p>

          <Button size="lg" render={<Link href="/#contact" />}>
            Talk to us about restaurant ordering
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
