import { cn } from "@/lib/utils";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { SafeImage } from "@/components/card/safe-image";
import { MotionItem, MotionSection } from "@/components/card/motion-section";
import type { ServiceItem } from "@/lib/card-sections";

export function ServicesSection({ services, flat }: { services: ServiceItem[]; flat?: boolean }) {
  if (services.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">Services</h3>
      <MotionSection stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => {
          const Icon = resolveLucideIcon(service.icon);
          return (
            <MotionItem
              key={i}
              className={cn(
                "group relative flex flex-col gap-1.5 overflow-hidden rounded-xl p-3.5 text-sm transition-transform hover:-translate-y-0.5",
                flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
              )}
            >
              {service.image && (
                <SafeImage
                  src={service.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-15"
                  fallback={<></>}
                />
              )}
              <div className="relative flex flex-col gap-1.5">
                <Icon className="size-5 shrink-0" style={{ color: "var(--brand)" }} />
                <span className="font-medium leading-snug">{service.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {service.short_description}
                </span>
              </div>
            </MotionItem>
          );
        })}
      </MotionSection>
    </div>
  );
}
