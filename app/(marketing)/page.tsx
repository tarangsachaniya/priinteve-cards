import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronRightIcon,
  QrCodeIcon,
  RefreshCwIcon,
  ShareIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  Wifi,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { TemplatesSection } from "@/components/marketing/templates-section";
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
  headline: "One card. Every way to connect.",
  subheadline:
    "Share your contact details, socials, and portfolio with a single tap or scan — no app required.",
  cta_label: "Get Your Card",
  social_proof: "Trusted by thousands of professionals to make lasting first impressions.",
};

const FEATURES = [
  {
    icon: SmartphoneIcon,
    title: "Tap to share",
    description: "NFC-enabled cards share your profile the instant you tap a phone.",
  },
  {
    icon: QrCodeIcon,
    title: "Scan to share",
    description: "A built-in QR code works with any smartphone camera, no app needed.",
  },
  {
    icon: RefreshCwIcon,
    title: "Always up to date",
    description: "Update your details anytime — everyone you've shared with sees the latest version.",
  },
  {
    icon: ShareIcon,
    title: "One link, everywhere",
    description: "Contact info, socials, and portfolio — all live behind a single shareable profile.",
  },
];

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
  { value: "500k+", label: "Profile taps & scans" },
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
    getSiteContentList<{ name: string }>("homepage_logos"),
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
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-20 pb-24 lg:grid-cols-2 lg:pt-28 lg:pb-32">
          <div className="text-center lg:text-left">
            <Badge
              variant="outline"
              className="h-auto gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1.5 text-primary"
            >
              <Wifi className="size-3.5" />
              Digital business cards, reimagined
            </Badge>

            <h1 className="text-gradient mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {hero.headline ?? HERO_DEFAULTS.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
              {hero.subheadline ?? HERO_DEFAULTS.subheadline}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button size="xl" render={<Link href="/signup" />}>
                {hero.cta_label ?? HERO_DEFAULTS.cta_label}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button size="xl" variant="outline" render={<Link href="/how-it-works" />}>
                See how it works
              </Button>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 lg:items-start">
              <p className="text-sm text-muted-foreground">
                {hero.social_proof ?? HERO_DEFAULTS.social_proof}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                {TRUST_BADGES.map((badge) => (
                  <span
                    key={badge.label}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <badge.icon className="size-3.5 text-primary" />
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 rotate-6 rounded-3xl bg-gradient-to-br from-primary to-emerald-700 opacity-25 blur-3xl" />
            <div className="shadow-glow relative -rotate-3 rounded-3xl border border-border/60 bg-card p-6 transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-lg font-semibold text-primary-foreground">
                  JS
                </div>
                <div>
                  <p className="font-semibold">Jordan Smith</p>
                  <p className="text-sm text-muted-foreground">Product Designer</p>
                </div>
                <span className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Wifi className="size-4 text-primary" />
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="h-2 w-3/4 rounded-full bg-muted" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
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

            <div className="shadow-elevated absolute -bottom-5 -left-6 hidden items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 sm:flex">
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <BadgeCheckIcon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Profile updated</p>
                <p className="text-[11px] text-muted-foreground">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LogoMarquee logos={logos} />

      <section className="border-y border-border/80 bg-muted/30">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <TemplatesSection templates={templates} />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Why DigitalCard
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Everything a paper card can&apos;t do
          </h2>
          <p className="mt-3 text-muted-foreground">
            One profile that works everywhere you network — in person, online, or on the go.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/80 bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Get your digital business card live in minutes.</p>
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

      <VideoDemoSection
        videoUrl={video.videoUrl}
        caption={video.caption}
        durationLabel={video.durationLabel}
      />

      <section className="mx-auto max-w-6xl px-6 py-20" id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Pricing
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Plans that scale with your team
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every plan includes unlimited profile updates. Choose what fits how you network.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards plans={plans} />
        </div>
        <div className="mt-10 text-center">
          <Button variant="link" render={<Link href="/pricing" />}>
            Compare all plans
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="border-t border-border/80 bg-muted/30 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mx-auto max-w-xl text-center">
              <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
                FAQ
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Questions, answered</h2>
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
