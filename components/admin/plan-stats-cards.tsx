import type { LucideIcon } from "lucide-react";
import { Layers, CheckCircle2, CircleSlash, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export type PlanStats = {
  total: number;
  active: number;
  disabled: number;
  totalSubscribers: number;
};

const STAT_ITEMS: { key: keyof PlanStats; label: string; icon: LucideIcon; description: string }[] = [
  { key: "total", label: "Total plans", icon: Layers, description: "All plans, any status" },
  { key: "active", label: "Active plans", icon: CheckCircle2, description: "Live and purchasable" },
  { key: "disabled", label: "Disabled plans", icon: CircleSlash, description: "Paused, hidden from users" },
  { key: "totalSubscribers", label: "Total subscribers", icon: Users, description: "Users on a paid plan" },
];

export function PlanStatsCards({ stats }: { stats: PlanStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon, description }) => (
        <Card key={key} className="border-border/80">
          <CardContent className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-semibold tracking-tight">{stats[key]}</p>
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
