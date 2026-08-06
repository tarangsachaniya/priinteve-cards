"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TestimonialItem } from "@/lib/card-sections";

function TestimonialQuote({ testimonial }: { testimonial: TestimonialItem }) {
  return (
    <div className="pe-quote">
      <div className="pe-quote-stars">
        {Array.from({ length: 5 }).map((_, star) => (
          <Star key={star} fill={star < testimonial.rating ? "currentColor" : "none"} />
        ))}
      </div>
      <p className="pe-quote-mark" aria-hidden="true">
        &ldquo;
      </p>
      <p className="pe-quote-text">{testimonial.review}</p>
      <p className="pe-quote-attr">
        <b>{testimonial.client_name}</b>
        {(testimonial.designation || testimonial.company) &&
          ` · ${[testimonial.designation, testimonial.company].filter(Boolean).join(", ")}`}
      </p>
    </div>
  );
}

export function TestimonialsSection({
  testimonials,
  showTitle = true,
}: {
  testimonials: TestimonialItem[];
  /** False when a caller already renders its own heading around this section. */
  showTitle?: boolean;
}) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  if (testimonials.length === 0) return null;

  const hasMultiple = testimonials.length > 1;
  const goTo = (i: number) => setActive((i + testimonials.length) % testimonials.length);

  return (
    <div className="flex w-full flex-col gap-2">
      {showTitle && <h3 className="px-1 text-sm font-semibold text-foreground/90">Testimonials</h3>}
      <div className="pe-quote-card">
        {reduceMotion ? (
          <TestimonialQuote testimonial={testimonials[active]} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <TestimonialQuote testimonial={testimonials[active]} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      {hasMultiple && (
        <div className="pe-quote-nav">
          <button
            type="button"
            className="pe-quote-arrow"
            onClick={() => goTo(active - 1)}
            aria-label="Previous testimonial"
          >
            <ChevronLeft aria-hidden />
          </button>
          <div className="pe-quote-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn("pe-quote-dot", i === active && "is-active")}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === active}
              />
            ))}
          </div>
          <button
            type="button"
            className="pe-quote-arrow"
            onClick={() => goTo(active + 1)}
            aria-label="Next testimonial"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
