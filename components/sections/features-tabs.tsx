"use client";

import { useState } from "react";
import { BarChart3, CheckIcon, Target, UserCircle, Users, Zap, type LucideIcon } from "lucide-react";

import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { HomepageFeatureInput } from "@/lib/validations/admin";

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  "user-circle": UserCircle,
  target: Target,
  "bar-chart-3": BarChart3,
  users: Users,
};

export function FeaturesTabs({ features }: { features: HomepageFeatureInput[] }) {
  const [active, setActive] = useState(0);
  const feature = features[active];
  const Icon = ICON_MAP[feature.icon] ?? Zap;
  const bullets = feature.bullets.split("\n").filter(Boolean);

  return (
    <section id="features" className="bg-secondary py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal>
          <SectionHeader eyebrow="Features" title="Everything a paper card can't do." />
        </Reveal>

        <Reveal className="mt-12 flex flex-wrap justify-center gap-2">
          {features.map((f, index) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                active === index
                  ? "bg-ink text-white shadow-md"
                  : "bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="mt-12 grid items-center gap-10 rounded-[1.5rem] border border-border bg-white p-8 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div>
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{feature.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(198,241,53,0.25),transparent_60%)]"
            />
            <span className="relative flex size-24 items-center justify-center rounded-full bg-white shadow-lg">
              <Icon className="size-10 text-foreground" strokeWidth={1.25} />
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
