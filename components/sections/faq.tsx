import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import type { FaqItem } from "@/lib/site-content";

export function Faq({ items: FAQS }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-20">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Questions? We&apos;ve got answers.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="mailto:hello@tapcard.co" className="font-semibold text-foreground hover:underline">
                Reach out to our team
              </Link>
              .
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion>
              {FAQS.map((faq, index) => (
                <AccordionItem key={faq.question} value={index}>
                  <AccordionTrigger className="py-5 text-base">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="pr-8 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
