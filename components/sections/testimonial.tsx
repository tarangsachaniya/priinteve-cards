import { Star } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { HomepageTestimonialInput } from "@/lib/validations/admin";

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Testimonial({ testimonials }: { testimonials: HomepageTestimonialInput[] }) {
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal>
          <SectionHeader eyebrow="Testimonials" title="Loved by people who network for a living." />
        </Reveal>

        <Reveal
          stagger
          className={`mt-14 grid gap-6 ${
            testimonials.length === 1
              ? "mx-auto max-w-xl"
              : testimonials.length === 2
                ? "sm:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {testimonials.map((testimonial, index) => (
            <RevealItem
              key={`${testimonial.name}-${index}`}
              className="flex flex-col rounded-2xl border border-border bg-white p-7"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className={`size-3.5 ${
                      star < testimonial.rating ? "fill-primary text-primary" : "text-border"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {initialsFor(testimonial.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
