import { Badge } from "@/components/ui/badge";
import type { HomepageAccent } from "@/lib/validations/admin";

type TemplateItem = {
  industry: string;
  description: string;
  accent: HomepageAccent;
};

// Tailwind purges classes it can't statically see, so accent → class must be
// a literal lookup, never a template-string interpolation like `bg-${accent}-500`.
const ACCENT_CLASSES: Record<HomepageAccent, string> = {
  emerald: "from-emerald-600 to-emerald-800",
  blue: "from-blue-600 to-blue-800",
  violet: "from-violet-600 to-violet-800",
  amber: "from-amber-600 to-amber-800",
  rose: "from-rose-600 to-rose-800",
  slate: "from-slate-600 to-slate-800",
};

export function TemplatesSection({ templates }: { templates: TemplateItem[] }) {
  if (templates.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
          Templates
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          A card for every kind of business
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start from a profile built for your industry, then make it yours in minutes.
        </p>
      </div>

      <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {templates.map((template) => (
          <div
            key={template.industry}
            className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
          >
            <div
              className={`flex h-28 items-end bg-gradient-to-br p-4 ${ACCENT_CLASSES[template.accent] ?? ACCENT_CLASSES.emerald}`}
            >
              <span className="text-base font-semibold text-white">{template.industry}</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
