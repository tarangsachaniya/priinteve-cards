"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Gift, IndianRupee, Wallet } from "lucide-react";

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

const FIELDS: {
  key: keyof ReferralConfigFormProps["initialValues"];
  label: string;
  description: string;
  icon: typeof Gift;
  min: number;
}[] = [
  {
    key: "pointsPerReferral",
    label: "Points per referral",
    description: "Points credited to the referrer when a referred user completes a purchase.",
    icon: Gift,
    min: 0,
  },
  {
    key: "conversionRate",
    label: "Conversion rate",
    description: "How many wallet points equal ₹1 when redeemed at checkout.",
    icon: IndianRupee,
    min: 1,
  },
  {
    key: "minimumRedemption",
    label: "Minimum points to redeem",
    description: "Users need at least this many points before wallet credit becomes available.",
    icon: Wallet,
    min: 0,
  },
];

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
    <Card className="max-w-xl border-border/80">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
                  <field.icon className="size-4" />
                </span>
                <div>
                  <Label htmlFor={field.key} className="text-sm font-semibold">
                    {field.label}
                  </Label>
                  <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">{field.description}</p>
                </div>
              </div>
              <Input
                id={field.key}
                type="number"
                min={field.min}
                value={values[field.key]}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: Number(e.target.value) }))}
                className="h-10 w-full bg-card sm:w-28"
              />
            </div>
          ))}

          <Button type="submit" disabled={isSubmitting} size="lg" className="mt-1 w-fit">
            {isSubmitting ? "Saving…" : "Save config"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
