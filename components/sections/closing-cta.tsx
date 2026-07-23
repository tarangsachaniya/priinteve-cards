import Link from "next/link";
import { ArrowRightIcon, Nfc } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { HomepageClosingCta } from "@/lib/site-content";

export function ClosingCta({ content, ctaHref }: { content: HomepageClosingCta; ctaHref: string }) {
  return (
    <section className="px-6 py-16 lg:px-20 lg:py-24">
      <Reveal className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-primary px-8 py-14 sm:px-14 lg:px-20 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="max-w-md text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
              {content.heading}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/70">
              {content.description}
            </p>
            <Button
              size="xl"
              className="mt-8 bg-ink text-white hover:bg-ink/90"
              render={<Link href={ctaHref} />}
            >
              {content.ctaLabel}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>

          <div className="relative mx-auto hidden h-40 w-full max-w-xs sm:block">
            <div className="absolute top-2 right-4 aspect-[1.586/1] w-[75%] rotate-[8deg] rounded-2xl border border-ink/10 bg-ink shadow-xl">
              <div className="flex h-full flex-col justify-between p-5">
                <span className="text-xs font-bold text-white">Tapcard</span>
                <Nfc className="size-4 text-primary" />
              </div>
            </div>
            <div className="absolute top-10 left-0 aspect-[1.586/1] w-[75%] -rotate-[6deg] rounded-2xl border border-ink/10 bg-white shadow-xl">
              <div className="flex h-full flex-col justify-between p-5">
                <span className="text-xs font-bold text-ink">Tapcard</span>
                <div className="h-4 w-6 rounded bg-ink/10" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
