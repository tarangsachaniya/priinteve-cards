import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/card-sections";

export function FaqSection({ items, flat }: { items: FaqItem[]; flat?: boolean }) {
  if (items.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">FAQ</h3>
      <Accordion
        className={cn(
          "flex flex-col gap-2 rounded-xl p-1",
          flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
        )}
      >
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="rounded-lg border-none px-2.5">
            <AccordionTrigger className="py-2.5 text-left text-sm font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
