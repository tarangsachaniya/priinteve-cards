"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, LayoutTemplate, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InsertSectionMenu } from "@/components/dashboard/insert-section-menu";
import { SectionCard } from "@/components/dashboard/section-card";
import { FieldEditor } from "@/components/dashboard/section-editors/field-editor";
import { GroupEditor } from "@/components/dashboard/section-editors/group-editor";
import { CompanyEditor } from "@/components/dashboard/section-editors/company-editor";
import { SocialEditor } from "@/components/dashboard/section-editors/social-editor";
import { GalleryEditor, type ManagedGalleryItem } from "@/components/dashboard/section-editors/gallery-editor";
import { getFieldTypeMeta } from "@/lib/field-types";
import { GROUP_TYPE_CONFIG } from "@/lib/section-item-config";
import { DEFAULT_BUSINESS_HOURS, isGroupFieldType } from "@/lib/validations/card-field";
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

function defaultValueForType(fieldType: string): string {
  if (fieldType === "business_hours") return JSON.stringify(DEFAULT_BUSINESS_HOURS);
  if (isGroupFieldType(fieldType)) return JSON.stringify(GROUP_TYPE_CONFIG[fieldType].defaultValue);
  return "";
}

export function SectionBuilder({
  userSlug,
  initialCardPublished,
  initialFields,
  initialGalleryItems,
  initialGalleryLayout,
  initialGallerySectionOrder,
  galleryUsage,
}: {
  userSlug: string;
  initialCardPublished: boolean;
  initialFields: BuilderField[];
  initialGalleryItems: ManagedGalleryItem[];
  initialGalleryLayout: string;
  initialGallerySectionOrder: number;
  galleryUsage: { count: number; max: number };
}) {
  const [fields, setFields] = useState<BuilderField[]>(initialFields);
  const [galleryItems, setGalleryItems] = useState<ManagedGalleryItem[]>(initialGalleryItems);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [gallerySectionOrder, setGallerySectionOrder] = useState(initialGallerySectionOrder);
  const [imageCount, setImageCount] = useState(galleryUsage.count);
  const [isPublished, setIsPublished] = useState(initialCardPublished);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const blocks = useMemo<SectionBlock<BuilderField>[]>(
    () => buildSectionBlocks<BuilderField>(fields, gallerySectionOrder),
    [fields, gallerySectionOrder]
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
    const res = await fetch("/api/card-field", {
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
    const res = await fetch(`/api/card-field/${id}`, {
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
    const res = await fetch(`/api/card-field/${id}`, { method: "DELETE" });
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
    const results = await Promise.all(ids.map((id) => fetch(`/api/card-field/${id}`, { method: "DELETE" })));
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
    const res = await fetch(`/api/card-field/${id}/visibility`, {
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
        fetch(`/api/card-field/${item.id}/visibility`, {
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

  function handleAddSection(fieldType: string) {
    const meta = getFieldTypeMeta(fieldType);
    addField(fieldType, meta.label, defaultValueForType(fieldType));
  }

  async function persistOrder(nextBlocks: SectionBlock<BuilderField>[]) {
    const { fieldOrder, gallerySectionOrder: nextGalleryOrder } = flattenBlocksToOrder(nextBlocks);
    const orderById = new Map(fieldOrder.map((entry) => [entry.id, entry.order]));
    const previousFields = fields;
    const previousGalleryOrder = gallerySectionOrder;

    setFields((prev) => prev.map((f) => (orderById.has(f.id) ? { ...f, order: orderById.get(f.id)! } : f)));
    setGallerySectionOrder(nextGalleryOrder);

    markSaving();
    const res = await fetch("/api/card-builder/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldOrder, gallerySectionOrder: nextGalleryOrder }),
    });
    markSaved(res.ok);
    if (!res.ok) {
      setFields(previousFields);
      setGallerySectionOrder(previousGalleryOrder);
      toast.error("Could not save the new order");
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination } = result;

    if (result.type === "section") {
      if (source.index === destination.index) return;
      const next = Array.from(blocks);
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      persistOrder(next);
      return;
    }

    const blockId = result.type.slice("items:".length);
    const blockIndex = blocks.findIndex((b) => (b.kind === "group" && b.id === blockId) || (b.kind === "gallery" && blockId === "gallery"));
    if (blockIndex === -1) return;
    const block = blocks[blockIndex];

    if (block.kind === "group") {
      if (source.index === destination.index) return;
      const items = Array.from(block.items);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      const nextBlocks = blocks.map((b, i) => (i === blockIndex ? { ...b, items } : b));
      persistOrder(nextBlocks);
    } else if (block.kind === "gallery") {
      const previous = galleryItems;
      const next = Array.from(galleryItems);
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      const reordered = next.map((item, i) => ({ ...item, order: i }));
      setGalleryItems(reordered);
      markSaving();
      fetch("/api/gallery/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((item) => ({ id: item.id, order: item.order })) }),
      }).then((res) => {
        markSaved(res.ok);
        if (!res.ok) {
          setGalleryItems(previous);
          toast.error("Could not save the new order");
        }
      });
    }
  }

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/card-builder/publish", { method: "POST" });
      if (!res.ok) {
        toast.error("Could not publish your card");
        return;
      }
      setIsPublished(true);
      toast.success("Your card is live!");
    } finally {
      setIsPublishing(false);
    }
  }

  function renderBlockEditor(block: SectionBlock<BuilderField>) {
    if (block.kind === "field") {
      return <FieldEditor field={block.field} onSave={(next) => updateField(block.field.id, next)} />;
    }
    if (block.kind === "gallery") {
      return (
        <GalleryEditor
          blockId="gallery"
          items={galleryItems}
          galleryLayout={galleryLayout}
          usage={{ count: imageCount, max: galleryUsage.max }}
          onAddImage={(item) => {
            setGalleryItems((prev) => [...prev, item]);
            setImageCount((prev) => prev + 1);
          }}
          onAddYoutube={(item) => setGalleryItems((prev) => [...prev, item])}
          onUpdateItem={async (id, next) => {
            const previous = galleryItems;
            setGalleryItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
            const res = await fetch(`/api/gallery/${id}`, {
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
            const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
            if (!res.ok) {
              setGalleryItems(previous);
              if (removed?.type === "IMAGE") setImageCount((prev) => prev + 1);
              toast.error("Could not remove item");
            }
          }}
          onLayoutChange={async (layout) => {
            const previous = galleryLayout;
            setGalleryLayout(layout);
            const res = await fetch("/api/gallery/layout", {
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
        blockId={block.id}
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
            {isPublished ? (
              <Badge variant="secondary" className="h-8 px-3">
                Published
              </Badge>
            ) : (
              <Button type="button" size="sm" disabled={isPublishing} onClick={handlePublish}>
                {isPublishing ? <Loader2 className="animate-spin" /> : null} Publish
              </Button>
            )}
            <InsertSectionMenu onInsert={handleAddSection} />
          </div>
        }
      />

      <div className="mx-auto w-full max-w-2xl">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections" type="section">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
                {blocks.map((block, index) => {
                  const key = block.kind === "gallery" ? "gallery" : block.id;
                  const draggableId = block.kind === "gallery" ? "gallery" : block.id;

                  if (block.kind === "field") {
                    const meta = getFieldTypeMeta(block.field.fieldType);
                    return (
                      <Draggable key={key} draggableId={draggableId} index={index}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                            <SectionCard
                              icon={meta.icon}
                              title={block.field.label || meta.label}
                              dragHandleProps={dragProvided.dragHandleProps}
                              isVisible={block.field.isVisible}
                              onToggleVisibility={() => toggleFieldVisibility(block.field.id)}
                              onDuplicate={() => addField(block.field.fieldType, block.field.label, block.field.value)}
                              onDelete={() => deleteField(block.field.id)}
                              deleteConfirmText={`"${block.field.label}" will be permanently removed from your card.`}
                            >
                              {renderBlockEditor(block)}
                            </SectionCard>
                          </div>
                        )}
                      </Draggable>
                    );
                  }

                  if (block.kind === "gallery") {
                    return (
                      <Draggable key={key} draggableId={draggableId} index={index}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                            <SectionCard
                              icon={getFieldTypeMeta("gallery").icon}
                              title="Gallery"
                              dragHandleProps={dragProvided.dragHandleProps}
                              onDelete={() => {
                                const ids = galleryItems.map((i) => i.id);
                                setGalleryItems([]);
                                Promise.all(ids.map((id) => fetch(`/api/gallery/${id}`, { method: "DELETE" })));
                              }}
                              deleteConfirmText="All photos and videos in your gallery will be permanently removed."
                            >
                              {renderBlockEditor(block)}
                            </SectionCard>
                          </div>
                        )}
                      </Draggable>
                    );
                  }

                  const meta = getFieldTypeMeta(block.type);
                  return (
                    <Draggable key={key} draggableId={draggableId} index={index}>
                      {(dragProvided) => (
                        <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                          <SectionCard
                            icon={meta.icon}
                            title={GROUP_TITLES[block.type] ?? meta.label}
                            dragHandleProps={dragProvided.dragHandleProps}
                            isVisible={block.items.some((i) => fields.find((f) => f.id === i.id)?.isVisible)}
                            onToggleVisibility={() => toggleGroupVisibility(block.items)}
                            onDelete={() => deleteFields(block.items.map((i) => i.id))}
                            deleteConfirmText={`This will remove the whole ${GROUP_TITLES[block.type] ?? meta.label} section and all its items.`}
                          >
                            {renderBlockEditor(block)}
                          </SectionCard>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
