"use client";

import { useState } from "react";
import {
  CheckIcon,
  QrCodeIcon,
  RefreshCwIcon,
  ShareIcon,
  SmartphoneIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: SmartphoneIcon,
    title: "Tap to share",
    description: "NFC-enabled cards share your profile the instant you tap a phone.",
    bullets: [
      "Works with any NFC-enabled phone, no app required",
      "Card taps open your profile in under a second",
      "Pair a physical NFC card or use your phone as the tag",
      "Reads reliably through phone cases",
    ],
  },
  {
    icon: QrCodeIcon,
    title: "Scan to share",
    description: "A built-in QR code works with any smartphone camera, no app needed.",
    bullets: [
      "Every profile ships with a unique QR code",
      "Print it on signage, packaging, or a lanyard",
      "Scans open directly in the browser — no install",
      "Swap the destination anytime without reprinting",
    ],
  },
  {
    icon: RefreshCwIcon,
    title: "Always up to date",
    description: "Update your details anytime — everyone you've shared with sees the latest version.",
    bullets: [
      "Edit your title, links, or photo in seconds",
      "Changes go live instantly for everyone with your card",
      "No reprints when you switch roles or companies",
      "One profile stays current across every channel",
    ],
  },
  {
    icon: ShareIcon,
    title: "One link, everywhere",
    description: "Contact info, socials, and portfolio — all live behind a single shareable profile.",
    bullets: [
      "Contact info, socials, and portfolio in one place",
      "Add it to an email signature or LinkedIn bio",
      "Works identically on iOS, Android, and desktop",
      "Save straight to contacts with one tap",
    ],
  },
];

export function FeaturesTabsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = FEATURES[activeIndex];

  if (!active) return null;

  return (
    <section className="border-y border-border/60 bg-section-alt py-24 md:py-28">
      <div className="mx-auto max-w-[1360px] px-6">
      <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
          Features
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a paper card can&apos;t do
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          One profile that works everywhere you network — in person, online, or on the go.
        </p>
      </div>

      <div className="reveal-on-scroll mt-14 grid gap-3 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start lg:gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0">
          {FEATURES.map((feature, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={feature.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex shrink-0 items-start gap-3.5 rounded-xl border border-transparent px-4 py-3.5 text-left transition-all duration-300 lg:shrink",
                  isActive
                    ? "shadow-card-sm border-border/60 bg-card ring-1 ring-foreground/5"
                    : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "shadow-sm shadow-primary/30 bg-primary text-primary-foreground"
                      : "text-primary"
                  )}
                >
                  <feature.icon className="size-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{feature.title}</span>
                  <span className="mt-0.5 hidden text-xs text-muted-foreground lg:block">
                    {feature.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="shadow-card-sm min-h-[22rem] rounded-2xl border border-border/60 bg-card p-8 ring-1 ring-foreground/5 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{active.title}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{active.description}</p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-primary">
              <active.icon className="size-6" />
            </span>
          </div>

          <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {active.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full text-primary">
                  <CheckIcon className="size-3" />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </section>
  );
}
