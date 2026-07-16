import { PlayIcon } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";

export function VideoDemo() {
  return (
    <section className="bg-ink py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            See a card built, tapped, and updated.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="relative mt-12 aspect-video overflow-hidden rounded-[1.5rem] border border-white/10">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(198,241,53,0.18),transparent_55%),linear-gradient(135deg,#1b1d1a,#0b0c0a)]"
          />
          <button
            type="button"
            aria-label="Play product demo video"
            className="group absolute inset-0 flex items-center justify-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary transition-transform duration-300 group-hover:scale-105">
              <PlayIcon className="ml-1 size-6 fill-ink text-ink" />
            </span>
          </button>
          <span className="absolute bottom-5 left-6 font-mono text-xs text-white/60">1:24</span>
        </Reveal>

        <p className="mt-5 text-sm text-ink-muted">
          A two-minute walkthrough of building a profile, ordering a card, and sharing it live.
        </p>
      </div>
    </section>
  );
}
