import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSiteContentEntries } from "@/lib/site-content";

export const revalidate = 3600;

const DEFAULT_STEPS = [
  { key: "1", value: "Sign up and choose a plan that fits how you network." },
  { key: "2", value: "Build your card: add your details, links, and gallery." },
  { key: "3", value: "Share it by tapping your NFC card or scanning your QR code." },
];

export default async function HowItWorksPage() {
  const entries = await getSiteContentEntries("how_it_works");
  const steps = entries.length > 0 ? entries : DEFAULT_STEPS;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10 opacity-30"
      />

      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Getting started
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h1>
          <p className="mt-3 text-muted-foreground">
            Get your digital business card live in minutes.
          </p>
        </div>

        <ol className="relative mt-16 flex flex-col gap-10">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-5 hidden w-px bg-gradient-to-b from-primary via-border to-transparent sm:block"
          />
          {steps.map((step, index) => (
            <li key={step.key} className="relative flex gap-5">
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-navy text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30">
                {index + 1}
              </div>
              <div className="rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-sm">
                <p className="text-base text-foreground">{step.value}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-muted/30 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold">Ready to get your card?</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Set up your profile today and start sharing it in minutes.
          </p>
          <Button size="lg" render={<Link href="/signup" />}>
            Get Your Card
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  );
}
