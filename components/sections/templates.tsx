import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronRightIcon,
  HeartPulse,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { Reveal, RevealItem } from "@/components/ui/reveal";
import type { HomepageAccent, HomepageTemplateInput } from "@/lib/validations/admin";

const ICON_KEYWORDS: [RegExp, LucideIcon][] = [
  [/real estate|property|listing/i, Building2],
  [/sales|rep|corporate/i, TrendingUp],
  [/health|clinic|medical|patient/i, HeartPulse],
  [/restaurant|retail|hospitality|food|menu/i, UtensilsCrossed],
  [/event|wedding|conference/i, CalendarDays],
  [/freelance|creator|coach|consult|studio/i, Sparkles],
];

function iconForIndustry(industry: string): LucideIcon {
  const match = ICON_KEYWORDS.find(([pattern]) => pattern.test(industry));
  return match ? match[1] : LayoutTemplate;
}

const ACCENT_STYLES: Record<HomepageAccent, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function Templates({ templates }: { templates: HomepageTemplateInput[] }) {
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
          {templates.map((template) => {
            const Icon = iconForIndustry(template.industry);
            return (
              <RevealItem
                key={template.industry}
                className="rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-full ${ACCENT_STYLES[template.accent]}`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{template.industry}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {template.description}
                </p>
              </RevealItem>
            );
          })}
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
