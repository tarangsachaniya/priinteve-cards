import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  QrCodeIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { TemplatesSection } from "@/components/marketing/templates-section";
import { FeaturesTabsSection } from "@/components/marketing/features-tabs-section";
import { CardPreviewSection } from "@/components/marketing/card-preview-section";
import { AnalyticsShowcaseSection } from "@/components/marketing/analytics-showcase-section";
import { ComparisonSection } from "@/components/marketing/comparison-section";
import { MarketingTestimonialsSection } from "@/components/marketing/testimonials-section";
import { VideoDemoSection } from "@/components/marketing/video-demo-section";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  getSiteContentEntries,
  getSiteContentList,
  getSiteContentMap,
} from "@/lib/site-content";
import { getActivePlans } from "@/lib/plans";
import type { HomepageAccent } from "@/lib/validations/admin";

export const revalidate = 3600;

const HERO_DEFAULTS = {
  headline: "One tap. Every way to connect.",
  subheadline:
    "Share your contact details, socials, and portfolio the instant you meet someone — by tap, scan, or link. No app, no reprint, no lost opportunity.",
  cta_label: "Create Your Card",
  social_proof: "Trusted by thousands of professionals to make lasting first impressions.",
};

const STEPS = [
  {
    title: "Sign up",
    description: "Create your account and choose a plan that fits how you network.",
  },
  {
    title: "Build your card",
    description: "Add your details, links, and gallery with our guided setup.",
  },
  {
    title: "Share it",
    description: "Tap your NFC card or share your QR code — anywhere, instantly.",
  },
];

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

export default async function HomePage() {
  const [hero, logos, templates, testimonials, video, faqs, plans] = await Promise.all([
    getSiteContentMap("homepage_hero"),
    getSiteContentList<{ name: string; logoUrl?: string }>("homepage_logos"),
    getSiteContentList<{ industry: string; description: string; accent: HomepageAccent }>(
      "homepage_templates"
    ),
    getSiteContentList<{ name: string; role: string; quote: string; rating: number }>(
      "homepage_testimonials"
    ),
    getSiteContentMap("homepage_video"),
    getSiteContentEntries("faq"),
    getActivePlans(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-20 opacity-40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-24 pb-28 lg:grid-cols-2 lg:pt-28 lg:pb-36">
          <div className="text-center lg:text-left">
            <Badge
              variant="outline"
              className="h-auto gap-2 rounded-full border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Digital business cards, reimagined
            </Badge>

            <h1 className="text-gradient mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {hero.headline ?? HERO_DEFAULTS.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
              {hero.subheadline ?? HERO_DEFAULTS.subheadline}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                size="xl"
                className="bg-foreground text-background shadow-sm shadow-foreground/20 hover:bg-foreground/90 hover:shadow-md"
                render={<Link href="/signup" />}
              >
                {hero.cta_label ?? HERO_DEFAULTS.cta_label}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button size="xl" variant="outline" render={<Link href="/how-it-works" />}>
                Live Demo
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                >
                  <badge.icon className="size-4 text-primary" />
                  {badge.label}
                </span>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-y-6 border-t border-border/70 pt-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none lg:w-[27rem]">
            <div className="absolute inset-0 rotate-6 rounded-3xl bg-gradient-to-br from-primary to-emerald-700 opacity-25 blur-3xl lg:inset-x-10" />

            {/* Peeking second device — subtle depth accent, desktop only */}
            <div
              aria-hidden
              className="absolute -right-10 -bottom-16 hidden h-52 w-28 -z-10 rotate-12 rounded-[2rem] bg-gradient-to-br from-foreground/15 to-foreground/5 opacity-70 blur-[1px] lg:block"
            />

            {/* Phone frame — desktop only, mobile just shows the card below */}
            <div className="relative mx-auto hidden w-56 lg:block">
              <div className="relative rounded-[2.75rem] border border-border/80 bg-foreground p-3 shadow-2xl">
                <div
                  aria-hidden
                  className="absolute top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground"
                />
                <div className="flex h-[420px] flex-col gap-3 overflow-hidden rounded-[2.1rem] bg-card p-4 pt-9">
                  <div className="h-14 w-full shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-700/10" />
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-[11px] font-semibold text-primary-foreground">
                      JS
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 w-3/4 rounded-full bg-muted" />
                      <div className="h-2 w-1/2 rounded-full bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-7 rounded-lg bg-muted/60" />
                    <div className="h-7 rounded-lg bg-muted/60" />
                    <div className="h-7 rounded-lg bg-muted/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card — the mobile hero visual, and overlaps the phone on desktop */}
            <div className="shadow-glow relative z-10 mx-auto w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 transition-transform duration-300 hover:-translate-y-1 lg:absolute lg:top-16 lg:right-0 lg:left-auto lg:mx-0 lg:max-w-[19rem] lg:translate-x-10">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-lg font-semibold text-primary-foreground">
                  JS
                </div>
                <div>
                  <p className="font-semibold">Jordan Smith</p>
                  <p className="text-sm text-muted-foreground">Product Designer, Nimbus</p>
                </div>
                <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Wifi className="size-4 text-primary" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Portfolio", "LinkedIn", "Contact"].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border/60 bg-muted/40 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <span className="text-xs font-medium text-muted-foreground">Tap or scan to save</span>
                <QrCodeIcon className="size-8 text-primary" />
              </div>
            </div>

            {/* "Profile updated" toast — desktop only */}
            <div className="shadow-elevated absolute bottom-14 -left-6 z-20 hidden items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 lg:flex">
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <BadgeCheckIcon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Profile updated</p>
                <p className="text-[11px] text-muted-foreground">Just now</p>
              </div>
            </div>

            {/* "NFC + QR enabled" pill — desktop only */}
            <div className="absolute -bottom-6 right-8 z-20 hidden items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background lg:flex">
              <Wifi className="size-3.5" />
              NFC + QR enabled
            </div>
          </div>
        </div>
      </section>

      <LogoMarquee logos={logos} />

      <section className="border-y border-border/80 bg-muted/30">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-8 px-6 py-14 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-border/70">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:px-4">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <TemplatesSection templates={templates} />

      <FeaturesTabsSection />

      <CardPreviewSection />

      <section className="border-y border-border/80 bg-muted/30 py-24 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Get your digital business card live in minutes.
            </p>
          </div>

          <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
            <div
              aria-hidden
              className="absolute top-5 right-[16.5%] left-[16.5%] hidden h-px bg-gradient-to-r from-primary/60 via-border to-primary/60 sm:block"
            />
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="link" render={<Link href="/how-it-works" />}>
              Read the full walkthrough
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      <MarketingTestimonialsSection testimonials={testimonials} />

      <AnalyticsShowcaseSection />

      <VideoDemoSection
        videoUrl={video.videoUrl}
        caption={video.caption}
        durationLabel={video.durationLabel}
      />

      <ComparisonSection />

      <section className="relative overflow-hidden py-24 md:py-28" id="pricing">
        <div
          aria-hidden
          className="bg-dot mask-fade-b pointer-events-none absolute inset-0 -z-20 opacity-30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
              Pricing
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Plans that scale with your team
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Every plan includes unlimited profile updates. Choose what fits how you network.
            </p>
          </div>
          <div className="mt-14">
            <PricingCards plans={plans} />
          </div>
          <div className="mt-10 text-center">
            <Button variant="link" render={<Link href="/pricing" />}>
              Compare all plans
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="border-t border-border/80 bg-muted/30 py-24 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mx-auto max-w-xl text-center">
              <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
                FAQ
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Questions, answered
              </h2>
            </div>
            <div className="mt-12">
              <FaqAccordion faqs={faqs} limit={6} />
            </div>
            <div className="mt-10 text-center">
              <Button variant="link" render={<Link href="/faq" />}>
                View all FAQs
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
