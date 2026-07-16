"use client";

import { useState } from "react";
import { BarChart3, CheckIcon, Target, UserCircle, Users, Zap } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Zap,
    label: "Instant sharing",
    title: "Live in under a second.",
    description: "Tap, scan, or send — your profile opens instantly, on any phone.",
    bullets: [
      "Works with any NFC-enabled phone, no app required",
      "Every card ships with a QR code as a backup",
      "Opens directly in the browser, no install",
    ],
  },
  {
    icon: UserCircle,
    label: "Custom profile",
    title: "Unmistakably you.",
    description: "Brand your profile with your colors, photo, and links.",
    bullets: [
      "Match your brand colors, logo, and photo",
      "Add unlimited links and social profiles",
      "Update anytime — everyone sees the latest version",
    ],
  },
  {
    icon: Target,
    label: "Lead capture",
    title: "Every tap, a saved contact.",
    description: "Turn a handshake into a lead, automatically.",
    bullets: [
      "Recipients save your info in one tap",
      "Collect their details back with an opt-in form",
      "Export captured leads anytime",
    ],
  },
  {
    icon: BarChart3,
    label: "Analytics",
    title: "Know what's working.",
    description: "See exactly who's engaging with your card and when.",
    bullets: [
      "Track taps, scans, and profile views",
      "See which links get clicked most",
      "Daily and weekly summaries",
    ],
  },
  {
    icon: Users,
    label: "Team management",
    title: "Every rep, on-brand.",
    description: "Keep every teammate's card consistent and up to date.",
    bullets: [
      "Manage every teammate's card from one dashboard",
      "Enforce brand colors and templates",
      "Deactivate a card instantly when someone leaves",
    ],
  },
];

export function FeaturesTabs() {
  const [active, setActive] = useState(0);
  const feature = FEATURES[active];

  return (
    <section id="features" className="bg-secondary py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal>
          <SectionHeader eyebrow="Features" title="Everything a paper card can't do." />
        </Reveal>

        <Reveal className="mt-12 flex flex-wrap justify-center gap-2">
          {FEATURES.map((f, index) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active === index
                  ? "bg-ink text-white shadow-md"
                  : "bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-12 grid items-center gap-10 rounded-[1.5rem] border border-border bg-white p-8 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div>
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <feature.icon className="size-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{feature.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {feature.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(198,241,53,0.25),transparent_60%)]"
            />
            <span className="relative flex size-24 items-center justify-center rounded-full bg-white shadow-lg">
              <feature.icon className="size-10 text-foreground" strokeWidth={1.25} />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
