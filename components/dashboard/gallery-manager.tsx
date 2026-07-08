"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";
import { GalleryDragList, type ManagedGalleryItem } from "@/components/dashboard/gallery-drag-list";
import { GalleryLayoutPicker } from "@/components/wizard/gallery-layout-picker";

function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  return new Promise<{ item: ManagedGalleryItem }>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/gallery/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // ignore parse failure, handled by status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as { item: ManagedGalleryItem });
      } else {
        reject(new Error(typeof data.error === "string" ? data.error : "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

export function GalleryManager({
  initialItems,
  initialGalleryLayout,
  usage,
}: {
  initialItems: ManagedGalleryItem[];
  initialGalleryLayout: string;
  usage: { count: number; max: number };
}) {
  const [items, setItems] = useState<ManagedGalleryItem[]>(initialItems);
  const [galleryLayout, setGalleryLayout] = useState(initialGalleryLayout);
  const [imageCount, setImageCount] = useState(usage.count);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubePreview, setYoutubePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const atLimit = imageCount >= usage.max;

  async function persistReorder(next: ManagedGalleryItem[]) {
    const previous = items;
    setItems(next);
    const res = await fetch("/api/gallery/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((item, i) => ({ id: item.id, order: i })) }),
    });
    if (!res.ok) {
      setItems(previous);
      toast.error("Could not save the new order");
    }
  }

  async function handleImageUpload(file: File) {
    if (atLimit) {
      toast.error("Image limit reached for your plan");
      return;
    }

    setUploadProgress(0);
    try {
      const data = await uploadWithProgress(file, setUploadProgress);
      setItems((prev) => [...prev, { ...data.item, order: prev.length }]);
      setImageCount((prev) => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleYoutubeBlur() {
    if (!youtubeUrl) {
      setYoutubePreview(null);
      return;
    }
    const parsed = saveYoutubeItemSchema.safeParse({ url: youtubeUrl });
    if (!parsed.success) {
      setYoutubePreview(null);
      return;
    }
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.data.url)}&format=json`
      );
      if (!res.ok) {
        setYoutubePreview(null);
        return;
      }
      const data = await res.json();
      setYoutubePreview(typeof data.thumbnail_url === "string" ? data.thumbnail_url : null);
    } catch {
      setYoutubePreview(null);
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
      setItems((prev) => [...prev, { ...data.item, order: prev.length }]);
      setYoutubeUrl("");
      setYoutubePreview(null);
    } finally {
      setIsAddingYoutube(false);
    }
  }

  async function handleRemove(id: string) {
    const previous = items;
    const removed = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (removed?.type === "IMAGE") {
      setImageCount((prev) => prev - 1);
    }

    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(previous);
      if (removed?.type === "IMAGE") {
        setImageCount((prev) => prev + 1);
      }
      toast.error("Could not remove that item");
    }
  }

  async function handleLayoutChange(next: string) {
    const previous = galleryLayout;
    setGalleryLayout(next);
    setIsSavingLayout(true);
    try {
      const res = await fetch("/api/gallery/layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryLayout: next }),
      });
      if (!res.ok) {
        setGalleryLayout(previous);
        toast.error("Could not save your layout");
      }
    } finally {
      setIsSavingLayout(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Add images and YouTube videos, reorder them, and pick how they display on your card.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="gallery-image">Upload image</Label>
          <span className={cn("text-sm", atLimit ? "text-destructive" : "text-muted-foreground")}>
            {imageCount} / {usage.max} images used
          </span>
        </div>
        <input
          id="gallery-image"
          type="file"
          accept="image/*"
          disabled={atLimit || uploadProgress !== null}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
        {uploadProgress !== null && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <Label htmlFor="youtube-url">YouTube URL</Label>
        <div className="flex gap-2">
          <Input
            id="youtube-url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={handleYoutubeBlur}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Button type="button" variant="outline" disabled={isAddingYoutube} onClick={handleAddYoutube}>
            Add
          </Button>
        </div>
        {youtubePreview && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={youtubePreview} alt="" className="h-12 w-20 rounded object-cover" />
            <span className="text-sm text-muted-foreground">Video found</span>
          </div>
        )}
      </div>

      <GalleryDragList items={items} onReorder={persistReorder} onRemove={handleRemove} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Layout</p>
          {isSavingLayout && <span className="text-xs text-muted-foreground">Saving…</span>}
        </div>
        <GalleryLayoutPicker value={galleryLayout} onChange={handleLayoutChange} />
      </div>
    </div>
  );
}
