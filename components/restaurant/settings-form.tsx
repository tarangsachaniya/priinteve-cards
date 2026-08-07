"use client";

import { useState } from "react";
import { Banknote, CreditCard, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatMobile } from "@/lib/restaurant/mobile";
import { restaurantSettingsSchema } from "@/lib/validations/restaurant";

export type RestaurantSettings = {
  name: string;
  branch: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  brandColor: string;
  dineInEnabled: boolean;
  takeAwayEnabled: boolean;
  deliveryEnabled: boolean;
  onlinePaymentEnabled: boolean;
  counterPaymentEnabled: boolean;
  taxPercent: number;
  deliveryFee: number;
  minOrderValue: number;
};

function ToggleRow({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function SettingsForm({
  settings,
  razorpayConfigured,
}: {
  settings: RestaurantSettings;
  razorpayConfigured: boolean;
}) {
  const [form, setForm] = useState({
    ...settings,
    branch: settings.branch ?? "",
    phone: settings.phone ? formatMobile(settings.phone) : "",
    email: settings.email ?? "",
    address: settings.address ?? "",
    taxPercent: String(settings.taxPercent),
    deliveryFee: String(settings.deliveryFee),
    minOrderValue: String(settings.minOrderValue),
  });
  const [isSaving, setIsSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = restaurantSettingsSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your settings");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/restaurant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save settings");
        return;
      }
      toast.success("Settings saved");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Restaurant profile</CardTitle>
          <CardDescription>What customers see at the top of your menu.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-name">Restaurant name</Label>
              <Input
                id="settings-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-branch">Branch / Area</Label>
              <Input
                id="settings-branch"
                value={form.branch}
                onChange={(e) => update("branch", e.target.value)}
                placeholder="Bandra West"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-phone">Phone</Label>
              <Input
                id="settings-phone"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-address">Address</Label>
            <Textarea
              id="settings-address"
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-color">Brand colour</Label>
            <div className="flex items-center gap-3">
              <input
                id="settings-color"
                type="color"
                value={form.brandColor}
                onChange={(e) => update("brandColor", e.target.value)}
                className="size-10 cursor-pointer rounded-xl border border-border bg-transparent p-1"
              />
              <Input
                value={form.brandColor}
                onChange={(e) => update("brandColor", e.target.value)}
                className="max-w-32 font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for accents on your customer-facing menu.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Order types</CardTitle>
          <CardDescription>
            Customers only see the options you enable here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ToggleRow
            id="dine-in"
            title="Dine-In"
            description="Ordering from a table QR code."
            checked={form.dineInEnabled}
            onChange={(checked) => update("dineInEnabled", checked)}
          />
          <ToggleRow
            id="take-away"
            title="Take Away"
            description="Customer collects from the counter."
            checked={form.takeAwayEnabled}
            onChange={(checked) => update("takeAwayEnabled", checked)}
          />
          <ToggleRow
            id="delivery"
            title="Delivery"
            description="Collects a delivery address and pincode at checkout."
            checked={form.deliveryEnabled}
            onChange={(checked) => update("deliveryEnabled", checked)}
          />
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>How customers can pay for an order.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!razorpayConfigured && (
            <div className="flex gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0" />
              <p>
                Online payment isn&apos;t configured on this deployment yet. Once Razorpay keys are
                added, this option becomes available.
              </p>
            </div>
          )}
          <ToggleRow
            id="online-payment"
            title="Pay Online (Razorpay)"
            description="Cards, UPI, netbanking and wallets."
            checked={form.onlinePaymentEnabled}
            disabled={!razorpayConfigured}
            onChange={(checked) => update("onlinePaymentEnabled", checked)}
          />
          <ToggleRow
            id="counter-payment"
            title="Pay at Counter / Cash on Delivery"
            description="Customer settles the bill in person."
            checked={form.counterPaymentEnabled}
            onChange={(checked) => update("counterPaymentEnabled", checked)}
          />

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-tax" className="flex items-center gap-1.5">
                <Banknote className="size-3.5" /> Tax (%)
              </Label>
              <Input
                id="settings-tax"
                type="number"
                min={0}
                max={50}
                value={form.taxPercent}
                onChange={(e) => update("taxPercent", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-delivery-fee" className="flex items-center gap-1.5">
                <CreditCard className="size-3.5" /> Delivery fee (₹)
              </Label>
              <Input
                id="settings-delivery-fee"
                type="number"
                min={0}
                value={form.deliveryFee}
                onChange={(e) => update("deliveryFee", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-min-order">Minimum order (₹)</Label>
              <Input
                id="settings-min-order"
                type="number"
                min={0}
                value={form.minOrderValue}
                onChange={(e) => update("minOrderValue", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="self-start">
        {isSaving ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
