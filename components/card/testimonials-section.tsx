import { Star } from "lucide-react";

import type { TestimonialItem } from "@/lib/card-sections";

export function TestimonialsSection({ testimonials }: { testimonials: TestimonialItem[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">Testimonials</h3>
      <div className="flex flex-col gap-2">
        {testimonials.map((testimonial, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-sm">
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
        ))}
      </div>
    </div>
  );
}
