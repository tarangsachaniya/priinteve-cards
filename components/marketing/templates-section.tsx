import {
  Briefcase,
  Building2,
  HeartPulse,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { HomepageAccent } from "@/lib/validations/admin";

type TemplateItem = {
  industry: string;
  description: string;
  accent: HomepageAccent;
};

// Tailwind purges classes it can't statically see, so accent → class must be
// a literal lookup, never a template-string interpolation like `bg-${accent}-500`.
// Soft tinted headers keep the tiles calm and on-brand instead of shouting.
const ACCENT_CLASSES: Record<HomepageAccent, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

// Keyword → icon, so admin-added industries still get a sensible glyph.
const INDUSTRY_ICONS: { match: string[]; icon: LucideIcon }[] = [
  { match: ["real estate", "property", "realtor"], icon: Building2 },
  { match: ["freelance", "consult", "agency", "studio"], icon: Briefcase },
  { match: ["health", "clinic", "medical", "dental", "wellness"], icon: HeartPulse },
  { match: ["retail", "hospitality", "shop", "store", "restaurant", "cafe"], icon: Store },
  { match: ["sales", "team", "corporate", "enterprise"], icon: Users },
];

function iconFor(industry: string): LucideIcon {
  const name = industry.toLowerCase();
  return INDUSTRY_ICONS.find((entry) => entry.match.some((m) => name.includes(m)))?.icon ?? Sparkles;
}

export function TemplatesSection({ templates }: { templates: TemplateItem[] }) {
  if (templates.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
          Templates
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          A card for every kind of business
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          Start from a profile built for your industry, then make it yours in minutes.
        </p>
      </div>

      <div className="group relative mt-14 overflow-hidden mask-fade-x">
        <div
          className="animate-marquee flex w-max gap-5 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ "--marquee-duration": "36s" } as React.CSSProperties}
        >
          {[templates, templates].map((group, groupIndex) => (
            <div key={groupIndex} aria-hidden={groupIndex === 1} className="flex shrink-0 gap-5">
              {group.map((template, index) => {
                const Icon = iconFor(template.industry);
                const accent = ACCENT_CLASSES[template.accent] ?? ACCENT_CLASSES.emerald;
                return (
                  <div
                    key={`${groupIndex}-${template.industry}-${index}`}
                    className="w-64 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className={`flex items-center gap-3 p-4 ${accent}`}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-white/10">
                        <Icon className="size-4.5" />
                      </span>
                      <span className="text-base font-semibold">{template.industry}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
