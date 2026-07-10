import { Quote, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type TestimonialItem = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export function MarketingTestimonialsSection({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1360px] px-6 py-24 md:py-28">
        <div className="reveal-on-scroll mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1 shadow-xs-token">
            Customers
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Loved by people who network for a living
          </h2>
        </div>

        <div className="reveal-on-scroll mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="shadow-card-sm hover:shadow-card-lg relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-8 ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-1"
            >
              <Quote className="size-7 text-primary/15" fill="currentColor" />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className="size-3.5 text-primary"
                    fill={star < testimonial.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="text-base leading-relaxed text-foreground/90">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-primary">
                  {testimonial.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}
