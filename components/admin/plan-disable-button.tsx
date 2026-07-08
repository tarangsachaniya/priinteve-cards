"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PlanDisableButton({ planId, disabled }: { planId: string; disabled?: boolean }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleDisable() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not disable plan");
        return;
      }
      toast.success("Plan disabled");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isSaving}
      onClick={handleDisable}
    >
      {isSaving ? "Disabling…" : "Disable"}
    </Button>
  );
}
