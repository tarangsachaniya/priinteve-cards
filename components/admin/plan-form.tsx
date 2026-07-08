"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PlanFormValues = {
  name: string;
  cardType: "NFC" | "QR" | "BOTH";
  price: number;
  validityDays: number;
  featuresJson: string[];
  maxGalleryImages: number;
  isActive: boolean;
};

const EMPTY_VALUES: PlanFormValues = {
  name: "",
  cardType: "NFC",
  price: 0,
  validityDays: 30,
  featuresJson: [],
  maxGalleryImages: 0,
  isActive: true,
};

type PlanFormProps = {
  mode: "create" | "edit";
  planId?: string;
  initialValues?: PlanFormValues;
  trigger: React.ReactNode;
};

export function PlanForm({ mode, planId, initialValues, trigger }: PlanFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<PlanFormValues>(initialValues ?? EMPTY_VALUES);
  const [featuresText, setFeaturesText] = useState((initialValues ?? EMPTY_VALUES).featuresJson.join(", "));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        featuresJson: featuresText
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };

      const res = await fetch(mode === "create" ? "/api/admin/plans" : `/api/admin/plans/${planId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(mode === "create" ? "Could not create plan" : "Could not update plan");
        return;
      }

      toast.success(mode === "create" ? "Plan created" : "Plan updated");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create plan" : "Edit plan"}</DialogTitle>
          <DialogDescription>Configure the plan&apos;s pricing and features.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-card-type">Card type</Label>
            <select
              id="plan-card-type"
              value={values.cardType}
              onChange={(e) =>
                setValues((v) => ({ ...v, cardType: e.target.value as PlanFormValues["cardType"] }))
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="NFC">NFC</option>
              <option value="QR">QR</option>
              <option value="BOTH">NFC + QR</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-price">Price (INR)</Label>
            <Input
              id="plan-price"
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-validity">Validity (days)</Label>
            <Input
              id="plan-validity"
              type="number"
              min={1}
              value={values.validityDays}
              onChange={(e) => setValues((v) => ({ ...v, validityDays: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-features">Features (comma-separated)</Label>
            <textarea
              id="plan-features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-max-gallery">Max gallery images</Label>
            <Input
              id="plan-max-gallery"
              type="number"
              min={0}
              value={values.maxGalleryImages}
              onChange={(e) => setValues((v) => ({ ...v, maxGalleryImages: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-2.5 py-2">
            <Label htmlFor="plan-active">Active</Label>
            <Switch
              id="plan-active"
              checked={values.isActive}
              onCheckedChange={(checked) => setValues((v) => ({ ...v, isActive: checked }))}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : mode === "create" ? "Create plan" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
