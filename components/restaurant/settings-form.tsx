"use client";

import { useRef, useState } from "react";
import { Banknote, CreditCard, ImagePlus, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatMobile } from "@/lib/restaurant/mobile";
import { cn } from "@/lib/utils";
import { restaurantSettingsSchema } from "@/lib/validations/restaurant";

export type RestaurantSettings = {
  name: string;
  branch: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  brandColor: string;
  coverImageUrl: string | null;
  coverPublicId: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  tagline: string | null;
  description: string | null;
  cuisineTags: string[];
  prepTimeMinMins: number | null;
  prepTimeMaxMins: number | null;
  costForTwo: number | null;
  /** Stored ×10, e.g. 45 for "4.5" — see Restaurant.ratingValue. */
  ratingValue: number | null;
  ratingCount: number | null;
  dineInEnabled: boolean;
  takeAwayEnabled: boolean;
  deliveryEnabled: boolean;
  onlinePaymentEnabled: boolean;
  counterPaymentEnabled: boolean;
  taxPercent: number;
  deliveryFee: number;
  minOrderValue: number;
};

/**
 * Shared by the cover photo and the logo — same upload flow, different
 * preview shape (wide strip vs. square) since that's how each is actually
 * displayed on the customer menu — see restaurant-hero.tsx.
 */
function ImageUploadField({
  label,
  hint,
  shape,
  imageUrl,
  isUploading,
  onUpload,
  onRemove,
}: {
  label: string;
  hint: string;
  shape: "wide" | "square";
  imageUrl: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted",
            shape === "wide" ? "h-16 w-28" : "size-16"
          )}
        >
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt=""
              className={cn("size-full", shape === "wide" ? "object-cover" : "object-contain")}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <ImagePlus data-icon="inline-start" />
              )}
              {isUploading ? "Uploading…" : imageUrl ? "Replace" : "Upload"}
            </Button>
            {imageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

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
    coverImageUrl: settings.coverImageUrl ?? "",
    coverPublicId: settings.coverPublicId ?? "",
    logoUrl: settings.logoUrl ?? "",
    logoPublicId: settings.logoPublicId ?? "",
    tagline: settings.tagline ?? "",
    description: settings.description ?? "",
    // Edited as one comma-separated field rather than a chip picker — six
    // short tags at most, and a text field is one control instead of five.
    cuisineTags: settings.cuisineTags.join(", "),
    prepTimeMinMins: settings.prepTimeMinMins == null ? "" : String(settings.prepTimeMinMins),
    prepTimeMaxMins: settings.prepTimeMaxMins == null ? "" : String(settings.prepTimeMaxMins),
    costForTwo: settings.costForTwo == null ? "" : String(settings.costForTwo),
    // Stored ×10; edited the way an owner reads it — "4.5", not "45".
    ratingValue: settings.ratingValue == null ? "" : String(settings.ratingValue / 10),
    ratingCount: settings.ratingCount == null ? "" : String(settings.ratingCount),
    taxPercent: String(settings.taxPercent),
    deliveryFee: String(settings.deliveryFee),
    minOrderValue: String(settings.minOrderValue),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * One upload endpoint, parameterised by `kind` — see
   * app/api/restaurant/settings/upload/route.ts for why cover and logo get
   * different Cloudinary transforms even though the flow is identical here.
   */
  async function handleImageUpload(kind: "cover" | "logo", file: File) {
    const setUploading = kind === "cover" ? setUploadingCover : setUploadingLogo;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/restaurant/settings/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      if (kind === "cover") {
        update("coverImageUrl", data.imageUrl);
        update("coverPublicId", data.imagePublicId);
      } else {
        update("logoUrl", data.imageUrl);
        update("logoPublicId", data.imagePublicId);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = restaurantSettingsSchema.safeParse({
      ...form,
      // The only field edited as a string but sent as an array — split here
      // rather than keeping cuisineTags itself an array in form state, which
      // would fight the text input over every keystroke and comma typed.
      cuisineTags: form.cuisineTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
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

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label="Cover photo"
              hint="Shown behind your name at the top of the menu. 16:9 works best."
              shape="wide"
              imageUrl={form.coverImageUrl}
              isUploading={uploadingCover}
              onUpload={(file) => handleImageUpload("cover", file)}
              onRemove={() => {
                update("coverImageUrl", "");
                update("coverPublicId", "");
              }}
            />
            <ImageUploadField
              label="Logo"
              hint="Shown on a card over the cover photo. Square works best."
              shape="square"
              imageUrl={form.logoUrl}
              isUploading={uploadingLogo}
              onUpload={(file) => handleImageUpload("logo", file)}
              onRemove={() => {
                update("logoUrl", "");
                update("logoPublicId", "");
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Presentation</CardTitle>
          <CardDescription>
            The facts a guest checks before ordering — tagline, description, prep time and cost.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-tagline">Tagline</Label>
            <Input
              id="settings-tagline"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="Wood-fired kitchen · Modern Indian & Grill"
              maxLength={120}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-description">Description</Label>
            <Textarea
              id="settings-description"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What makes your kitchen worth ordering from."
              maxLength={400}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-cuisine">Cuisine tags</Label>
            <Input
              id="settings-cuisine"
              value={form.cuisineTags}
              onChange={(e) => update("cuisineTags", e.target.value)}
              placeholder="North Indian, Chinese, Tandoor"
            />
            <p className="text-xs text-muted-foreground">
              Up to 6, separated by commas. Shown above your name if you haven&apos;t set a
              tagline.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-prep-min">Prep time, from (min)</Label>
              <Input
                id="settings-prep-min"
                type="number"
                min={0}
                value={form.prepTimeMinMins}
                onChange={(e) => update("prepTimeMinMins", e.target.value)}
                placeholder="20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-prep-max">Prep time, to (min)</Label>
              <Input
                id="settings-prep-max"
                type="number"
                min={0}
                value={form.prepTimeMaxMins}
                onChange={(e) => update("prepTimeMaxMins", e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-cost-for-two">Cost for two (₹)</Label>
              <Input
                id="settings-cost-for-two"
                type="number"
                min={0}
                value={form.costForTwo}
                onChange={(e) => update("costForTwo", e.target.value)}
                placeholder="900"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-rating">Starting rating (1–5)</Label>
              <Input
                id="settings-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={form.ratingValue}
                onChange={(e) => update("ratingValue", e.target.value)}
                placeholder="4.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-rating-count">Based on how many reviews</Label>
              <Input
                id="settings-rating-count"
                type="number"
                min={0}
                value={form.ratingCount}
                onChange={(e) => update("ratingCount", e.target.value)}
                placeholder="120"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Shown until real guest reviews take over — once 10 paid orders have been rated, your
            menu switches to the measured average automatically.
          </p>
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
