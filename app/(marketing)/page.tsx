import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/hero-section";
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
      <HeroSection hero={hero} />

      <LogoMarquee logos={logos} />

      {/* <section className="border-y border-border/60 bg-section-alt">
        <div className="reveal-on-scroll mx-auto grid max-w-5xl grid-cols-2 gap-y-8 px-6 py-14 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-border/50">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:px-4">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section> */}

      <TemplatesSection templates={templates} />

      <FeaturesTabsSection />

      <CardPreviewSection />

      <section className="border-y border-border/60 bg-section-alt py-24 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="reveal-on-scroll mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Get your digital business card live in minutes.
            </p>
          </div>

          <div className="reveal-on-scroll relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
            <div
              aria-hidden
              className="absolute top-5 right-[16.5%] left-[16.5%] hidden h-px bg-gradient-to-r from-primary/60 via-border to-primary/60 sm:block"
            />
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-navy text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30">
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
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-[1360px] px-6">
          <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
              Pricing
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Plans that scale with your team
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Every plan includes unlimited profile updates. Choose what fits how you network.
            </p>
          </div>
          <div className="reveal-on-scroll mt-14">
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
        <section className="border-t border-border/60 bg-section-alt py-24 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="reveal-on-scroll mx-auto max-w-xl text-center">
              <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
                FAQ
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Questions, answered
              </h2>
            </div>
            <div className="reveal-on-scroll mt-12">
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
