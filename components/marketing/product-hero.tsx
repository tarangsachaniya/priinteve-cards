import Link from "next/link";
import { ArrowRightIcon, CheckIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-20 opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[32rem] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1.5 text-primary"
          >
            {eyebrow}
          </Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>

          <ul className="mt-8 flex flex-col gap-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-primary">
                  <CheckIcon className="size-3.5" />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" render={<Link href="/pricing" />}>
              View plans
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button size="xl" variant="outline" render={<Link href="/how-it-works" />}>
              How it works
            </Button>
          </div>
        </div>

        <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-emerald-700 opacity-20 blur-3xl" />
          <div className="shadow-glow relative flex size-full items-center justify-center rounded-3xl border border-border/60 bg-card">
            <div
              aria-hidden
              className="bg-dot absolute inset-0 rounded-3xl opacity-40"
            />
            <span className="relative flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg shadow-primary/30">
              <Icon className="size-14" strokeWidth={1.25} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
