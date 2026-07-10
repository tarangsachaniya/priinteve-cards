import type { LucideIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-6 mb-6 border-b bg-background/85 px-6 pt-3 pb-4 backdrop-blur-md sm:-mx-8 sm:px-8">
      <Breadcrumbs />
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
