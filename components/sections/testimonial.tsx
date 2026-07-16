import { Star } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const DOTS = ["AM", "RK", "SN", "DP", "PL"];

export function Testimonial() {
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Loved by people who network for a living.
          </h2>

          <div className="mt-10 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, star) => (
              <Star key={star} className="size-4 fill-primary text-primary" />
            ))}
          </div>

          <p className="mt-6 text-xl leading-relaxed font-medium text-balance text-foreground sm:text-2xl">
            &ldquo;I used to hand out twenty cards a week and reprint every time I changed roles.
            Now I tap my Tapcard and people have my whole profile before I&apos;ve finished the
            handshake.&rdquo;
          </p>

          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              TG
            </div>
            <p className="text-sm font-semibold">Tom Griffith</p>
            <p className="text-xs text-muted-foreground">Founder, Growth Collective</p>
          </div>

          <div className="mt-10 flex items-center justify-center -space-x-2">
            {DOTS.map((initials, index) => (
              <div
                key={initials}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white",
                  index % 2 === 0 ? "bg-ink" : "bg-primary text-ink"
                )}
              >
                {initials}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
