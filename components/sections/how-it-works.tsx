import { CreditCard, Share2, UserPlus, type LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { HowItWorksStep } from "@/lib/site-content";

const STEP_ICONS: LucideIcon[] = [UserPlus, CreditCard, Share2];

export function HowItWorks({ steps }: { steps: HowItWorksStep[] }) {
  return (
    <section id="how-it-works" className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal>
          <SectionHeader eyebrow="How it works" title="Set up in minutes." />
        </Reveal>

        <Reveal stagger className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          <div
            aria-hidden
            className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-border sm:block"
          />
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? UserPlus;
            return (
              <RevealItem key={step.number} className="relative flex flex-col items-center text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </span>
                <Icon className="mt-5 size-6 text-foreground" strokeWidth={1.5} />
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
