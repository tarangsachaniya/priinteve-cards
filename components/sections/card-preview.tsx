import Link from "next/link";
import { Calendar, ExternalLinkIcon, Globe, Mail, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

const DOCK_ICONS = [Phone, MessageCircle, Mail, Globe, Calendar];

export function CardPreview() {
  return (
    <section className="bg-ink py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 lg:grid-cols-2 lg:gap-20 lg:px-20">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Live demo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Your whole business, behind one profile.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
            Photo, title, company, and every way to reach you — all live behind a single link
            that updates the moment you do.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-8 border-white/25 text-white hover:bg-white hover:text-ink"
            render={<Link href="/signup" />}
          >
            Preview your card
          </Button>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto w-full max-w-xs">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
            <div className="h-20 w-full bg-gradient-to-br from-primary/70 to-primary" />
            <div className="-mt-9 flex flex-col items-center px-6 pb-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-ink text-base font-semibold text-white">
                RM
              </div>
              <h3 className="mt-2 text-base font-semibold">Riya Mehta</h3>
              <p className="text-xs text-muted-foreground">Founder, Solace Studio</p>

              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-xs font-semibold text-white">
                Save contact
              </button>

              <div className="mt-4 grid w-full grid-cols-2 gap-2 text-left">
                <div className="rounded-xl bg-secondary px-3 py-2 text-[11px] font-medium">
                  Portfolio
                  <ExternalLinkIcon className="mt-1 size-3 text-muted-foreground" />
                </div>
                <div className="rounded-xl bg-secondary px-3 py-2 text-[11px] font-medium">
                  Calendar
                  <ExternalLinkIcon className="mt-1 size-3 text-muted-foreground" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                {DOCK_ICONS.map((Icon, index) => (
                  <span
                    key={index}
                    className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
                  >
                    <Icon className="size-3.5" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
