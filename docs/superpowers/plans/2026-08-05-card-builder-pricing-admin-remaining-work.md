# Remaining Card Builder / Pricing / Admin Work — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the digital-business-card platform changes the user requested, on top of work already landed in the working tree (material/duration pricing, dashboard publish-gate, wipe script). Specifically: fix the one broken admin-plans endpoint, make Products/"Shop Now" actually render on a published card, give the setup wizard a persistent two-column live preview with working theme colors, let an admin edit a user's full card content, and verify the data-wipe script.

**Architecture:** Next.js 14 App Router + Prisma/PostgreSQL (Neon) + NextAuth (JWT sessions). Card content is a flat `CardField` table keyed by `fieldType`; the builder groups repeatable types (`service`/`testimonial`/`product`/`faq`/`button`) into one draggable "group" block via `lib/card-sections.ts`. Every card renderer (public `/[slug]` page, dashboard builder, dashboard Preview tab, setup wizard) already shares one presentational component, `ThemeCard` (`components/card/theme-card.tsx`) — fixing it once fixes it everywhere. Admin card-content editing is implemented by extracting the existing per-user card-field/gallery mutation logic into plain service functions, then calling those same functions from both the existing session-scoped routes and new `/api/admin/users/[id]/...` routes, and by adding an `apiBase`/`mode` prop to the existing `SectionBuilder` so the admin page can reuse the exact same builder UI pointed at another user's data.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma 5 (PostgreSQL/Neon), NextAuth 4 (JWT), Zod, Tailwind CSS, shadcn/ui (base-ui), Cloudinary (uploads), Sonner (toasts).

## Global Constraints

- Every API route in this codebase authenticates with `getServerSession(authOptions)` from `@/lib/auth` — no middleware-level auth for API routes, each route checks inline.
- Admin routes check `session?.user?.role !== "ADMIN"` and return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` on failure — matches every existing `/api/admin/*` route.
- All mutation input is validated with Zod schemas from `lib/validations/*.ts` before touching the DB.
- After any card-field/gallery/settings mutation, call `revalidateUserCard(userId)` from `@/lib/revalidate-card` so the public `/[slug]` page's ISR cache updates.
- Ownership checks on card-field/gallery mutations are `field.userId !== <targetUserId>` (404 "Not found" if it fails) — never trust a client-supplied id alone.
- Follow existing file conventions: route handlers are named exports (`GET`/`POST`/`PATCH`/`DELETE`) from `route.ts` under `app/api/**`; client components are `"use client"` files under `components/**`.
- Do not change `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/**`, or the Plan/pricing/dashboard-gating/publish-button code — that work is already complete and verified against the live database (9 plans seeded at the requested prices; dashboard layout already gates on an active plan; `/api/card-builder/publish` already fixed).

---

## File Structure

**New files:**
- `lib/services/card-field-service.ts` — userId-parameterized CardField CRUD, shared by user and admin routes.
- `lib/services/gallery-service.ts` — userId-parameterized GalleryItem CRUD + upload + YouTube add, shared by user and admin routes.
- `lib/admin-guard.ts` — `requireAdminSession()` helper used only by the new admin routes below.
- `app/api/admin/plans/[id]/route.ts` — the missing PATCH endpoint the existing plan edit/toggle UI already calls.
- `app/api/admin/users/[id]/card-field/route.ts`, `.../card-field/[fieldId]/route.ts`, `.../card-field/[fieldId]/visibility/route.ts`, `.../card-field/upload/route.ts`
- `app/api/admin/users/[id]/gallery/[itemId]/route.ts`, `.../gallery/layout/route.ts`, `.../gallery/upload/route.ts`, `.../gallery/youtube/route.ts`
- `app/api/admin/users/[id]/card-settings/route.ts`
- `app/(admin)/admin/users/[id]/page.tsx` — admin's per-user detail page (account summary + full card editor).
- `components/admin/admin-card-editor.tsx` — thin client wrapper: `SectionBuilder` in admin mode + `AdminCardSettingsForm`.
- `components/admin/admin-card-settings-form.tsx` — theme/brand-color/fonts/gallery-layout editor for admin.

**Modified files:**
- `components/card/theme-card.tsx` — render Products, fix brand-color usage on Contact/Payments, apply `bodyFont`.
- `components/card/products-section.tsx` — "Buy Now" → "Shop Now".
- `components/wizard/setup-wizard.tsx` — two-column shell, persistent `CardPreviewPanel`.
- `components/wizard/step-2-theme-brand.tsx` — becomes a controlled (no local preview) step.
- `components/wizard/step-5-preview-purchase.tsx` — drop its own preview (now redundant).
- `app/api/card-field/route.ts`, `app/api/card-field/[id]/route.ts`, `app/api/card-field/[id]/visibility/route.ts`, `app/api/card-field/upload/route.ts` — delegate to `card-field-service.ts`.
- `app/api/gallery/[id]/route.ts`, `app/api/gallery/layout/route.ts`, `app/api/gallery/upload/route.ts`, `app/api/gallery/youtube/route.ts` — delegate to `gallery-service.ts`.
- `components/dashboard/section-builder.tsx` — add `apiBase`/`mode` props.
- `components/dashboard/section-editors/field-editor.tsx` — add `uploadEndpoint` prop.
- `components/dashboard/section-editors/gallery-editor.tsx` — add `uploadEndpoint`/`youtubeEndpoint` props.
- `components/admin/users-table.tsx` — add a "Manage card" link per row.
- `lib/audit-log.ts` — add a `"user.card.update"` audit action.
- `lib/validations/admin.ts` — add `adminCardSettingsSchema`.

**Deleted files:**
- `components/card/card-preview-stub.tsx` — becomes unused once Task 3 lands (verified only two current callers, both edited in this plan).

---

## Task 1: Fix the missing admin Plan detail API route

The plan edit dialog (`components/admin/plan-form.tsx`) and the active/disabled toggle (`components/admin/plans-table.tsx`) both `PATCH /api/admin/plans/${plan.id}`, but no such route file exists — every edit or toggle currently 404s.

**Files:**
- Create: `app/api/admin/plans/[id]/route.ts`

**Interfaces:**
- Consumes: `planUpdateSchema` (from `lib/validations/admin.ts`, already exported), `enforceDraftInvariant` (from `lib/plan-status.ts`, already exported), `writeAuditLog` (from `lib/audit-log.ts`).
- Produces: `PATCH /api/admin/plans/[id]` → `{ plan: AdminPlan }` matching the shape `components/admin/plan-form.tsx`'s `AdminPlan` type expects (includes `subscriberCount`).

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/plans/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { enforceDraftInvariant } from "@/lib/plan-status";
import { planUpdateSchema } from "@/lib/validations/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = planUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.plan.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const plan = await db.plan.update({
    where: { id: params.id },
    data: enforceDraftInvariant(parsed.data),
    include: { _count: { select: { users: true } } },
  });

  await writeAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "plan.update",
    targetType: "plan",
    targetId: plan.id,
    metadata: { changes: parsed.data },
  });

  const { _count, ...rest } = plan;
  return NextResponse.json({ plan: { ...rest, subscriberCount: _count.users } });
}
```

- [ ] **Step 2: Verify manually**

Run the dev server (`pnpm dev` or `npm run dev`), sign in as the admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env`), go to `/admin/plans`:
- Toggle a plan's Active switch — it should stay toggled (no error toast) and survive a page refresh.
- Click the pencil icon on a plan, change the price, save — the table should show the new price without a "Could not save plan" toast.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/plans/[id]/route.ts
git commit -m "fix: add missing PATCH /api/admin/plans/[id] route"
```

---

## Task 2: Wire Products/"Shop Now" into the live card, fix brand-color and body-font theming

`ThemeCard` is the single renderer behind the public `/[slug]` page, the dashboard builder, the dashboard Preview tab, and the setup wizard — but it never renders the "Products" group a user can already add via the builder's Business tab, and only 3 of its elements actually use the chosen brand color (contact tiles and the payment button are hardcoded slate/white; `bodyFont` is captured by the wizard but never applied anywhere). `components/card/products-section.tsx` already exists, is theme-aware (uses the `--brand` CSS variable `ThemeCard` already sets), and just needs its button relabeled and to actually be rendered.

**Files:**
- Modify: `components/card/products-section.tsx:56`
- Modify: `components/card/theme-card.tsx`

**Interfaces:**
- Consumes: `ProductsSection` (`components/card/products-section.tsx`, exists), `ProductItem` type (`lib/card-sections.ts`, exists — `{ title, price?, currency, image, description, buyUrl }`).
- Produces: no interface change to `ThemeCardData`/`ThemeCard` props — purely internal rendering.

- [ ] **Step 1: Rename the CTA**

```tsx
// components/card/products-section.tsx — line 56
-              >
-                Buy Now
-              </a>
+              >
+                Shop Now
+              </a>
```

- [ ] **Step 2: Rewrite `theme-card.tsx` to add Products and fix brand/body-font usage**

Replace the file's contents:

```tsx
"use client";

import { ExternalLink, Mail, MapPin, Phone, QrCode, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductsSection } from "@/components/card/products-section";
import type { ProductItem } from "@/lib/card-sections";

export type ThemeCardField = { fieldType: string; label: string; value: string; order: number; isVisible?: boolean };
export type ThemeCardGallery = { type: "IMAGE" | "YOUTUBE"; url: string; order: number; caption?: string | null; altText?: string | null };
export type ThemeCardData = {
  name: string; slug: string; fields: ThemeCardField[]; galleryItems: ThemeCardGallery[];
  settings: { themeId: string; brandColor: string; headingFont?: string; bodyFont?: string; galleryLayout?: string };
};

const CONTACTS = ["phone", "whatsapp", "email", "address", "website", "google_maps_url"];
function get(data: ThemeCardData, type: string) { return data.fields.find((field) => field.fieldType === type)?.value || ""; }
function stats(data: ThemeCardData) {
  return data.fields.filter((field) => field.fieldType === "stat").map((field) => {
    try { return { label: field.label, value: JSON.parse(field.value).value || "" }; } catch { return { label: field.label, value: field.value }; }
  });
}
function productItems(data: ThemeCardData): ProductItem[] {
  return data.fields
    .filter((field) => field.fieldType === "product")
    .map((field) => {
      try { return { title: field.label, ...JSON.parse(field.value) } as ProductItem; } catch { return null; }
    })
    .filter((item): item is ProductItem => item !== null);
}
function LinkIcon({ type }: { type: string }) { return type === "phone" ? <Phone /> : type === "email" ? <Mail /> : type === "address" || type === "google_maps_url" ? <MapPin /> : <ExternalLink />; }
function Contact({ data, brand, compact = false }: { data: ThemeCardData; brand: string; compact?: boolean }) {
  return <div className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
    {CONTACTS.map((type) => { const value = get(data, type); if (!value) return null; return <a key={type} href={type === "email" ? `mailto:${value}` : type === "phone" ? `tel:${value}` : type === "whatsapp" ? `https://wa.me/${value.replace(/\D/g, "")}` : value} className="rounded-xl border bg-white/80 p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--brand)]">
      <span className="flex items-center gap-2 font-semibold" style={{ color: brand }}><LinkIcon type={type} /><span className="capitalize">{type.replace("_", " ")}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{value}</span>
    </a>; })}
  </div>;
}
function Gallery({ data }: { data: ThemeCardData }) { if (!data.galleryItems.length) return null; return <div className="grid grid-cols-3 gap-2">{data.galleryItems.slice(0, 6).map((item, index) => <img key={`${item.url}-${index}`} src={item.url} alt={item.altText || item.caption || "Gallery image"} className="aspect-square rounded-xl object-cover" />)}</div>; }
function Payments({ data, brand }: { data: ThemeCardData; brand: string }) { const upi = get(data, "upi_id"); const qr = get(data, "upi_qr"); if (!upi && !qr) return null; return <section className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 font-bold"><WalletCards className="size-4" /> Payments</div>{upi && <a href={`upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(data.name)}&cu=INR`} className="mt-3 block rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: brand }}>Pay via UPI · {upi}</a>}{qr && <img src={qr} alt="UPI payment QR code" className="mt-3 size-28 rounded-lg" />}</section>; }
function Products({ products }: { products: ProductItem[] }) { return <ProductsSection products={products} />; }

export function ThemeCard({ data, className }: { data: ThemeCardData; className?: string }) {
  const photo = get(data, "photo"); const designation = get(data, "designation"); const company = get(data, "company_name"); const about = get(data, "company_description"); const theme = data.settings.themeId; const brand = data.settings.brandColor || "#059669"; const allStats = stats(data); const products = productItems(data);
  const identity = <><div className="flex items-center gap-3"><div className="size-16 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white">{photo ? <img src={photo} alt={data.name} className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-xl font-bold text-slate-600">{data.name.slice(0, 1)}</span>}</div><div><h1 className={cn("text-2xl font-black tracking-tight", data.settings.headingFont)}>{data.name}</h1>{designation && <p className="text-sm font-medium opacity-75">{designation}</p>}{company && <p className="text-xs opacity-60">{company}</p>}</div></div></>;
  const body = <div className={cn("contents", data.settings.bodyFont)}><Contact data={data} brand={brand} compact={theme === "bento"} />{about && <section><p className="text-[11px] font-bold uppercase tracking-[.16em] opacity-50">About</p><p className="mt-2 text-sm leading-6">{about}</p></section>}{allStats.length > 0 && <div className="grid grid-cols-3 divide-x rounded-xl border bg-white/70">{allStats.map((stat) => <div key={stat.label} className="p-3 text-center"><div className="font-mono text-lg font-bold" style={{ color: brand }}>{stat.value}</div><div className="text-[10px] opacity-60">{stat.label}</div></div>)}</div>}<Gallery data={data} />{products.length > 0 && <Products products={products} />}<Payments data={data} brand={brand} /></div>;
  if (theme === "bento") return <article className={cn("mx-auto max-w-lg rounded-[28px] bg-[#edf6f0] p-3 text-slate-900", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="grid grid-cols-2 gap-3"><div className="col-span-2 overflow-hidden rounded-3xl bg-slate-900 p-5 text-white" style={{ background: `linear-gradient(135deg, ${brand}, #0f172a)` }}>{identity}</div>{body}</div></article>;
  if (theme === "editorial") return <article className={cn("mx-auto max-w-lg bg-[#f8f4eb] p-6 text-[#17201b]", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="border-b pb-5" style={{ borderColor: brand }}>{identity}</div><div className={cn("mt-5 space-y-6", data.settings.bodyFont || "font-serif")}>{body}</div><div className="mt-6 flex justify-end"><QrCode className="size-6" style={{ color: brand }} /></div></article>;
  return <article className={cn("mx-auto max-w-lg overflow-hidden rounded-3xl bg-[#f3faf5] text-slate-900 shadow-xl", className)} style={{ "--brand": brand } as React.CSSProperties}><div className="h-20" style={{ background: `linear-gradient(135deg, ${brand}, #183c2a)` }} /><div className="-mt-8 space-y-5 p-5">{identity}{body}</div></article>;
}
```

Note: the `body` block is deliberately wrapped in a `<div className="contents ...">` — Tailwind's `contents` utility (`display: contents`) means the wrapper doesn't participate in layout (so the bento theme's `grid-cols-2` parent still sees `Contact`/`Gallery`/etc. as direct grid children, exactly as before), while the font class it carries still cascades to its text descendants via normal CSS inheritance.

- [ ] **Step 2: Manual verification**

In the dashboard builder (`/dashboard/builder`), add a Product (Business tab → Products → fill in title/price/image/buy link), then open the dashboard Preview tab (`/dashboard/preview`) or the public card link:
- The Products section appears with the item's image/title/price and a **Shop Now** button linking to the entered URL.
- Change the brand color in the setup wizard's theme step (or `CardSettings.brandColor` for an already-published user) and confirm the contact-tile icons and the "Pay via UPI" button (if a UPI id is set) visibly change to the new color, not just the header gradient.

- [ ] **Step 3: Commit**

```bash
git add components/card/products-section.tsx components/card/theme-card.tsx
git commit -m "fix: render Products/Shop Now on the live card, fix brand-color and body-font theming"
```

---

## Task 3: Two-column setup wizard with a persistent live preview

Today only Step 3 (Theme) and Step 5 (final preview) show a card preview, each with its own throwaway instance, and Step 3's theme choices only reach the preview *after* clicking "Save & Continue" (they're plain local state until then). This task lifts theme state up to `SetupWizard` so a single, persistent `CardPreviewPanel` (already built, with a mobile/desktop toggle) sits in a fixed right column across all 5 steps and updates live as the user types or picks a theme.

**Files:**
- Modify: `components/wizard/setup-wizard.tsx`
- Modify: `components/wizard/step-2-theme-brand.tsx`
- Modify: `components/wizard/step-5-preview-purchase.tsx`
- Delete: `components/card/card-preview-stub.tsx` (verified unused after this task — its only two callers are the two files above)

**Interfaces:**
- Consumes: `CardPreviewPanel` (`components/card/card-preview-panel.tsx`, already exists — `{ data: ThemeCardData; className?: string; defaultDevice?: "mobile" | "desktop" }`).
- Produces: `Step2ThemeBrand` becomes fully controlled (no more `initialThemeId`/`initialBrandColor`/`initialHeadingFont`/`initialBodyFont`/`previewBase` props) — its new prop shape is defined in Step 1 below, and `Step5PreviewPurchase` takes no props at all.

- [ ] **Step 1: Make `Step2ThemeBrand` a controlled component**

```tsx
// components/wizard/step-2-theme-brand.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";

export function Step2ThemeBrand({
  themeId,
  onThemeIdChange,
  brandColor,
  onBrandColorChange,
  headingFont,
  onHeadingFontChange,
  bodyFont,
  onBodyFontChange,
  onSaved,
}: {
  themeId: string;
  onThemeIdChange: (value: string) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  bodyFont: string;
  onBodyFontChange: (value: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const parsed = saveThemeSchema.safeParse({ themeId, brandColor, headingFont, bodyFont });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your theme and color");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/onboarding/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save your theme");
        return;
      }
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Choose Brand Theme</h2>
          <p className="text-sm text-muted-foreground">Pick a look for your card.</p>
        </div>
        <ThemeEditModal
          brandColor={brandColor}
          headingFont={headingFont}
          bodyFont={bodyFont}
          onSave={(next) => {
            onBrandColorChange(next.brandColor);
            onHeadingFontChange(next.headingFont);
            onBodyFontChange(next.bodyFont);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {THEME_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant={themeId === preset.id ? "default" : "outline"}
            onClick={() => onThemeIdChange(preset.id)}
          >
            {themeId === preset.id && <Check data-icon="inline-start" />} {preset.name}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {THEME_PRESETS.find((preset) => preset.id === themeId)?.description}
      </p>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Strip the preview out of `Step5PreviewPurchase`**

```tsx
// components/wizard/step-5-preview-purchase.tsx
"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Step5PreviewPurchase() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">Your card is ready</h2>
        <p className="text-sm text-muted-foreground">
          Check the live preview alongside this page, then choose a plan to publish it.
        </p>
      </div>

      <Button type="button" render={<Link href="/plans" />}>
        Choose plan
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Rebuild `SetupWizard` as a two-column shell with lifted theme state**

```tsx
// components/wizard/setup-wizard.tsx
"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { Step1ProfileFields } from "@/components/wizard/step-1-profile-fields";
import { Step2ThemeBrand } from "@/components/wizard/step-2-theme-brand";
import { Step3Gallery } from "@/components/wizard/step-3-gallery";
import { Step4SaveContact } from "@/components/wizard/step-4-save-contact";
import { Step5PreviewPurchase } from "@/components/wizard/step-5-preview-purchase";
import { CardPreviewPanel } from "@/components/card/card-preview-panel";
import type { WizardField } from "@/components/wizard/field-instance-row";
import type { WizardGalleryItem } from "@/components/wizard/gallery-item-list";

export type SetupWizardProps = {
  name: string;
  slug: string;
  initialCompany: string | null;
  initialStep: number;
  initialCardFields: WizardField[];
  initialGalleryItems: WizardGalleryItem[];
  initialThemeId: string;
  initialBrandColor: string;
  initialHeadingFont: string;
  initialBodyFont: string;
  initialGalleryLayout: string;
  initialVcfIncludePhoto: boolean;
};

export function SetupWizard({
  name,
  slug: initialSlug,
  initialCompany,
  initialStep,
  initialCardFields,
  initialGalleryItems,
  initialThemeId,
  initialBrandColor,
  initialHeadingFont,
  initialBodyFont,
  initialGalleryLayout,
  initialVcfIncludePhoto,
}: SetupWizardProps) {
  const [profileName, setProfileName] = useState(name);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [slug, setSlug] = useState(initialSlug);
  const [cardFields, setCardFields] = useState<WizardField[]>(initialCardFields);
  const [galleryItems, setGalleryItems] = useState<WizardGalleryItem[]>(initialGalleryItems);
  const [themeId, setThemeId] = useState(initialThemeId);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [bodyFont, setBodyFont] = useState(initialBodyFont);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [vcfIncludePhoto, setVcfIncludePhoto] = useState(initialVcfIncludePhoto);

  const previewData = {
    name: profileName,
    slug,
    fields: cardFields.map((f) => ({ ...f, order: 0, isVisible: true })),
    galleryItems: galleryItems.map((item) => ({ type: item.type, url: item.url, order: item.order })),
    settings: { themeId, brandColor, galleryLayout, vcfIncludePhoto, headingFont, bodyFont },
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex flex-col gap-6">
        <WizardStepper currentStep={step} />

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        )}

        {step === 1 && (
          <Step1ProfileFields
            initialFields={cardFields}
            initialCompany={initialCompany}
            initialName={name}
            onSaved={(fields, nextSlug, _company, nextName) => {
              setCardFields(fields);
              if (nextSlug) setSlug(nextSlug);
              if (nextName) setProfileName(nextName);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step3Gallery
            initialItems={galleryItems}
            initialGalleryLayout={galleryLayout}
            onSaved={(items, layout) => {
              setGalleryItems(items);
              setGalleryLayout(layout);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <Step2ThemeBrand
            themeId={themeId}
            onThemeIdChange={setThemeId}
            brandColor={brandColor}
            onBrandColorChange={setBrandColor}
            headingFont={headingFont}
            onHeadingFontChange={setHeadingFont}
            bodyFont={bodyFont}
            onBodyFontChange={setBodyFont}
            onSaved={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <Step4SaveContact
            name={profileName}
            fields={cardFields}
            initialVcfIncludePhoto={vcfIncludePhoto}
            onSaved={(includePhoto) => {
              setVcfIncludePhoto(includePhoto);
              setStep(5);
            }}
          />
        )}

        {step === 5 && <Step5PreviewPurchase />}
      </div>

      <div className="lg:sticky lg:top-8">
        <CardPreviewPanel data={previewData} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Delete the now-dead preview stub**

```bash
git rm components/card/card-preview-stub.tsx
```

- [ ] **Step 5: Verify no other references broke**

```bash
grep -rn "CardPreviewStub\|CardPreviewData" --include="*.tsx" --include="*.ts" .
```
Expected: no matches.

- [ ] **Step 6: Manual verification**

Go through `/setup` as a fresh (unpublished) user: type a name in Step 1 — the right-column preview updates live. Move to Step 3 (Theme), switch presets and drag the brand-color picker in `ThemeEditModal` — the preview updates on every change, not just after "Save & Continue". Resize the browser below `lg` — the preview should stack below the form instead of overlapping it.

- [ ] **Step 7: Commit**

```bash
git add components/wizard/setup-wizard.tsx components/wizard/step-2-theme-brand.tsx components/wizard/step-5-preview-purchase.tsx
git rm components/card/card-preview-stub.tsx 2>/dev/null
git commit -m "feat: persistent two-column live preview in the setup wizard"
```

---

## Task 4: Extract CardField mutations into a userId-parameterized service

Preparation for admin card editing: pull the create/update/delete/visibility logic already in the session-scoped routes into plain functions that take an explicit `userId`, with zero behavior change, so the same functions can be called by both the existing user routes and the new admin routes.

**Files:**
- Create: `lib/services/card-field-service.ts`
- Modify: `app/api/card-field/route.ts`, `app/api/card-field/[id]/route.ts`, `app/api/card-field/[id]/visibility/route.ts`

**Interfaces:**
- Produces: `createCardFieldForUser(userId, input)`, `updateCardFieldForUser(userId, fieldId, input)`, `deleteCardFieldForUser(userId, fieldId)`, `setCardFieldVisibilityForUser(userId, fieldId, isVisible)` — each returns `ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }`.

- [ ] **Step 1: Create the service**

```ts
// lib/services/card-field-service.ts
import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { getFieldUsage } from "@/lib/plan-limits";
import { STRUCTURED_FIELD_TYPES, parseAndValidateStructuredValue } from "@/lib/validations/card-field";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

type CardFieldRow = {
  id: string;
  fieldType: string;
  label: string;
  value: string;
  order: number;
  isVisible: boolean;
};

function normalizeValue(fieldType: string, rawValue: string): string {
  if (fieldType === "bio") return sanitizeRichTextServer(rawValue);
  if (fieldType === "custom_html") return sanitizeRichTextServer(rawValue, { allowCustomHtmlTags: true });
  if (STRUCTURED_FIELD_TYPES.has(fieldType)) return parseAndValidateStructuredValue(fieldType, rawValue);
  return rawValue;
}

export async function createCardFieldForUser(
  userId: string,
  input: { fieldType: string; label: string; value: string }
): Promise<ServiceResult<CardFieldRow>> {
  const { count, max } = await getFieldUsage(userId);
  if (count >= max) {
    return { ok: false, status: 400, error: "Field limit reached for your plan" };
  }

  let value: string;
  try {
    value = normalizeValue(input.fieldType, input.value);
  } catch {
    return { ok: false, status: 400, error: "Invalid value for field type" };
  }

  const last = await db.cardField.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const field = await db.cardField.create({
    data: { userId, fieldType: input.fieldType, label: input.label, value, order: (last?.order ?? -1) + 1 },
  });

  await revalidateUserCard(userId);
  return { ok: true, data: field };
}

export async function updateCardFieldForUser(
  userId: string,
  fieldId: string,
  input: { label: string; value: string }
): Promise<ServiceResult<CardFieldRow>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  let value: string;
  try {
    value = normalizeValue(field.fieldType, input.value);
  } catch {
    return { ok: false, status: 400, error: "Invalid value for field type" };
  }

  const updated = await db.cardField.update({ where: { id: fieldId }, data: { label: input.label, value } });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}

export async function deleteCardFieldForUser(userId: string, fieldId: string): Promise<ServiceResult<null>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  await db.cardField.delete({ where: { id: fieldId } });
  await revalidateUserCard(userId);
  return { ok: true, data: null };
}

export async function setCardFieldVisibilityForUser(
  userId: string,
  fieldId: string,
  isVisible: boolean
): Promise<ServiceResult<CardFieldRow>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const updated = await db.cardField.update({ where: { id: fieldId }, data: { isVisible } });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}
```

- [ ] **Step 2: Delegate the existing user routes to it**

```ts
// app/api/card-field/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createCardFieldForUser(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}
```

```ts
// app/api/card-field/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { deleteCardFieldForUser, updateCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateCardFieldForUser(session.user.id, params.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteCardFieldForUser(session.user.id, params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
```

```ts
// app/api/card-field/[id]/visibility/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { setCardFieldVisibilityForUser } from "@/lib/services/card-field-service";
import { cardFieldVisibilitySchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = cardFieldVisibilitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setCardFieldVisibilityForUser(session.user.id, params.id, parsed.data.isVisible);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}
```

- [ ] **Step 3: Regression-check the refactor**

```bash
npx tsc --noEmit
```
Expected: no new type errors. Then manually: in `/dashboard/builder`, add a field, edit its value, toggle its visibility, delete it — all four should still work exactly as before (this is a pure refactor, not a behavior change).

- [ ] **Step 4: Commit**

```bash
git add lib/services/card-field-service.ts app/api/card-field/route.ts app/api/card-field/[id]/route.ts app/api/card-field/[id]/visibility/route.ts
git commit -m "refactor: extract CardField mutations into a userId-parameterized service"
```

---

## Task 5: Extract GalleryItem mutations into a userId-parameterized service

Same pattern as Task 4, for gallery image upload, YouTube add, item update/delete, and layout change.

**Files:**
- Create: `lib/services/gallery-service.ts`
- Modify: `app/api/gallery/[id]/route.ts`, `app/api/gallery/layout/route.ts`, `app/api/gallery/upload/route.ts`, `app/api/gallery/youtube/route.ts`

**Interfaces:**
- Produces: `uploadGalleryImageForUser(userId, file)`, `addYoutubeItemForUser(userId, url)`, `updateGalleryItemForUser(userId, itemId, input)`, `deleteGalleryItemForUser(userId, itemId)`, `setGalleryLayoutForUser(userId, galleryLayout)` — same `ServiceResult<T>` shape as Task 4 (re-exported, not redefined).

- [ ] **Step 1: Create the service**

```ts
// lib/services/gallery-service.ts
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { getGalleryUsage, getVideoUsage } from "@/lib/plan-limits";
import { getYoutubeVideoId } from "@/lib/youtube";
import type { ServiceResult } from "@/lib/services/card-field-service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type GalleryItemRow = {
  id: string;
  type: "IMAGE" | "YOUTUBE";
  url: string;
  cloudinaryId: string | null;
  caption: string | null;
  altText: string | null;
  order: number;
};

export async function uploadGalleryImageForUser(userId: string, file: File): Promise<ServiceResult<GalleryItemRow>> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, status: 400, error: "Unsupported image type" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, status: 400, error: "File is too large (max 10MB)" };
  }

  const { count, max } = await getGalleryUsage(userId);
  if (count >= max) {
    return { ok: false, status: 400, error: "Image limit reached for your plan" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(dataUri, { folder: "gallery", resource_type: "image" });

  const lastItem = await db.galleryItem.findFirst({ where: { userId }, orderBy: { order: "desc" } });
  const item = await db.galleryItem.create({
    data: {
      userId,
      type: "IMAGE",
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      order: (lastItem?.order ?? -1) + 1,
    },
  });

  await revalidateUserCard(userId);
  return { ok: true, data: item };
}

export async function addYoutubeItemForUser(userId: string, url: string): Promise<ServiceResult<GalleryItemRow>> {
  if (!getYoutubeVideoId(url)) {
    return { ok: false, status: 400, error: "Not a valid YouTube URL" };
  }

  const { count, max } = await getVideoUsage(userId);
  if (count >= max) {
    return { ok: false, status: 400, error: "Video limit reached for your plan" };
  }

  const lastItem = await db.galleryItem.findFirst({ where: { userId }, orderBy: { order: "desc" } });
  const item = await db.galleryItem.create({ data: { userId, type: "YOUTUBE", url, order: (lastItem?.order ?? -1) + 1 } });

  await revalidateUserCard(userId);
  return { ok: true, data: item };
}

export async function updateGalleryItemForUser(
  userId: string,
  itemId: string,
  input: { caption?: string; altText?: string }
): Promise<ServiceResult<GalleryItemRow>> {
  const item = await db.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const updated = await db.galleryItem.update({ where: { id: itemId }, data: input });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}

export async function deleteGalleryItemForUser(userId: string, itemId: string): Promise<ServiceResult<null>> {
  const item = await db.galleryItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  if (item.cloudinaryId) {
    await cloudinary.uploader.destroy(item.cloudinaryId).catch((err) => {
      console.error("cloudinary destroy failed", err);
    });
  }

  await db.galleryItem.delete({ where: { id: itemId } });
  await revalidateUserCard(userId);
  return { ok: true, data: null };
}

export async function setGalleryLayoutForUser(userId: string, galleryLayout: string) {
  const cardSettings = await db.cardSettings.upsert({
    where: { userId },
    update: { galleryLayout },
    create: { userId, galleryLayout },
  });
  await revalidateUserCard(userId);
  return cardSettings;
}
```

- [ ] **Step 2: Delegate the existing user routes to it**

```ts
// app/api/gallery/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { deleteGalleryItemForUser, updateGalleryItemForUser } from "@/lib/services/gallery-service";
import { galleryItemUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = galleryItemUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateGalleryItemForUser(session.user.id, params.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteGalleryItemForUser(session.user.id, params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
```

```ts
// app/api/gallery/layout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { setGalleryLayoutForUser } from "@/lib/services/gallery-service";
import { saveGalleryLayoutSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveGalleryLayoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardSettings = await setGalleryLayoutForUser(session.user.id, parsed.data.galleryLayout);

  await db.user.updateMany({
    where: { id: session.user.id, onboardingStep: { lt: 4 } },
    data: { onboardingStep: 4 },
  });

  return NextResponse.json({ success: true, cardSettings });
}
```

```ts
// app/api/gallery/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { uploadGalleryImageForUser } from "@/lib/services/gallery-service";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await uploadGalleryImageForUser(session.user.id, file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
```

```ts
// app/api/gallery/youtube/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { addYoutubeItemForUser } from "@/lib/services/gallery-service";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = saveYoutubeItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await addYoutubeItemForUser(session.user.id, parsed.data.url);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
```

- [ ] **Step 3: Regression-check**

```bash
npx tsc --noEmit
```
Then manually in `/dashboard/builder`'s Gallery tab: upload an image, add a YouTube URL, edit a caption, change the layout, delete an item — all unchanged from before.

- [ ] **Step 4: Commit**

```bash
git add lib/services/gallery-service.ts app/api/gallery/[id]/route.ts app/api/gallery/layout/route.ts app/api/gallery/upload/route.ts app/api/gallery/youtube/route.ts
git commit -m "refactor: extract GalleryItem mutations into a userId-parameterized service"
```

---

## Task 6: Admin-scoped mirror routes for card-field, gallery, and card-settings

Add the admin guard helper, then one admin route per existing user route, each calling the exact same service function from Tasks 4–5 but with `params.id` (the target user) instead of `session.user.id`.

**Files:**
- Create: `lib/admin-guard.ts`
- Create: `app/api/admin/users/[id]/card-field/route.ts`
- Create: `app/api/admin/users/[id]/card-field/[fieldId]/route.ts`
- Create: `app/api/admin/users/[id]/card-field/[fieldId]/visibility/route.ts`
- Create: `app/api/admin/users/[id]/card-field/upload/route.ts`
- Create: `app/api/admin/users/[id]/gallery/[itemId]/route.ts`
- Create: `app/api/admin/users/[id]/gallery/layout/route.ts`
- Create: `app/api/admin/users/[id]/gallery/upload/route.ts`
- Create: `app/api/admin/users/[id]/gallery/youtube/route.ts`
- Create: `app/api/admin/users/[id]/card-settings/route.ts`
- Modify: `lib/audit-log.ts`
- Modify: `lib/validations/admin.ts`

**Interfaces:**
- Consumes: every service function from Tasks 4–5.
- Produces: `requireAdminSession()` → `{ ok: true; session: Session } | { ok: false; response: NextResponse }`; each admin route path mirrors the suffix of its user-facing counterpart, so `SectionBuilder`'s future `apiBase` prop (Task 7) can point at `/api/admin/users/${id}` and reuse identical relative paths (`/card-field`, `/card-field/upload`, `/gallery/${itemId}`, `/gallery/layout`, `/gallery/upload`, `/gallery/youtube`).

- [ ] **Step 1: Admin guard helper**

```ts
// lib/admin-guard.ts
import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireAdminSession(): Promise<
  { ok: true; session: Session } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session };
}
```

- [ ] **Step 2: Add the `"user.card.update"` audit action**

```ts
// lib/audit-log.ts — extend the union
export type AuditAction =
  | "plan.create"
  | "plan.update"
  | "plan.duplicate"
  | "plan.delete"
  | "plan.enable"
  | "plan.disable"
  | "plan.import"
  | "user.update"
  | "user.card.update";
```

- [ ] **Step 3: Admin card-field routes**

```ts
// app/api/admin/users/[id]/card-field/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { createCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldInputSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createCardFieldForUser(params.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.create", fieldType: parsed.data.fieldType },
  });

  return NextResponse.json({ success: true, field: result.data });
}
```

```ts
// app/api/admin/users/[id]/card-field/[fieldId]/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { deleteCardFieldForUser, updateCardFieldForUser } from "@/lib/services/card-field-service";
import { cardFieldUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateCardFieldForUser(params.id, params.fieldId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.update", fieldId: params.fieldId },
  });

  return NextResponse.json({ success: true, field: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const result = await deleteCardFieldForUser(params.id, params.fieldId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "card-field.delete", fieldId: params.fieldId },
  });

  return NextResponse.json({ success: true });
}
```

```ts
// app/api/admin/users/[id]/card-field/[fieldId]/visibility/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { setCardFieldVisibilityForUser } from "@/lib/services/card-field-service";
import { cardFieldVisibilitySchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; fieldId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = cardFieldVisibilitySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setCardFieldVisibilityForUser(params.id, params.fieldId, parsed.data.isVisible);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, field: result.data });
}
```

```ts
// app/api/admin/users/[id]/card-field/upload/route.ts
import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { requireAdminSession } from "@/lib/admin-guard";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(dataUri, { folder: "card-files", resource_type: "auto" });

  return NextResponse.json({ success: true, url: uploadResult.secure_url, cloudinaryId: uploadResult.public_id });
}
```

- [ ] **Step 4: Admin gallery routes**

```ts
// app/api/admin/users/[id]/gallery/[itemId]/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { writeAuditLog } from "@/lib/audit-log";
import { deleteGalleryItemForUser, updateGalleryItemForUser } from "@/lib/services/gallery-service";
import { galleryItemUpdateSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = galleryItemUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateGalleryItemForUser(params.id, params.itemId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const result = await deleteGalleryItemForUser(params.id, params.itemId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    actorId: guard.session.user.id,
    actorEmail: guard.session.user.email!,
    action: "user.card.update",
    targetType: "user",
    targetId: params.id,
    metadata: { op: "gallery.delete", itemId: params.itemId },
  });

  return NextResponse.json({ success: true });
}
```

```ts
// app/api/admin/users/[id]/gallery/layout/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { setGalleryLayoutForUser } from "@/lib/services/gallery-service";
import { saveGalleryLayoutSchema } from "@/lib/validations/onboarding";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = saveGalleryLayoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardSettings = await setGalleryLayoutForUser(params.id, parsed.data.galleryLayout);
  return NextResponse.json({ success: true, cardSettings });
}
```

```ts
// app/api/admin/users/[id]/gallery/upload/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { uploadGalleryImageForUser } from "@/lib/services/gallery-service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await uploadGalleryImageForUser(params.id, file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
```

```ts
// app/api/admin/users/[id]/gallery/youtube/route.ts
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-guard";
import { addYoutubeItemForUser } from "@/lib/services/gallery-service";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = saveYoutubeItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await addYoutubeItemForUser(params.id, parsed.data.url);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, item: result.data });
}
```

- [ ] **Step 5: Admin card-settings route (theme/brand/fonts/layout)**

Add the schema:

```ts
// lib/validations/admin.ts — add near the other schemas, plus the import at top
import { THEME_PRESET_IDS, FONT_OPTION_IDS } from "@/lib/theme-presets";
import { galleryLayoutEnum } from "@/lib/validations/onboarding";

export const adminCardSettingsSchema = z.object({
  themeId: z.enum(THEME_PRESET_IDS).optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color like #1A2B3C").optional(),
  headingFont: z.enum(FONT_OPTION_IDS).optional(),
  bodyFont: z.enum(FONT_OPTION_IDS).optional(),
  galleryLayout: galleryLayoutEnum.optional(),
});

export type AdminCardSettingsInput = z.infer<typeof adminCardSettingsSchema>;
```

Then the route:

```ts
// app/api/admin/users/[id]/card-settings/route.ts
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { adminCardSettingsSchema } from "@/lib/validations/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const cardSettings = await db.cardSettings.findUnique({ where: { userId: params.id } });
  return NextResponse.json({ cardSettings });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const parsed = adminCardSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cardSettings = await db.cardSettings.upsert({
    where: { userId: params.id },
    update: parsed.data,
    create: { userId: params.id, ...parsed.data },
  });

  await revalidateUserCard(params.id);
  return NextResponse.json({ success: true, cardSettings });
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add lib/admin-guard.ts lib/audit-log.ts lib/validations/admin.ts app/api/admin/users/[id]/card-field app/api/admin/users/[id]/gallery app/api/admin/users/[id]/card-settings
git commit -m "feat: admin-scoped card-field, gallery, and card-settings API routes"
```

---

## Task 7: Make `SectionBuilder`, `FieldEditor`, and `GalleryEditor` reusable in admin mode

Add an `apiBase` prop (default `"/api"`) so every fetch call in the builder can be redirected at `/api/admin/users/{id}` instead, and a `mode` prop to hide the Publish action when an admin is editing someone else's card (admins already control `cardPublished` from the account-edit dialog).

**Files:**
- Modify: `components/dashboard/section-builder.tsx`
- Modify: `components/dashboard/section-editors/field-editor.tsx`
- Modify: `components/dashboard/section-editors/gallery-editor.tsx`
- Modify: `app/(dashboard)/dashboard/builder/page.tsx` (pass nothing new — defaults are unchanged, verifying no prop-shape break)

**Interfaces:**
- Produces: `SectionBuilder` gains `apiBase?: string` (default `"/api"`) and `mode?: "user" | "admin"` (default `"user"`). `FieldEditor` gains `uploadEndpoint?: string` (default `"/api/card-field/upload"`). `GalleryEditor` gains `uploadEndpoint?: string` (default `"/api/gallery/upload"`) and `youtubeEndpoint?: string` (default `"/api/gallery/youtube"`).

- [ ] **Step 1: `FieldEditor` — parameterize the upload endpoint**

```tsx
// components/dashboard/section-editors/field-editor.tsx
export function FieldEditor({
  field,
  onSave,
  uploadEndpoint = "/api/card-field/upload",
}: {
  field: CardSectionField;
  onSave: (next: { label: string; value: string }) => void;
  uploadEndpoint?: string;
}) {
  const [label, setLabel] = useState(field.label);
  const [value, setValue] = useState(field.value);
  const [isUploading, setIsUploading] = useState(false);

  useDebouncedAutosave({ label, value }, (next) => onSave(next));

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setValue(data.url);
      onSave({ label, value: data.url });
    } finally {
      setIsUploading(false);
    }
  }
  // ...rest of the file (BusinessHoursEditor, JSX) is unchanged
```

- [ ] **Step 2: `GalleryEditor` — parameterize upload and YouTube endpoints**

```tsx
// components/dashboard/section-editors/gallery-editor.tsx
// Change uploadWithProgress to accept the endpoint:
function uploadWithProgress(file: File, endpoint: string, onProgress: (pct: number) => void) {
  return new Promise<{ item: ManagedGalleryItem }>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // handled by status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as { item: ManagedGalleryItem });
      else reject(new Error(typeof data.error === "string" ? data.error : "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

// Add the two props to the component signature:
export function GalleryEditor({
  items,
  galleryLayout,
  usage,
  onAddImage,
  onAddYoutube,
  onUpdateItem,
  onRemoveItem,
  onLayoutChange,
  uploadEndpoint = "/api/gallery/upload",
  youtubeEndpoint = "/api/gallery/youtube",
}: {
  items: ManagedGalleryItem[];
  galleryLayout: string;
  usage: { count: number; max: number };
  onAddImage: (item: ManagedGalleryItem) => void;
  onAddYoutube: (item: ManagedGalleryItem) => void;
  onUpdateItem: (id: string, next: { caption?: string; altText?: string }) => void;
  onRemoveItem: (id: string) => void;
  onLayoutChange: (layout: string) => void;
  uploadEndpoint?: string;
  youtubeEndpoint?: string;
}) {
  // ...existing state...

  async function handleImageUpload(file: File) {
    if (atLimit) {
      toast.error("Image limit reached for your plan");
      return;
    }
    setUploadProgress(0);
    try {
      const toUpload = cropSquare ? await cropToSquare(file) : file;
      const data = await uploadWithProgress(toUpload, uploadEndpoint, setUploadProgress);
      onAddImage(data.item);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  }

  // handleAddYoutube: change the fetch URL from the literal "/api/gallery/youtube" to youtubeEndpoint
  async function handleAddYoutube() {
    const parsed = saveYoutubeItemSchema.safeParse({ url: youtubeUrl });
    if (!parsed.success) {
      toast.error("Enter a valid YouTube URL");
      return;
    }
    setIsAddingYoutube(true);
    try {
      const res = await fetch(youtubeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not add that video");
        return;
      }
      onAddYoutube(data.item);
      setYoutubeUrl("");
      setYoutubePreview(null);
    } finally {
      setIsAddingYoutube(false);
    }
  }
  // ...rest of the file (cropToSquare, GalleryItemRow, JSX) is unchanged
```

- [ ] **Step 3: `SectionBuilder` — add `apiBase`/`mode`, route every fetch through them, hide Publish in admin mode**

Apply these changes to `components/dashboard/section-builder.tsx`:

```tsx
// Signature: add apiBase and mode
export function SectionBuilder({
  userSlug,
  initialCardPublished,
  initialFields,
  initialGalleryItems,
  initialGalleryLayout,
  initialGallerySectionOrder,
  galleryUsage,
  apiBase = "/api",
  mode = "user",
}: {
  userSlug: string;
  initialCardPublished: boolean;
  initialFields: BuilderField[];
  initialGalleryItems: ManagedGalleryItem[];
  initialGalleryLayout: string;
  initialGallerySectionOrder: number;
  galleryUsage: { count: number; max: number };
  apiBase?: string;
  mode?: "user" | "admin";
}) {
```

Replace every literal endpoint string in the file's fetch calls with a template using `apiBase`:
- `"/api/card-field"` → `` `${apiBase}/card-field` `` (in `addField`)
- `` `/api/card-field/${id}` `` → `` `${apiBase}/card-field/${id}` `` (in `updateField`, `deleteField`, `deleteFields`)
- `` `/api/card-field/${id}/visibility` `` → `` `${apiBase}/card-field/${id}/visibility` `` (in `toggleFieldVisibility`, `toggleGroupVisibility`)
- `` `/api/gallery/${id}` `` → `` `${apiBase}/gallery/${id}` `` (in the `GalleryEditor`'s `onUpdateItem`/`onRemoveItem` callbacks inside `renderBlockEditor`)
- `"/api/gallery/layout"` → `` `${apiBase}/gallery/layout` `` (in the `onLayoutChange` callback)
- `"/api/card-builder/publish"` → skip when `mode === "admin"` (see below)

Pass the two new endpoint props down to the two editors that upload files, inside `renderBlockEditor`:

```tsx
if (block.kind === "field") {
  return <FieldEditor field={block.field} onSave={(next) => updateField(block.field.id, next)} uploadEndpoint={`${apiBase}/card-field/upload`} />;
}
if (block.kind === "gallery") {
  return (
    <GalleryEditor
      items={galleryItems}
      galleryLayout={galleryLayout}
      usage={{ count: imageCount, max: galleryUsage.max }}
      uploadEndpoint={`${apiBase}/gallery/upload`}
      youtubeEndpoint={`${apiBase}/gallery/youtube`}
      onAddImage={(item) => {
        setGalleryItems((prev) => [...prev, item]);
        setImageCount((prev) => prev + 1);
      }}
      onAddYoutube={(item) => setGalleryItems((prev) => [...prev, item])}
      onUpdateItem={async (id, next) => {
        const previous = galleryItems;
        setGalleryItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
        const res = await fetch(`${apiBase}/gallery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          setGalleryItems(previous);
          toast.error("Could not save changes");
        }
      }}
      onRemoveItem={async (id) => {
        const previous = galleryItems;
        const removed = galleryItems.find((i) => i.id === id);
        setGalleryItems((prev) => prev.filter((i) => i.id !== id));
        if (removed?.type === "IMAGE") setImageCount((prev) => prev - 1);
        const res = await fetch(`${apiBase}/gallery/${id}`, { method: "DELETE" });
        if (!res.ok) {
          setGalleryItems(previous);
          if (removed?.type === "IMAGE") setImageCount((prev) => prev + 1);
          toast.error("Could not remove item");
        }
      }}
      onLayoutChange={async (layout) => {
        const previous = galleryLayout;
        setGalleryLayout(layout);
        const res = await fetch(`${apiBase}/gallery/layout`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galleryLayout: layout }),
        });
        if (!res.ok) {
          setGalleryLayout(previous);
          toast.error("Could not save layout");
        }
      }}
    />
  );
}
```

Finally, hide the Publish header action in admin mode:

```tsx
action={
  <div className="flex items-center gap-2">
    {/* ...saveState indicator and "Preview card" link unchanged... */}
    {mode === "user" && (
      isPublished ? (
        <Badge variant="secondary" className="h-8 px-3">Published</Badge>
      ) : (
        <Button type="button" size="sm" disabled={isPublishing} onClick={handlePublish}>
          {isPublishing ? <Loader2 className="animate-spin" /> : null} Publish
        </Button>
      )
    )}
  </div>
}
```

- [ ] **Step 4: Confirm the default (user) path is unaffected**

```bash
npx tsc --noEmit
```
Then in `/dashboard/builder` as a normal user: add/edit/delete a field, upload a gallery image, add a YouTube link, change layout, publish — every action should behave exactly as before (all defaults resolve to the same literal paths that were hardcoded previously).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/section-builder.tsx components/dashboard/section-editors/field-editor.tsx components/dashboard/section-editors/gallery-editor.tsx
git commit -m "refactor: parameterize SectionBuilder's API base so it can run in admin mode"
```

---

## Task 8: Admin card-content editor page

Build the admin-facing page that lets an admin fully edit a user's card: account fields (reusing the existing `UserForm` dialog), theme/brand settings, and the full `SectionBuilder` pointed at that user via Task 7's `apiBase`/`mode` props.

**Files:**
- Create: `components/admin/admin-card-settings-form.tsx`
- Create: `components/admin/admin-card-editor.tsx`
- Create: `app/(admin)/admin/users/[id]/page.tsx`
- Modify: `components/admin/users-table.tsx`

**Interfaces:**
- Consumes: `SectionBuilder` (Task 7's new props), `UserForm` (`components/admin/user-form.tsx`, exists), `getGalleryUsage`/`getFieldTypeMeta`/`MANDATORY_FIELD_TYPES` (existing).
- Produces: route `/admin/users/[id]`.

- [ ] **Step 1: Theme/brand settings form**

```tsx
// components/admin/admin-card-settings-form.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEME_PRESETS, FONT_OPTIONS } from "@/lib/theme-presets";

export type AdminCardSettings = {
  themeId: string;
  brandColor: string;
  headingFont: string;
  bodyFont: string;
  galleryLayout: string;
};

export function AdminCardSettingsForm({ userId, initial }: { userId: string; initial: AdminCardSettings }) {
  const [values, setValues] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/card-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save theme settings");
        return;
      }
      toast.success("Theme settings saved");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
      <h3 className="font-semibold">Theme &amp; brand</h3>

      <div className="flex flex-col gap-1.5">
        <Label>Theme</Label>
        <Select value={values.themeId} onValueChange={(v) => setValues((s) => ({ ...s, themeId: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {THEME_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-brand-color">Brand color</Label>
        <Input
          id="admin-brand-color"
          type="color"
          value={values.brandColor}
          onChange={(e) => setValues((s) => ({ ...s, brandColor: e.target.value }))}
          className="h-10 w-20 p-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Heading font</Label>
          <Select value={values.headingFont} onValueChange={(v) => setValues((s) => ({ ...s, headingFont: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>{font.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Body font</Label>
          <Select value={values.bodyFont} onValueChange={(v) => setValues((s) => ({ ...s, bodyFont: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>{font.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save theme settings"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Card editor wrapper**

```tsx
// components/admin/admin-card-editor.tsx
"use client";

import { SectionBuilder, type BuilderField } from "@/components/dashboard/section-builder";
import type { ManagedGalleryItem } from "@/components/dashboard/section-editors/gallery-editor";
import { AdminCardSettingsForm, type AdminCardSettings } from "@/components/admin/admin-card-settings-form";

export function AdminCardEditor({
  userId,
  userSlug,
  cardPublished,
  fields,
  galleryItems,
  galleryLayout,
  gallerySectionOrder,
  galleryUsage,
  cardSettings,
}: {
  userId: string;
  userSlug: string;
  cardPublished: boolean;
  fields: BuilderField[];
  galleryItems: ManagedGalleryItem[];
  galleryLayout: string;
  gallerySectionOrder: number;
  galleryUsage: { count: number; max: number };
  cardSettings: AdminCardSettings;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AdminCardSettingsForm userId={userId} initial={cardSettings} />

      <SectionBuilder
        userSlug={userSlug}
        initialCardPublished={cardPublished}
        initialFields={fields}
        initialGalleryItems={galleryItems}
        initialGalleryLayout={galleryLayout}
        initialGallerySectionOrder={gallerySectionOrder}
        galleryUsage={galleryUsage}
        apiBase={`/api/admin/users/${userId}`}
        mode="admin"
      />
    </div>
  );
}
```

- [ ] **Step 3: The admin page itself**

```tsx
// app/(admin)/admin/users/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { getGalleryUsage } from "@/lib/plan-limits";
import { getFieldTypeMeta, MANDATORY_FIELD_TYPES } from "@/lib/field-types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/user-form";
import { AdminCardEditor } from "@/components/admin/admin-card-editor";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [user, plans] = await Promise.all([
    db.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, slug: true, cardPublished: true, planId: true },
    }),
    db.plan.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  const [existingFields, galleryItems, cardSettings, usage] = await Promise.all([
    db.cardField.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    db.galleryItem.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    db.cardSettings.findUnique({ where: { userId: user.id } }),
    getGalleryUsage(user.id),
  ]);

  // Same mandatory-field backfill the user's own builder page does, so an
  // admin-created (or admin-first-edited) card isn't missing required tabs.
  const present = new Set(existingFields.map((f) => f.fieldType));
  const missing = MANDATORY_FIELD_TYPES.filter((type) => !present.has(type));
  if (missing.length > 0) {
    const nextOrder = existingFields.reduce((max, f) => Math.max(max, f.order), -1) + 1;
    await db.cardField.createMany({
      data: missing.map((fieldType, index) => ({
        userId: user.id,
        fieldType,
        label: getFieldTypeMeta(fieldType).label,
        value: "",
        order: nextOrder + index,
      })),
    });
  }

  const fields = missing.length
    ? await db.cardField.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } })
    : existingFields;

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8 lg:p-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/admin/users" />}>
          <ArrowLeft /> Back to Users
        </Button>
      </div>

      <PageHeader
        icon={ArrowLeft}
        title={user.name ?? user.email}
        description={user.email}
        action={
          <UserForm
            plans={plans}
            userId={user.id}
            trigger={<Button variant="outline" size="sm">Edit account details</Button>}
          />
        }
      />

      <AdminCardEditor
        userId={user.id}
        userSlug={user.slug}
        cardPublished={user.cardPublished}
        fields={fields
          .filter((f) => f.fieldType !== "photo")
          .map((f) => ({
            id: f.id,
            fieldType: f.fieldType,
            label: f.label,
            value: f.value,
            order: f.order,
            isVisible: f.isVisible,
          }))}
        galleryItems={galleryItems.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          order: item.order,
          caption: item.caption,
          altText: item.altText,
        }))}
        galleryLayout={cardSettings?.galleryLayout ?? "grid"}
        gallerySectionOrder={cardSettings?.gallerySectionOrder ?? 9999}
        galleryUsage={usage}
        cardSettings={{
          themeId: cardSettings?.themeId ?? "original",
          brandColor: cardSettings?.brandColor ?? "#059669",
          headingFont: cardSettings?.headingFont ?? "font-sans",
          bodyFont: cardSettings?.bodyFont ?? "font-sans",
        }}
      />
    </main>
  );
}
```

Note: `PageHeader`'s `icon` prop is reused with `ArrowLeft` here purely to satisfy its required prop — if `PageHeader` requires a semantically different icon, swap in any user-icon already imported elsewhere in `app/(admin)/admin/users/page.tsx` (e.g. `Users` from `lucide-react`) instead; check `components/shared/page-header.tsx`'s prop type before finalizing.

- [ ] **Step 4: Link to it from the users table**

```tsx
// components/admin/users-table.tsx
// Add the import:
import Link from "next/link";
import { LayoutTemplate, Pencil, Search } from "lucide-react";

// In the actions cell, alongside the existing edit-account UserForm trigger:
<TableCell>
  <div className="flex items-center justify-end gap-1">
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Manage card"
      render={<Link href={`/admin/users/${user.id}`} />}
    >
      <LayoutTemplate />
    </Button>
    <UserForm
      plans={plans}
      userId={user.id}
      onSaved={onChanged}
      trigger={
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit user">
          <Pencil />
        </Button>
      }
    />
  </div>
</TableCell>
```

- [ ] **Step 5: Manual verification**

As the admin, go to `/admin/users`, click the new "Manage card" icon on any row (e.g. a test user created via "Add user"): the page loads with the exact same tabbed builder UI as `/dashboard/builder`, pre-filled with that user's existing content. Add/edit/delete a profile field, upload a gallery image, add a product, change the theme/brand color and save — then open that user's public card (`/{slug}`) and confirm the changes are live. Confirm a *normal user* still cannot reach any `/api/admin/users/**` route (should 401 without an admin session).

- [ ] **Step 6: Commit**

```bash
git add components/admin/admin-card-settings-form.tsx components/admin/admin-card-editor.tsx "app/(admin)/admin/users/[id]/page.tsx" components/admin/users-table.tsx
git commit -m "feat: admin can edit a user's full card content, not just account fields"
```

---

## Task 9: Verify and run the data wipe

`scripts/wipe-data.ts` already exists (dry-run by default, requires `ADMIN_EMAIL` to resolve to an existing `ADMIN` user, deletes every other user and their dependent rows in an FK-safe order, preserves `Plan`/`SiteContent`/`Settings`). A live check of the connected Neon database during planning showed **exactly one user already exists** — the seeded admin (`ADMIN_EMAIL` from `.env`) — so this task is primarily a verification step, not a large deletion.

**Files:** none (operational task only).

- [ ] **Step 1: Dry run**

```bash
pnpm db:wipe
```
Expected output: a table with `users: 0` (no other users exist) and every other count at 0, ending in "Dry run. Re-run with --yes to delete." If `users` (or any count) is non-zero, stop and show the output to the user before proceeding — do not run `--yes` without their explicit go-ahead, since this step is destructive and irreversible.

- [ ] **Step 2: Run for real only after the dry run is confirmed empty (or after explicit user confirmation if not)**

```bash
pnpm db:wipe -- --yes
```
Expected: "Done. Database wiped except for the admin account."

- [ ] **Step 3: Post-check**

Re-run the read-only count query used during planning (or `pnpm db:wipe` again, which is safe/idempotent as a dry run) to confirm exactly one user remains and it is the `ADMIN_EMAIL` account with `role: "ADMIN"`.

---

## Self-Review Notes

- **Spec coverage:** "remove preview screen, just tabs + prefilled details, dashboard gated behind a plan" → already done in the working tree (verified against the live DB and source; not re-planned). "Publish button not working" → already fixed in the working tree (verified: try/catch + `router.refresh()`). "New Preview tab in sidebar" → already done (`/dashboard/preview` + nav-config entry, verified). "Setup form theme + two-column + live preview + QR for every user" → Tasks 2, 3 (QR is already per-slug/per-user and surfaced on both Overview and the new Preview tab — no further change needed). "Pricing by material × year" → already done and verified against the live database (9 plans at the exact requested prices). "Wipe data, keep [reused] admin" → Task 9 (already effectively satisfied; verification only). "Admin can write full user details" → Tasks 4–8. "Products + Shop Now proper way" → Task 2.
- **Known gap flagged, not built (out of explicit scope):** Services/Testimonials/FAQ/Buttons group types are addable in the builder's Business tab but — like Products before Task 2 — are not yet rendered on the live card either. The user's ask was specifically Products/Shop Now; this is called out here so it can be scoped as explicit follow-up work rather than silently left unmentioned.
- **Placeholder scan:** no "TBD"/"handle appropriately" left in any step; the one deliberately flagged uncertainty (Task 8, `PageHeader`'s `icon` prop) names the exact file to check and a concrete fallback rather than leaving it vague.
- **Type consistency:** `ServiceResult<T>` defined once (`card-field-service.ts`) and re-imported (not redefined) by `gallery-service.ts`; `apiBase`/`mode` prop names match between Task 7's `SectionBuilder` changes and Task 8's `AdminCardEditor` usage; admin route path suffixes (`/card-field`, `/card-field/upload`, `/gallery/:id`, `/gallery/layout`, `/gallery/upload`, `/gallery/youtube`) match exactly between Task 6's route files and Task 7's `apiBase`-prefixed fetch calls.
