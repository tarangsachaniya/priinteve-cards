import Link from "next/link";
import { ArrowRightIcon, Nfc, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { HomepageHero } from "@/lib/site-content";

export function Hero({ hero, ctaHref }: { hero: HomepageHero; ctaHref: string }) {
  return (
    <section className="relative overflow-hidden bg-ink pt-40 pb-28 lg:pt-48 lg:pb-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[36rem] bg-[radial-gradient(ellipse_60%_60%_at_65%_40%,rgba(198,241,53,0.16),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 lg:grid-cols-2 lg:gap-12 lg:px-20">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Digital business cards
          </p>
          <h1 className="mt-5 text-[2.75rem] leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-6xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">{hero.subheadline}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" render={<Link href={ctaHref} />}>
              {hero.ctaLabel}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/25 text-white hover:bg-white hover:text-ink"
              render={<Link href="#how-it-works" />}
            >
              See how it works
            </Button>
          </div>
          <p className="mt-6 max-w-md text-sm text-ink-muted/80">{hero.socialProof}</p>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto flex h-[22rem] w-full max-w-md items-center justify-center sm:h-[26rem]">
          {/* Back card */}
          <div className="absolute top-6 right-2 aspect-[1.586/1] w-[80%] rotate-[10deg] rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#DCEFA8] to-[#AEDB6F] shadow-2xl sm:w-[75%]">
            <div className="flex h-full flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight text-ink">Tapcard</span>
                <Wifi className="size-4 text-ink/60" />
              </div>
              <div className="h-6 w-9 rounded-md bg-ink/15" />
            </div>
          </div>

          {/* Front card */}
          <div className="absolute -bottom-4 left-2 aspect-[1.586/1] w-[80%] -rotate-[8deg] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,#1b1d1a_0%,#111311_60%)] shadow-2xl sm:w-[75%]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(198,241,53,0.14)_50%,transparent_65%)]"
            />
            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight text-white">Tapcard</span>
                <Nfc className="size-4 text-primary" />
              </div>
              <div className="h-6 w-9 rounded-md bg-gradient-to-br from-primary to-primary/60" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
