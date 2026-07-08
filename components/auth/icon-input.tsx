import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IconInput({
  icon: Icon,
  className,
  ...props
}: { icon: LucideIcon } & React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("h-11 rounded-xl pl-10", className)} {...props} />
    </div>
  );
}
