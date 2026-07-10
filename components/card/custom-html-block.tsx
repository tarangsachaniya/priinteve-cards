import { cn } from "@/lib/utils";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";

export function CustomHtmlBlock({ html, flat }: { html: string; flat?: boolean }) {
  const clean = sanitizeRichTextServer(html, { allowCustomHtmlTags: true });
  if (!clean) return null;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg px-3.5 py-3 text-sm leading-relaxed text-foreground/90",
        flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md",
        "[&_a]:text-[var(--brand)] [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_ul]:list-disc [&_ul]:pl-5"
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
