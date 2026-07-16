import { CreditCard, Share2, UserPlus } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal, RevealItem } from "@/components/ui/reveal";

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign up",
    description: "Create your account and pick a plan that fits how you network.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Build your card",
    description: "Add your details, links, and branding to your profile.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Share it",
    description: "Tap, scan, or send your card to anyone, anywhere.",
  },
];

export function HowItWorks() {
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
          {STEPS.map((step) => (
            <RevealItem key={step.number} className="relative flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </span>
              <step.icon className="mt-5 size-6 text-foreground" strokeWidth={1.5} />
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
