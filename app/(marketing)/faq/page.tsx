import Link from "next/link";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSiteContentEntries } from "@/lib/site-content";

export const revalidate = 3600;

const DEFAULT_FAQS = [
  { key: "What is a digital business card?", value: "A shareable online profile with your contact details, links, and gallery — accessible via NFC tap or QR scan." },
  { key: "Do I need an app to use it?", value: "No. Recipients just tap your NFC card or scan the QR code with their phone's camera." },
  { key: "Can I update my card after publishing?", value: "Yes, changes to your card are reflected instantly for anyone who visits your link." },
];

export default async function FaqPage() {
  const entries = await getSiteContentEntries("faq");
  const faqs: { key: string; value: string }[] = entries.length > 0 ? entries : DEFAULT_FAQS;

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
          Support
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know before getting your card.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.key}
            className="group rounded-2xl border border-border/80 bg-card px-5 py-4 open:border-primary/30 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
              {faq.key}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{faq.value}</p>
          </details>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 px-6 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircleQuestion className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">Still have questions?</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Can&apos;t find the answer you&apos;re looking for? Our team is happy to help.
        </p>
        <Button variant="outline" render={<Link href="/contact" />}>
          Contact support
        </Button>
      </div>
    </section>
  );
}
