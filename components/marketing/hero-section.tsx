"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ExternalLinkIcon,
  Nfc,
  QrCodeIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_DEFAULTS = {
  headline: "One card. Every way to connect.",
  subheadline:
    "Share your contact details, socials, and portfolio with a single tap or scan — no app required.",
  cta_label: "Get Your Card",
};

const STATS = [
  { value: "10k+", label: "Cards activated" },
  { value: "500k+", label: "Taps & scans" },
  { value: "4.9/5", label: "Average rating" },
  { value: "<2min", label: "To set up a card" },
];

const TRUST_BADGES = [
  { icon: ShieldCheckIcon, label: "Secure by default" },
  { icon: BadgeCheckIcon, label: "No app required" },
  { icon: RefreshCwIcon, label: "Instant updates" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const cardVariants: Variants = {
  idle: {
    rotateX: [12, 16, 12],
    rotateY: [-18, -14, -18],
    y: [0, -9, 0],
    scale: 1,
    transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
  },
  active: {
    rotateX: 0,
    rotateY: 0,
    y: -6,
    scale: 1.05,
    transition: { duration: 0.5, ease: EASE },
  },
};

const cardVariantsStatic: Variants = {
  idle: { rotateX: 14, rotateY: -16, y: 0, scale: 1 },
  active: { rotateX: 0, rotateY: 0, y: -6, scale: 1.05, transition: { duration: 0.2 } },
};

const mockupVariants: Variants = {
  idle: {
    clipPath: "inset(0% 0% 100% 0%)",
    y: -14,
    opacity: 0,
    transition: { duration: 0.3, ease: EASE },
  },
  active: {
    clipPath: "inset(0% 0% 0% 0%)",
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: EASE, delay: 0.16 },
  },
};

const mockupVariantsStatic: Variants = {
  idle: { opacity: 0, y: -8 },
  active: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const sweepVariants: Variants = {
  idle: { opacity: 0, x: "-120%" },
  active: { opacity: 1, x: "120%", transition: { duration: 0.7, ease: EASE, delay: 0.05 } },
};

export function HeroSection({ hero }: { hero: Record<string, string> }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mql.matches);
    const listener = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  const cv = reduceMotion ? cardVariantsStatic : cardVariants;
  const mv = reduceMotion ? mockupVariantsStatic : mockupVariants;

  const pointerHandlers = canHover
    ? {
        onMouseEnter: () => setActive(true),
        onMouseLeave: () => setActive(false),
        onFocus: () => setActive(true),
        onBlur: () => setActive(false),
      }
    : {
        onClick: () => setActive((v) => !v),
      };

  return (
    <section className="relative overflow-hidden bg-[#0a0a0b] py-28 lg:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(20,184,166,0.16),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-[8%] -z-10 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.22),transparent_70%)] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#0a0a0b_0%,#121214_100%)]"
      />

      <div className="mx-auto grid max-w-[1360px] items-center gap-16 px-6 lg:grid-cols-2 lg:gap-12">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-teal-400" />
            Digital business cards, reimagined
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.02em] text-balance text-[#f5f5f5] sm:text-5xl lg:text-[4rem]">
            {hero.headline ?? HERO_DEFAULTS.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/55 lg:mx-0">
            {hero.subheadline ?? HERO_DEFAULTS.subheadline}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button size="xl" render={<Link href="/signup" />}>
              {hero.cta_label ?? HERO_DEFAULTS.cta_label}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10 hover:text-white"
              render={<Link href="/how-it-works" />}
            >
              See it in action
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 lg:justify-start">
            {TRUST_BADGES.map((badge) => (
              <span key={badge.label} className="flex items-center gap-1.5 text-sm font-medium text-white/55">
                <badge.icon className="size-4 text-teal-400" />
                {badge.label}
              </span>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <p className="text-2xl font-semibold tracking-tight text-[#f5f5f5] sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-medium tracking-[0.12em] text-white/45 uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm items-center justify-center [perspective:1600px] lg:max-w-none">
          <div
            className="group relative w-full max-w-[22rem] cursor-pointer outline-none"
            tabIndex={canHover ? 0 : -1}
            role="button"
            aria-label="Preview the digital profile behind this card"
            aria-pressed={active}
            {...pointerHandlers}
          >
            {/* Digital profile mockup — slides out from underneath the card */}
            <motion.div
              variants={mv}
              animate={active ? "active" : "idle"}
              className="shadow-elevated absolute inset-x-6 top-[calc(100%-1.75rem)] z-0 origin-top overflow-hidden rounded-2xl border border-black/5 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-navy text-sm font-semibold text-white">
                  JS
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Jordan Smith</p>
                  <p className="text-xs text-neutral-500">Product Designer, Nimbus</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Portfolio", "LinkedIn", "Contact"].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-2 text-center text-[10.5px] font-medium text-neutral-600"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-100 p-2.5">
                <span className="text-[11px] font-medium text-neutral-500">Tap or scan to save</span>
                <QrCodeIcon className="size-5 text-primary" />
              </div>
            </motion.div>

            {/* NFC card */}
            <motion.div
              variants={cv}
              animate={active ? "active" : "idle"}
              style={{ transformStyle: "preserve-3d" }}
              className="shadow-card-xl relative z-10 aspect-[1.586/1] w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,#232326_0%,#151517_45%,#0c0c0d_100%)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.06)_45%,rgba(212,175,110,0.14)_52%,transparent_70%)]"
              />
              <motion.div
                aria-hidden
                variants={sweepVariants}
                animate={active ? "active" : "idle"}
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.4rem] ring-1 ring-inset ring-white/10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-[linear-gradient(180deg,transparent_0%,transparent_85%,rgba(0,0,0,0.35)_100%)]"
              />

              <div className="relative flex h-full flex-col justify-between p-6">
                <div className="flex items-start justify-between">
                  <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-[#d4af6e] to-[#8c6d3f] shadow-inner" />
                  <Nfc className="size-5 text-white/70" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[15px] font-medium tracking-[0.04em] text-white/90">
                    Jordan Smith
                  </p>
                  <p className="mt-0.5 text-[11px] tracking-[0.08em] text-white/40 uppercase">
                    Product Designer
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              aria-hidden
              animate={{ opacity: active ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              className="absolute -bottom-4 left-1/2 -z-10 h-8 w-4/5 -translate-x-1/2 rounded-full bg-black/50 blur-xl"
            />

            <span
              className={cn(
                "absolute -top-10 right-0 z-20 hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/50 transition-opacity duration-300 lg:flex",
                active ? "opacity-0" : "opacity-100"
              )}
            >
              <ExternalLinkIcon className="size-3" />
              Tap the card
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
