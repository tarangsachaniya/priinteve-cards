import { Building2, ExternalLink } from "lucide-react";

import { SafeImage } from "@/components/card/safe-image";
import type { CompanyInfo } from "@/lib/card-sections";

export function CompanySection({
  company,
  website,
}: {
  company: CompanyInfo;
  website?: string;
}) {
  if (!company.name && !company.tagline && !company.description) return null;

  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-muted/50 px-4 py-4 text-center lg:items-start lg:text-left">
      <SafeImage
        src={company.logo}
        alt={company.name ?? "Company logo"}
        className="h-12 w-12 rounded-lg object-cover ring-1 ring-foreground/10"
        fallback={
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Building2 className="size-6" />
          </div>
        }
      />
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
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "var(--brand)" }}
        >
          Visit Website
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
