import { ChevronDown } from "lucide-react";

export type FaqEntry = { key: string; value: string };

export function FaqAccordion({ faqs, limit }: { faqs: FaqEntry[]; limit?: number }) {
  const visible = limit ? faqs.slice(0, limit) : faqs;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((faq) => (
        <details
          key={faq.key}
          className="group rounded-2xl border border-border/60 bg-card px-5 py-4 transition-shadow duration-300 open:border-primary/25 open:shadow-card-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
            {faq.key}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
          </summary>
          <p className="mt-3 text-sm text-muted-foreground">{faq.value}</p>
        </details>
      ))}
    </div>
  );
}
