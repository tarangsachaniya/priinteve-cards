"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, LayoutTemplate, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsertSectionMenu } from "@/components/dashboard/insert-section-menu";
import { SectionCard } from "@/components/dashboard/section-card";
import { FieldEditor } from "@/components/dashboard/section-editors/field-editor";
import { GroupEditor } from "@/components/dashboard/section-editors/group-editor";
import { CompanyEditor } from "@/components/dashboard/section-editors/company-editor";
import { SocialEditor } from "@/components/dashboard/section-editors/social-editor";
import { GalleryEditor, type ManagedGalleryItem } from "@/components/dashboard/section-editors/gallery-editor";
import { ThemeSettingsEditor } from "@/components/dashboard/theme-settings-editor";
import { CardPreviewPanel } from "@/components/card/card-preview-panel";
import { INSERTABLE_SECTION_TYPES, getFieldTypeMeta } from "@/lib/field-types";
import { GROUP_TYPE_CONFIG } from "@/lib/section-item-config";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import type { GroupFieldType } from "@/lib/validations/card-field";
import {
  buildSectionBlocks,
  flattenBlocksToOrder,
  type CardSectionField,
  type SectionBlock,
} from "@/lib/card-sections";

export type BuilderField = CardSectionField & { isVisible: boolean };

const GROUP_TITLES: Record<string, string> = {
  service: "Services",
  testimonial: "Testimonials",
  product: "Products",
  faq: "FAQ",
  button: "Buttons",
  social: "Social Links",
  company: "Company",
};

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "contact", label: "Contact" },
  { value: "business", label: "Business" },
  { value: "payments", label: "Payments" },
  { value: "gallery", label: "Gallery" },
  { value: "theme", label: "Theme" },
] as const;

type TabId = (typeof TABS)[number]["value"];

/**
 * Which tab owns each field type. Anything unmapped falls back to Profile so a
 * section is never filtered out of every tab and left unreachable in the UI.
 */
const TAB_BY_FIELD_TYPE: Record<string, TabId> = {
  phone: "contact",
  whatsapp: "contact",
  email: "contact",
  address: "contact",
  google_maps_url: "contact",
  website: "contact",
  service: "business",
  product: "business",
  testimonial: "business",
  faq: "business",
  button: "business",
  upi_id: "payments",
  upi_qr: "payments",
  gallery: "gallery",
};

function tabForFieldType(fieldType: string): TabId {
  if (fieldType.startsWith("social_")) return "contact";
  if (fieldType.startsWith("company_")) return "profile";
  return TAB_BY_FIELD_TYPE[fieldType] ?? "profile";
}

function tabForBlock(block: SectionBlock<BuilderField>): TabId {
  if (block.kind === "gallery") return "gallery";
  // Group blocks are homogeneous, so the first item decides the whole group.
  const fieldType = block.kind === "field" ? block.field.fieldType : block.items[0].fieldType;
  return tabForFieldType(fieldType);
}

export function SectionBuilder({
  userName,
  userSlug,
  initialCardPublished,
  initialFields,
  initialGalleryItems,
  initialGalleryLayout,
  initialGallerySectionOrder,
  galleryUsage,
  initialThemeId,
  initialBrandColor,
  initialHeadingFont,
  initialBodyFont,
  apiBase = "/api",
  mode = "user",
}: {
  userName: string;
  userSlug: string;
  initialCardPublished: boolean;
  initialFields: BuilderField[];
  initialGalleryItems: ManagedGalleryItem[];
  initialGalleryLayout: string;
  initialGallerySectionOrder: number;
  galleryUsage: { count: number; max: number };
  initialThemeId: string;
  initialBrandColor: string;
  initialHeadingFont: string;
  initialBodyFont: string;
  apiBase?: string;
  mode?: "user" | "admin";
}) {
  const router = useRouter();
  const [fields, setFields] = useState<BuilderField[]>(initialFields);
  const [galleryItems, setGalleryItems] = useState<ManagedGalleryItem[]>(initialGalleryItems);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [gallerySectionOrder, setGallerySectionOrder] = useState(initialGallerySectionOrder);
  const [imageCount, setImageCount] = useState(galleryUsage.count);
  const [isPublished, setIsPublished] = useState(initialCardPublished);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [themeId, setThemeId] = useState(initialThemeId);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [bodyFont, setBodyFont] = useState(initialBodyFont);

  const blocks = useMemo<SectionBlock<BuilderField>[]>(
    () => buildSectionBlocks<BuilderField>(fields, gallerySectionOrder),
    [fields, gallerySectionOrder]
  );
  const visibleBlocks = blocks.filter((block) => tabForBlock(block) === activeTab);

  // The insert menu only offers section types that belong to the tab you're on.
  const excludedInsertTypes = useMemo(
    () => INSERTABLE_SECTION_TYPES.filter((type) => tabForFieldType(type) !== activeTab),
    [activeTab]
  );

  const previewData = useMemo(
    () => ({
      name: userName,
      slug: userSlug,
      fields: fields.map((f) => ({
        fieldType: f.fieldType,
        label: f.label,
        value: f.value,
        order: f.order,
        isVisible: f.isVisible,
      })),
      galleryItems: galleryItems.map((item) => ({
        type: item.type,
        url: item.url,
        order: item.order,
        caption: item.caption,
        altText: item.altText,
      })),
      settings: { themeId, brandColor, headingFont, bodyFont, galleryLayout },
    }),
    [userName, userSlug, fields, galleryItems, themeId, brandColor, headingFont, bodyFont, galleryLayout]
  );

  function markSaving() {
    setSaveState("saving");
  }
  function markSaved(ok: boolean) {
    setSaveState(ok ? "saved" : "idle");
    if (ok) setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
  }

  async function addField(fieldType: string, label: string, value: string): Promise<BuilderField | null> {
    markSaving();
    const res = await fetch(`${apiBase}/card-field`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldType, label, value }),
    });
    const data = await res.json().catch(() => ({}));
    markSaved(res.ok);
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not add section");
      return null;
    }
    const created: BuilderField = { ...data.field };
    setFields((prev) => [...prev, created]);
    return created;
  }

  async function updateField(id: string, next: { label: string; value: string }) {
    const previous = fields;
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...next } : f)));
    markSaving();
    const res = await fetch(`${apiBase}/card-field/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    markSaved(res.ok);
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not save changes");
    }
  }

  async function deleteField(id: string) {
    const previous = fields;
    setFields((prev) => prev.filter((f) => f.id !== id));
    markSaving();
    const res = await fetch(`${apiBase}/card-field/${id}`, { method: "DELETE" });
    markSaved(res.ok);
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not delete section");
    }
  }

  async function deleteFields(ids: string[]) {
    const previous = fields;
    setFields((prev) => prev.filter((f) => !ids.includes(f.id)));
    markSaving();
    const results = await Promise.all(ids.map((id) => fetch(`${apiBase}/card-field/${id}`, { method: "DELETE" })));
    const ok = results.every((r) => r.ok);
    markSaved(ok);
    if (!ok) {
      setFields(previous);
      toast.error("Could not delete section");
    }
  }

  async function toggleFieldVisibility(id: string) {
    const previous = fields;
    const target = fields.find((f) => f.id === id);
    if (!target) return;
    const nextVisible = !target.isVisible;
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, isVisible: nextVisible } : f)));
    markSaving();
    const res = await fetch(`${apiBase}/card-field/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: nextVisible }),
    });
    markSaved(res.ok);
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not update visibility");
    }
  }

  async function toggleGroupVisibility(items: CardSectionField[]) {
    const anyVisible = items.some((item) => fields.find((f) => f.id === item.id)?.isVisible);
    const nextVisible = !anyVisible;
    const previous = fields;
    setFields((prev) => prev.map((f) => (items.some((i) => i.id === f.id) ? { ...f, isVisible: nextVisible } : f)));
    markSaving();
    const results = await Promise.all(
      items.map((item) =>
        fetch(`${apiBase}/card-field/${item.id}/visibility`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: nextVisible }),
        })
      )
    );
    const ok = results.every((r) => r.ok);
    markSaved(ok);
    if (!ok) {
      setFields(previous);
      toast.error("Could not update visibility");
    }
  }

  /**
   * Swaps a block with its neighbor within the active tab, then re-derives
   * order values for the whole card (fields share one integer order-space
   * with the gallery block) and persists it in one request.
   */
  async function moveBlockWithinTab(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= visibleBlocks.length) return;

    const reorderedTabBlocks = [...visibleBlocks];
    [reorderedTabBlocks[index], reorderedTabBlocks[targetIndex]] = [
      reorderedTabBlocks[targetIndex],
      reorderedTabBlocks[index],
    ];

    let cursor = 0;
    const newBlocks = blocks.map((block) => (tabForBlock(block) === activeTab ? reorderedTabBlocks[cursor++] : block));
    const { fieldOrder, gallerySectionOrder: newGalleryOrder } = flattenBlocksToOrder(newBlocks);

    const previousFields = fields;
    const previousGalleryOrder = gallerySectionOrder;
    const orderById = new Map(fieldOrder.map((entry) => [entry.id, entry.order]));
    setFields((prev) => prev.map((f) => (orderById.has(f.id) ? { ...f, order: orderById.get(f.id)! } : f)));
    setGallerySectionOrder(newGalleryOrder);

    markSaving();
    const res = await fetch(`${apiBase}/card-builder/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldOrder, gallerySectionOrder: newGalleryOrder }),
    });
    markSaved(res.ok);
    if (!res.ok) {
      setFields(previousFields);
      setGallerySectionOrder(previousGalleryOrder);
      toast.error("Could not reorder sections");
    }
  }

  function insertSection(fieldType: string) {
    const groupConfig = GROUP_TYPE_CONFIG[fieldType as GroupFieldType];
    if (groupConfig) {
      addField(fieldType, groupConfig.titlePlaceholder, JSON.stringify(groupConfig.defaultValue));
      return;
    }
    addField(fieldType, getFieldTypeMeta(fieldType).label, "");
  }

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/card-builder/publish", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not publish your card");
        return;
      }

      // The card is already live at this point. Refreshing the session only
      // updates the cached flags in the JWT, so a failure here must not be
      // treated as a failed publish.
      try {
        await fetch("/api/auth/refresh-session", { method: "POST" });
      } catch {
        // Ignored — router.refresh() below re-reads the truth from the server.
      }

      setIsPublished(true);
      toast.success("Your card is live!");
      router.refresh();
    } catch {
      toast.error("Could not publish your card");
    } finally {
      setIsPublishing(false);
    }
  }

  const themeEndpoint = mode === "admin" ? `${apiBase}/card-settings` : "/api/onboarding/theme";
  const themeMethod = mode === "admin" ? "PATCH" : "POST";

  async function saveTheme() {
    const parsed = saveThemeSchema.safeParse({ themeId, brandColor, headingFont, bodyFont });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your theme and color");
      return;
    }
    const res = await fetch(themeEndpoint, {
      method: themeMethod,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not save your theme");
      return;
    }
    toast.success("Theme saved");
  }

  function renderBlockEditor(block: SectionBlock<BuilderField>) {
    if (block.kind === "field") {
      return (
        <FieldEditor
          field={block.field}
          onSave={(next) => updateField(block.field.id, next)}
          uploadEndpoint={`${apiBase}/card-field/upload`}
        />
      );
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

    const groupType = block.type;
    if (groupType === "company") {
      return (
        <CompanyEditor
          items={block.items}
          onUpsertSubfield={(fieldType, label, value) => {
            const existing = block.items.find((i) => i.fieldType === fieldType);
            if (existing) updateField(existing.id, { label, value });
            else if (value) addField(fieldType, label, value);
          }}
        />
      );
    }
    if (groupType === "social") {
      return (
        <SocialEditor
          items={block.items}
          onAddPlatform={(fieldType, label) => addField(fieldType, label, "")}
          onUpdatePlatform={(id, value) => updateField(id, { label: fields.find((f) => f.id === id)?.label ?? "", value })}
          onRemovePlatform={(id) => deleteField(id)}
        />
      );
    }
    return (
      <GroupEditor
        type={groupType}
        items={block.items}
        onAddItem={() => {
          const config = GROUP_TYPE_CONFIG[groupType];
          addField(groupType, config.titlePlaceholder, JSON.stringify(config.defaultValue));
        }}
        onUpdateItem={(id, next) => updateField(id, next)}
        onDeleteItem={(id) => deleteField(id)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LayoutTemplate}
        title="Card builder"
        description="Build and edit your digital card — changes save automatically."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              {saveState === "saving" && (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <>
                  <CheckCircle2 className="size-3.5 text-ink" /> All changes saved
                </>
              )}
            </span>
            <Button type="button" variant="outline" size="sm" render={<a href={`/${userSlug}`} target="_blank" rel="noreferrer" />}>
              <ExternalLink /> Preview card
            </Button>
            {mode === "user" &&
              (isPublished ? (
                <Badge variant="secondary" className="h-8 px-3">
                  Published
                </Badge>
              ) : (
                <Button type="button" size="sm" disabled={isPublishing} onClick={handlePublish}>
                  {isPublishing ? <Loader2 className="animate-spin" /> : null} Publish
                </Button>
              ))}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <CardPreviewPanel data={previewData} />
        </div>

        <div className="flex flex-col gap-6">
        <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value as TabId)}>
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeTab === "theme" ? (
          <div className="w-full max-w-2xl rounded-xl border border-border">
            <ThemeSettingsEditor
              themeId={themeId}
              onThemeIdChange={setThemeId}
              brandColor={brandColor}
              onBrandColorChange={setBrandColor}
              headingFont={headingFont}
              onHeadingFontChange={setHeadingFont}
              bodyFont={bodyFont}
              onBodyFontChange={setBodyFont}
              onSave={saveTheme}
            />
          </div>
        ) : (
          <div className="flex w-full max-w-2xl flex-col gap-3">
            {visibleBlocks.map((block, index) => {
              const key = block.kind === "gallery" ? "gallery" : block.id;
              const moveProps =
                block.kind === "gallery"
                  ? {}
                  : {
                      onMoveUp: () => moveBlockWithinTab(index, -1),
                      onMoveDown: () => moveBlockWithinTab(index, 1),
                      canMoveUp: index > 0,
                      canMoveDown: index < visibleBlocks.length - 1,
                    };

              if (block.kind === "field") {
                const meta = getFieldTypeMeta(block.field.fieldType);
                return (
                  <SectionCard
                    key={key}
                    icon={meta.icon}
                    title={block.field.label || meta.label}
                    isVisible={block.field.isVisible}
                    onToggleVisibility={() => toggleFieldVisibility(block.field.id)}
                    onDuplicate={() => addField(block.field.fieldType, block.field.label, block.field.value)}
                    onDelete={() => deleteField(block.field.id)}
                    deleteConfirmText={`"${block.field.label}" will be permanently removed from your card.`}
                    {...moveProps}
                  >
                    {renderBlockEditor(block)}
                  </SectionCard>
                );
              }

              if (block.kind === "gallery") {
                return (
                  <SectionCard
                    key={key}
                    icon={getFieldTypeMeta("gallery").icon}
                    title="Gallery"
                    onDelete={() => {
                      const ids = galleryItems.map((i) => i.id);
                      setGalleryItems([]);
                      Promise.all(ids.map((id) => fetch(`${apiBase}/gallery/${id}`, { method: "DELETE" })));
                    }}
                    deleteConfirmText="All photos and videos in your gallery will be permanently removed."
                  >
                    {renderBlockEditor(block)}
                  </SectionCard>
                );
              }

              const meta = getFieldTypeMeta(block.type);
              return (
                <SectionCard
                  key={key}
                  icon={meta.icon}
                  title={GROUP_TITLES[block.type] ?? meta.label}
                  isVisible={block.items.some((i) => fields.find((f) => f.id === i.id)?.isVisible)}
                  onToggleVisibility={() => toggleGroupVisibility(block.items)}
                  onDelete={() => deleteFields(block.items.map((i) => i.id))}
                  deleteConfirmText={`This will remove the whole ${GROUP_TITLES[block.type] ?? meta.label} section and all its items.`}
                  {...moveProps}
                >
                  {renderBlockEditor(block)}
                </SectionCard>
              );
            })}

            {visibleBlocks.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing here yet. Add a section to get started.
              </p>
            )}

            {activeTab !== "gallery" && (
              <div className="pt-1">
                <InsertSectionMenu onInsert={insertSection} excludeTypes={excludedInsertTypes} />
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
