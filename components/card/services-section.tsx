import { resolveLucideIcon } from "@/lib/lucide-icon";
import type { ServiceItem } from "@/lib/card-sections";

export function ServicesSection({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">Services</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => {
          const Icon = resolveLucideIcon(service.icon);
          return (
            <div key={i} className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <Icon className="size-5 shrink-0" style={{ color: "var(--brand)" }} />
              <span className="font-medium leading-snug">{service.title}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {service.short_description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
