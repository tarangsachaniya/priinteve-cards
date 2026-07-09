import type { LucideIcon } from "lucide-react";
import { Layers, CheckCircle2, CircleSlash, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type PlanStats = {
  total: number;
  active: number;
  disabled: number;
  draft: number;
  totalSubscribers: number;
};

const STAT_ITEMS: {
  key: keyof PlanStats;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  { key: "total", label: "Total Plans", icon: Layers, description: "All plans, any status" },
  { key: "active", label: "Active Plans", icon: CheckCircle2, description: "Live and purchasable" },
  { key: "disabled", label: "Disabled Plans", icon: CircleSlash, description: "Paused, hidden from users" },
  { key: "totalSubscribers", label: "Total Subscribers", icon: Users, description: "Users on a paid plan" },
];

export function PlanStatsCards({ stats, isLoading }: { stats: PlanStats | null; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon, description }) => (
        <Card key={key}>
          <CardContent className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">{stats?.[key] ?? 0}</p>
              )}
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
