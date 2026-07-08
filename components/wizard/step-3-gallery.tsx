"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGalleryLayoutSchema, saveYoutubeItemSchema } from "@/lib/validations/onboarding";
import { GalleryItemList, type WizardGalleryItem } from "@/components/wizard/gallery-item-list";
import { GalleryLayoutPicker } from "@/components/wizard/gallery-layout-picker";

export function Step3Gallery({
  initialItems,
  initialGalleryLayout,
  onSaved,
}: {
  initialItems: WizardGalleryItem[];
  initialGalleryLayout: string;
  onSaved: (items: WizardGalleryItem[], galleryLayout: string) => void;
}) {
  const [items, setItems] = useState<WizardGalleryItem[]>(initialItems);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function persistReorder(next: WizardGalleryItem[]) {
    setItems(next);
    await fetch("/api/gallery/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((item, i) => ({ id: item.id, order: i })) }),
    }).catch(() => {
      toast.error("Could not save the new order");
    });
  }

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/gallery/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setItems((prev) => [...prev, { id: data.item.id, type: "IMAGE", url: data.item.url, order: prev.length }]);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleAddYoutube() {
    const parsed = saveYoutubeItemSchema.safeParse({ url: youtubeUrl });
    if (!parsed.success) {
      toast.error("Enter a valid YouTube URL");
      return;
    }

    setIsAddingYoutube(true);
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.data.url)}&format=json`
      ).catch(() => null);
      if (!oembedRes?.ok) {
        toast.error("Couldn't find that YouTube video");
        return;
      }

      const res = await fetch("/api/gallery/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not add that video");
        return;
      }
      setItems((prev) => [...prev, { id: data.item.id, type: "YOUTUBE", url: data.item.url, order: prev.length }]);
      setYoutubeUrl("");
    } finally {
      setIsAddingYoutube(false);
    }
  }

  async function handleRemove(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove that item");
      setItems(previous);
    }
  }

  async function handleSave() {
    const parsed = saveGalleryLayoutSchema.safeParse({ galleryLayout });
    if (!parsed.success) {
      toast.error("Pick a gallery layout");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/gallery/layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save your gallery");
        return;
      }
      onSaved(items, galleryLayout);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Build your gallery</h2>
        <p className="text-sm text-muted-foreground">Add images and YouTube videos, then choose a layout.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gallery-image">Upload image</Label>
          <input
            id="gallery-image"
            type="file"
            accept="image/*"
            disabled={isUploadingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="youtube-url">YouTube URL</Label>
          <div className="flex gap-2">
            <Input
              id="youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <Button type="button" variant="outline" disabled={isAddingYoutube} onClick={handleAddYoutube}>
              Add
            </Button>
          </div>
        </div>
      </div>

      <GalleryItemList items={items} onReorder={persistReorder} onRemove={handleRemove} />

      <div>
        <p className="mb-2 text-sm font-medium">Layout</p>
        <GalleryLayoutPicker value={galleryLayout} onChange={setGalleryLayout} />
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
