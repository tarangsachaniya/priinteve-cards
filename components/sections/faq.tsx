import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";

const FAQS = [
  {
    question: "How does the NFC tap actually work?",
    answer:
      "Your card has a small NFC chip embedded in it. When someone holds their phone near it, their phone reads the chip and opens your profile in their browser — no app, no Bluetooth pairing, nothing to install.",
  },
  {
    question: "Will it work with my phone?",
    answer:
      "Any iPhone from the XS onward and virtually every Android phone from the last six years supports NFC out of the box. Every card also ships with a QR code as a backup for older devices.",
  },
  {
    question: "Can I edit my card after it's printed?",
    answer:
      "Yes — the card itself never changes, it just points to your live profile. Edit your details, links, or photo anytime in your dashboard and everyone who's already tapped your card sees the update instantly.",
  },
  {
    question: "Do you offer team or bulk orders?",
    answer:
      "Yes. Our Premium plan includes a team dashboard for managing every teammate's card, enforcing brand consistency, and ordering in bulk at a discount.",
  },
  {
    question: "What happens to the data I collect?",
    answer:
      "Any contact details captured through your card belong to you. We never sell or share your data or your leads' data with third parties — see our privacy policy for the full details.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard cards ship within 3–5 business days. Expedited shipping is available at checkout for most regions.",
  },
  {
    question: "What's your refund policy?",
    answer:
      "If your card arrives damaged or defective, we'll replace it free of charge. For everything else, we offer a 30-day money-back guarantee on your first order.",
  },
];

export function Faq() {
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
