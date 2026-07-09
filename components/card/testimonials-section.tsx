import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { MotionItem, MotionSection } from "@/components/card/motion-section";
import type { TestimonialItem } from "@/lib/card-sections";

function TestimonialCard({
  testimonial,
  className,
  flat,
}: {
  testimonial: TestimonialItem;
  className?: string;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-xl p-3.5 text-sm",
        flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, star) => (
          <Star
            key={star}
            className="size-3.5"
            style={{ color: "var(--brand)" }}
            fill={star < testimonial.rating ? "var(--brand)" : "none"}
          />
        ))}
      </div>
      <p className="leading-relaxed text-foreground/90">&ldquo;{testimonial.review}&rdquo;</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{testimonial.client_name}</span>
        {(testimonial.designation || testimonial.company) &&
          ` — ${[testimonial.designation, testimonial.company].filter(Boolean).join(", ")}`}
      </p>
    </div>
  );
}

export function TestimonialsSection({
  testimonials,
  flat,
}: {
  testimonials: TestimonialItem[];
  flat?: boolean;
}) {
  if (testimonials.length === 0) return null;

  const scrollable = testimonials.length > 2;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">Testimonials</h3>
      <MotionSection
        stagger
        className={
          scrollable
            ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
            : "flex flex-col gap-2"
        }
      >
        {testimonials.map((testimonial, i) => (
          <MotionItem key={i} className={scrollable ? "w-[85%] shrink-0 snap-center sm:w-[360px]" : undefined}>
            <TestimonialCard testimonial={testimonial} className="h-full" flat={flat} />
          </MotionItem>
        ))}
      </MotionSection>
    </div>
  );
}
