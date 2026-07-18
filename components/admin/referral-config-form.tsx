"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReferralConfigFormProps = {
  initialValues: {
    pointsPerReferral: number;
    conversionRate: number;
    minimumRedemption: number;
  };
};

export function ReferralConfigForm({ initialValues }: ReferralConfigFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        toast.error("Could not save referral config");
        return;
      }

      toast.success("Referral config saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg border-border/80">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pointsPerReferral">Points per referral</Label>
            <Input
              id="pointsPerReferral"
              type="number"
              min={0}
              value={values.pointsPerReferral}
              onChange={(e) => setValues((v) => ({ ...v, pointsPerReferral: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conversionRate">Conversion rate (1 ₹ = X points)</Label>
            <Input
              id="conversionRate"
              type="number"
              min={1}
              value={values.conversionRate}
              onChange={(e) => setValues((v) => ({ ...v, conversionRate: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minimumRedemption">Minimum points to redeem</Label>
            <Input
              id="minimumRedemption"
              type="number"
              min={0}
              value={values.minimumRedemption}
              onChange={(e) => setValues((v) => ({ ...v, minimumRedemption: Number(e.target.value) }))}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "Saving…" : "Save config"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
