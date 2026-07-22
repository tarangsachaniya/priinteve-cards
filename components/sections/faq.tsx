import Link from "next/link";
import { Minus, Plus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { FaqItem } from "@/lib/site-content";

export function Faq({ items: FAQS }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-20">
          <Reveal>
            <SectionHeader
              eyebrow="FAQ"
              title="Questions? We've got answers."
              align="left"
              description={
                <>
                  Can&apos;t find what you&apos;re looking for?{" "}
                  <Link href="mailto:hello@tapcard.co" className="font-semibold text-foreground hover:underline">
                    Reach out to our team
                  </Link>
                  .
                </>
              }
            />
          </Reveal>

          <Reveal stagger delay={0.1}>
            <Accordion>
              {FAQS.map((faq, index) => (
                <RevealItem key={faq.question}>
                  <AccordionItem value={index}>
                    <AccordionTrigger className="py-6 text-base font-semibold **:data-[slot=accordion-trigger-icon]:hidden sm:py-7">
                      <span className="flex flex-1 items-center justify-between gap-4">
                        <span>{faq.question}</span>
                        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 text-primary transition-colors duration-300 group-aria-expanded/accordion-trigger:border-primary group-aria-expanded/accordion-trigger:bg-primary group-aria-expanded/accordion-trigger:text-primary-foreground">
                          <Plus className="size-4 group-aria-expanded/accordion-trigger:hidden" />
                          <Minus className="hidden size-4 group-aria-expanded/accordion-trigger:inline" />
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                </RevealItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
