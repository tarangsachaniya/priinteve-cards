"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

type AuditLogEntry = {
  id: string;
  actorEmail: string;
  action: string;
  targetId: string | null;
  metadata: { name?: string } | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  "plan.create": "Created plan",
  "plan.update": "Updated plan",
  "plan.duplicate": "Duplicated plan",
  "plan.delete": "Deleted plan",
  "plan.enable": "Enabled plan",
  "plan.disable": "Disabled plan",
  "plan.import": "Imported plans",
};

export function PlanAuditLogSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    fetch("/api/admin/audit-log?targetType=plan&limit=50")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []))
      .finally(() => setIsLoading(false));
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-4" />
            Activity Log
          </SheetTitle>
          <SheetDescription>Recent changes made to plans by admins.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

          {!isLoading && logs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}

          {!isLoading &&
            logs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {ACTION_LABELS[log.action] ?? log.action}
                  {log.metadata?.name && (
                    <span className="font-normal text-muted-foreground"> · {log.metadata.name}</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.actorEmail} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
        </div>

        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </SheetContent>
    </Sheet>
  );
}
