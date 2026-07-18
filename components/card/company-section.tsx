import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import { MotionSection } from "@/components/card/motion-section";
import type { CompanyInfo } from "@/lib/card-sections";

export function CompanySection({
  company,
  website,
  flat,
}: {
  company: CompanyInfo;
  website?: string;
  flat?: boolean;
}) {
  if (!company.name && !company.tagline && !company.description) return null;

  return (
    <MotionSection
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-5 text-center lg:items-start lg:text-left",
        flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
      )}
    >
      {company.name && <h2 className="text-base font-semibold">{company.name}</h2>}
      {company.tagline && <p className="text-sm text-muted-foreground">{company.tagline}</p>}
      {company.description && (
        <p className="text-sm leading-relaxed text-foreground/90">{company.description}</p>
      )}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--brand)" }}
        >
          Visit Website
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </MotionSection>
  );
}
