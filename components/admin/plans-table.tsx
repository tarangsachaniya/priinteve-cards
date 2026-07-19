"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { PlanForm, type AdminPlan } from "@/components/admin/plan-form";

const CARD_TYPE_LABEL: Record<AdminPlan["cardType"], string> = {
  NFC: "NFC",
  QR: "QR",
  BOTH: "NFC + QR",
};

export function PlansTable({ initialPlans }: { initialPlans: AdminPlan[] }) {
  const [plans, setPlans] = useState<AdminPlan[]>(initialPlans);

  function upsertPlan(plan: AdminPlan) {
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === plan.id);
      return exists ? prev.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...prev];
    });
  }

  async function toggleActive(plan: AdminPlan) {
    const previous = plans;
    const nextActive = !plan.isActive;
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextActive } : p)));
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextActive }),
    });
    if (!res.ok) {
      setPlans(previous);
      toast.error("Could not update plan");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PlanForm
        onSaved={upsertPlan}
        trigger={
          <Button type="button" size="sm" className="self-end">
            <Plus /> Create plan
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(24,24,20,0.04),0_8px_20px_-12px_rgba(24,24,20,0.10)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No plans yet — create your first plan.
                </TableCell>
              </TableRow>
            )}
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  {plan.name}
                  {plan.recommended && (
                    <Badge variant="secondary" className="ml-2">
                      Popular
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{CARD_TYPE_LABEL[plan.cardType]}</TableCell>
                <TableCell>{formatCurrency(plan.price)}</TableCell>
                <TableCell>{plan.validityDays} days</TableCell>
                <TableCell>{plan.subscriberCount ?? 0}</TableCell>
                <TableCell>
                  <Switch checked={plan.isActive} onCheckedChange={() => toggleActive(plan)} />
                </TableCell>
                <TableCell className="text-right">
                  <PlanForm
                    plan={plan}
                    onSaved={upsertPlan}
                    trigger={
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit plan">
                        <Pencil />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
