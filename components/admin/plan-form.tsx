"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planSchema, type PlanInput } from "@/lib/validations/admin";

export type AdminPlan = {
  id: string;
  name: string;
  cardType: "NFC" | "QR" | "BOTH";
  price: number;
  validityDays: number;
  featuresJson: unknown;
  maxGalleryImages: number;
  isActive: boolean;
  isDraft: boolean;
  recommended: boolean;
  subscriberCount?: number;
};

function toFormState(plan?: AdminPlan) {
  const features = Array.isArray(plan?.featuresJson)
    ? (plan!.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
    : [];
  return {
    name: plan?.name ?? "",
    cardType: plan?.cardType ?? "NFC",
    price: String(plan?.price ?? ""),
    validityDays: String(plan?.validityDays ?? "365"),
    features: features.join(", "),
    maxGalleryImages: String(plan?.maxGalleryImages ?? "10"),
    isActive: plan?.isActive ?? true,
    recommended: plan?.recommended ?? false,
  };
}

export function PlanForm({
  plan,
  onSaved,
  trigger,
}: {
  plan?: AdminPlan;
  onSaved: (plan: AdminPlan) => void;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => toFormState(plan));
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(plan);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: PlanInput = {
      name: form.name,
      cardType: form.cardType as PlanInput["cardType"],
      price: Number(form.price),
      validityDays: Number(form.validityDays),
      featuresJson: form.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      maxGalleryImages: Number(form.maxGalleryImages),
      maxVideos: 0,
      maxPdfs: 0,
      storageLimitMb: 0,
      isActive: form.isActive,
      isDraft: false,
      recommended: form.recommended,
    };

    const parsed = planSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the plan details");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/plans/${plan!.id}` : "/api/admin/plans", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save plan");
        return;
      }
      toast.success(isEdit ? "Plan updated" : "Plan created");
      onSaved(data.plan);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setForm(toFormState(plan));
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "Create plan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update pricing and features for this plan." : "Add a new plan users can purchase."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Card type</Label>
            <Select value={form.cardType} onValueChange={(v) => update("cardType", v as typeof form.cardType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NFC">NFC</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
                <SelectItem value="BOTH">NFC + QR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-price">Price (₹)</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-validity">Validity (days)</Label>
              <Input
                id="plan-validity"
                type="number"
                min={1}
                value={form.validityDays}
                onChange={(e) => update("validityDays", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-gallery">Max gallery images</Label>
            <Input
              id="plan-gallery"
              type="number"
              min={0}
              value={form.maxGalleryImages}
              onChange={(e) => update("maxGalleryImages", e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-features">Features (comma-separated)</Label>
            <Textarea
              id="plan-features"
              value={form.features}
              onChange={(e) => update("features", e.target.value)}
              rows={3}
              placeholder="Unlimited fields, Custom brand color, Priority support"
            />
          </div>

          <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <span className="text-sm font-medium">Active</span>
            <Switch checked={form.isActive} onCheckedChange={(v) => update("isActive", v)} />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <span className="text-sm font-medium">Recommended (shown as &quot;Most popular&quot;)</span>
            <Switch checked={form.recommended} onCheckedChange={(v) => update("recommended", v)} />
          </label>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
