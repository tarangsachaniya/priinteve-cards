import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronRightIcon,
  HeartPulse,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

import { Reveal, RevealItem } from "@/components/ui/reveal";

const TEMPLATES = [
  {
    icon: Building2,
    name: "Real Estate",
    description: "Listings, virtual tours, and instant contact for every open house.",
  },
  {
    icon: TrendingUp,
    name: "Sales",
    description: "One tap hands over your calendar link, deck, and direct line.",
  },
  {
    icon: Sparkles,
    name: "Freelancers & Creators",
    description: "Portfolio, socials, and booking link the moment you meet a client.",
  },
  {
    icon: HeartPulse,
    name: "Healthcare",
    description: "Clinic hours, location, and booking details in one calm profile.",
  },
  {
    icon: UtensilsCrossed,
    name: "Restaurants",
    description: "Menu, reservations, and reviews without a single reprint.",
  },
  {
    icon: CalendarDays,
    name: "Events",
    description: "Swap contact info with a hundred people without running out of cards.",
  },
];

export function Templates() {
  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-20">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeaderInline />
          <Link
            href="#pricing"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-foreground hover:underline sm:flex"
          >
            Compare all templates
            <ChevronRightIcon className="size-4" />
          </Link>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <RevealItem
              key={template.name}
              className="rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
                <template.icon className="size-5 text-foreground" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{template.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function SectionHeaderInline() {
  return (
    <div className="max-w-xl">
      <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Templates</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        A card for every kind of business.
      </h2>
    </div>
  );
}
