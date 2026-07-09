"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLAN_FEATURES, PLAN_FEATURE_KEYS } from "@/lib/constants/plan-features";
import { cn } from "@/lib/utils";

export type PlanFormValues = {
  name: string;
  cardType: "NFC" | "QR" | "BOTH";
  price: number;
  validityDays: number;
  featuresJson: string[];
  maxGalleryImages: number;
  maxVideos: number;
  maxPdfs: number;
  storageLimitMb: number;
  isActive: boolean;
  isDraft: boolean;
  recommended: boolean;
};

export const EMPTY_PLAN_VALUES: PlanFormValues = {
  name: "",
  cardType: "NFC",
  price: 0,
  validityDays: 365,
  featuresJson: [],
  maxGalleryImages: 20,
  maxVideos: 0,
  maxPdfs: 0,
  storageLimitMb: 0,
  isActive: false,
  isDraft: true,
  recommended: false,
};

type Status = "draft" | "active" | "disabled";

function statusFromValues(values: Pick<PlanFormValues, "isDraft" | "isActive">): Status {
  if (values.isDraft) return "draft";
  return values.isActive ? "active" : "disabled";
}

function applyStatus(values: PlanFormValues, status: Status): PlanFormValues {
  if (status === "draft") return { ...values, isDraft: true, isActive: false };
  if (status === "active") return { ...values, isDraft: false, isActive: true };
  return { ...values, isDraft: false, isActive: false };
}

type PlanFormProps = {
  mode: "create" | "edit";
  planId?: string;
  initialValues?: PlanFormValues;
  duplicateOf?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PlanForm({
  mode,
  planId,
  initialValues,
  duplicateOf,
  open,
  onOpenChange,
  onSaved,
}: PlanFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<PlanFormValues>(initialValues ?? EMPTY_PLAN_VALUES);
  const [legacyFeatures, setLegacyFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const source = initialValues ?? EMPTY_PLAN_VALUES;
    setValues(source);
    setLegacyFeatures(source.featuresJson.filter((f) => !PLAN_FEATURE_KEYS.has(f)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleFeature(key: string, checked: boolean) {
    setValues((v) => ({
      ...v,
      featuresJson: checked ? [...v.featuresJson, key] : v.featuresJson.filter((f) => f !== key),
    }));
  }

  const status = statusFromValues(values);
  const primaryLabel =
    status === "draft" ? "Save as Draft" : mode === "create" ? "Publish Plan" : "Save Changes";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        featuresJson: [...values.featuresJson.filter((f) => PLAN_FEATURE_KEYS.has(f)), ...legacyFeatures],
        ...(duplicateOf ? { duplicateOf } : {}),
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
      onOpenChange(false);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{duplicateOf ? "Duplicate plan" : mode === "create" ? "Create plan" : "Edit plan"}</DialogTitle>
          <DialogDescription>Configure pricing, limits, features, and status.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Basic Information
              </h3>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-card-type">Card Type</Label>
                <Select
                  value={values.cardType}
                  onValueChange={(value) =>
                    setValues((v) => ({ ...v, cardType: value as PlanFormValues["cardType"] }))
                  }
                >
                  <SelectTrigger id="plan-card-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                    <SelectItem value="BOTH">NFC + QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Pricing
              </h3>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Limits
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="plan-max-gallery">Max Gallery Images</Label>
                  <Input
                    id="plan-max-gallery"
                    type="number"
                    min={0}
                    value={values.maxGalleryImages}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, maxGalleryImages: Number(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="plan-max-videos">Max Videos</Label>
                  <Input
                    id="plan-max-videos"
                    type="number"
                    min={0}
                    value={values.maxVideos}
                    onChange={(e) => setValues((v) => ({ ...v, maxVideos: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="plan-max-pdfs">Max PDFs</Label>
                  <Input
                    id="plan-max-pdfs"
                    type="number"
                    min={0}
                    value={values.maxPdfs}
                    onChange={(e) => setValues((v) => ({ ...v, maxPdfs: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="plan-storage">Storage Limit (MB)</Label>
                  <Input
                    id="plan-storage"
                    type="number"
                    min={0}
                    value={values.storageLimitMb}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, storageLimitMb: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Features
                </h3>
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Star className="size-3.5 text-primary" />
                  Recommended
                  <Switch
                    checked={values.recommended}
                    onCheckedChange={(checked) => setValues((v) => ({ ...v, recommended: checked }))}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {PLAN_FEATURES.map(({ key, label, icon: Icon }) => {
                  const checked = values.featuresJson.includes(key);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5"
                    >
                      <span className="flex items-center gap-1.5 text-sm">
                        <Icon className="size-3.5 text-muted-foreground" />
                        {label}
                      </span>
                      <Switch checked={checked} onCheckedChange={(next) => toggleFeature(key, next)} />
                    </div>
                  );
                })}
              </div>
              {legacyFeatures.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-lg border border-dashed p-2.5">
                  <p className="text-xs text-muted-foreground">Other (legacy, carried over unchanged):</p>
                  <div className="flex flex-wrap gap-1">
                    {legacyFeatures.map((f) => (
                      <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Status
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["draft", "active", "disabled"] as Status[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValues((v) => applyStatus(v, s))}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-sm font-medium capitalize transition-colors",
                      status === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : primaryLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
