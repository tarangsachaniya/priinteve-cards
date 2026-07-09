"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type DeletablePlan = {
  id: string;
  name: string;
  subscriberCount: number;
  purchaseCount: number;
};

export function PlanDeleteDialog({
  plan,
  open,
  onOpenChange,
  onDeleted,
  onDisableInstead,
}: {
  plan: DeletablePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  onDisableInstead: (planId: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!plan) return null;

  const isBlocked = plan.subscriberCount > 0 || plan.purchaseCount > 0;

  async function handleDelete() {
    if (!plan) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}?mode=hard`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Could not delete plan");
        return;
      }
      toast.success("Plan deleted");
      onOpenChange(false);
      onDeleted();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{plan.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {plan.subscriberCount} subscriber{plan.subscriberCount === 1 ? "" : "s"} currently on this
            plan · {plan.purchaseCount} purchase record{plan.purchaseCount === 1 ? "" : "s"} reference it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBlocked ? (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              This plan can&apos;t be permanently deleted while it has subscribers or purchase history.
              Disable it instead to hide it from new signups.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The plan will be permanently removed.
          </p>
        )}

        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isBlocked ? (
            <Button type="button" variant="secondary" onClick={() => onDisableInstead(plan.id)}>
              Disable this plan instead
            </Button>
          ) : (
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
