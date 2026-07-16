import { CheckIcon, XIcon } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";

const ROWS = [
  "Cost per share",
  "Updates after printing",
  "Analytics",
  "Eco-friendly",
  "Works when your phone is dead",
  "Shares full profile — links, video, PDF",
  "Lead capture",
];

export function Comparison() {
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-3xl px-6 lg:px-20">
        <Reveal>
          <SectionHeader eyebrow="Why switch" title="Why go digital?" />
        </Reveal>

        <Reveal delay={0.1} className="mt-14 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1fr_auto_auto] bg-secondary text-sm font-semibold">
            <div className="px-5 py-4 sm:px-6" />
            <div className="w-28 px-4 py-4 text-center text-muted-foreground sm:w-36">Paper card</div>
            <div className="w-28 border-l border-border bg-primary/10 px-4 py-4 text-center text-foreground sm:w-36">
              Tapcard
            </div>
          </div>
          {ROWS.map((row, index) => (
            <div
              key={row}
              className={`grid grid-cols-[1fr_auto_auto] items-center ${index !== ROWS.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="px-5 py-4 text-sm font-medium sm:px-6">{row}</div>
              <div className="flex w-28 items-center justify-center py-4 sm:w-36">
                <XIcon className="size-4 text-muted-foreground/50" />
              </div>
              <div className="flex w-28 items-center justify-center border-l border-border bg-primary/5 py-4 sm:w-36">
                <CheckIcon className="size-4 text-foreground" strokeWidth={3} />
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
