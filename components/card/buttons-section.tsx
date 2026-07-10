import { cn } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import type { ButtonItem } from "@/lib/card-sections";

export function ButtonsSection({ items }: { items: ButtonItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, i) => {
        const Icon = item.icon ? resolveLucideIcon(item.icon) : null;
        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]",
              item.style === "primary" && "text-white shadow-sm",
              item.style === "secondary" && "bg-muted text-foreground",
              item.style === "outline" && "border bg-transparent text-foreground"
            )}
            style={item.style === "primary" ? { backgroundColor: "var(--brand)" } : undefined}
          >
            {Icon && <Icon className="size-4" />}
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
