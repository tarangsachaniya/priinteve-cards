"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Plus, Trash2, VideoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveGalleryLayoutSchema, saveYoutubeItemSchema } from "@/lib/validations/onboarding";
import type { WizardGalleryItem } from "@/components/wizard/gallery-item-list";
import { GalleryLayoutPicker } from "@/components/wizard/gallery-layout-picker";
import { getYoutubeThumbnail } from "@/lib/youtube";

const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;

function FilledCard({ thumbnail, label, onRemove }: { thumbnail: string; label: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt="" className="h-full w-full object-cover" />
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
        {label}
      </span>
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        className="absolute top-1.5 right-1.5"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function ImageSlot({
  onUpload,
  isUploading,
  onCancel,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
  onCancel: () => void;
}) {
  return (
    <label
      className={cn(
        "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-3 text-center transition-colors hover:border-primary/50",
        isUploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onUpload(file);
        }}
      />
      <ImageIcon className="size-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {isUploading ? "Uploading…" : "Add image to preview here"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1.5 right-1.5 text-muted-foreground"
        onClick={(e) => {
          e.preventDefault();
          onCancel();
        }}
      >
        <Trash2 />
      </Button>
    </label>
  );
}

function VideoSlot({
  onAdd,
  isAdding,
  onCancel,
}: {
  onAdd: (url: string) => void;
  isAdding: boolean;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <div className="relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-3 text-center">
      <VideoIcon className="size-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {isAdding ? "Adding…" : "Add video to preview here"}
      </span>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube URL"
        className="h-8 bg-card text-xs"
        disabled={isAdding}
      />
      <Button type="button" size="xs" disabled={isAdding} onClick={() => onAdd(url)}>
        {isAdding ? "Adding…" : "Add"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1.5 right-1.5 text-muted-foreground"
        onClick={onCancel}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

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
  const [showImageSlot, setShowImageSlot] = useState(false);
  const [showVideoSlot, setShowVideoSlot] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const images = items.filter((i) => i.type === "IMAGE");
  const videos = items.filter((i) => i.type === "YOUTUBE");
  const imageCount = images.length + (showImageSlot ? 1 : 0);
  const videoCount = videos.length + (showVideoSlot ? 1 : 0);

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
      setShowImageSlot(false);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleAddYoutube(url: string) {
    const parsed = saveYoutubeItemSchema.safeParse({ url });
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
      setItems((prev) => [...prev, { id: data.item.id, type: "YOUTUBE", url: data.item.url, order: prev.length }]);
      setShowVideoSlot(false);
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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Build your gallery</h2>
        <p className="text-sm text-muted-foreground">Add images and a video, then choose a layout.</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Images</p>
          <span className={cn("text-xs", imageCount >= MAX_IMAGES ? "text-destructive" : "text-muted-foreground")}>
            {images.length} / {MAX_IMAGES} used
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((item) => (
            <FilledCard key={item.id} thumbnail={item.url} label="Image" onRemove={() => handleRemove(item.id)} />
          ))}
          {showImageSlot && (
            <ImageSlot
              onUpload={handleImageUpload}
              isUploading={isUploadingImage}
              onCancel={() => setShowImageSlot(false)}
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={imageCount >= MAX_IMAGES}
          onClick={() => setShowImageSlot(true)}
        >
          <Plus /> Add Image
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Video</p>
          <span className={cn("text-xs", videoCount >= MAX_VIDEOS ? "text-destructive" : "text-muted-foreground")}>
            {videos.length} / {MAX_VIDEOS} used
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {videos.map((item) => (
            <FilledCard
              key={item.id}
              thumbnail={getYoutubeThumbnail(item.url) ?? item.url}
              label="Video"
              onRemove={() => handleRemove(item.id)}
            />
          ))}
          {showVideoSlot && (
            <VideoSlot onAdd={handleAddYoutube} isAdding={isAddingYoutube} onCancel={() => setShowVideoSlot(false)} />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={videoCount >= MAX_VIDEOS}
          onClick={() => setShowVideoSlot(true)}
        >
          <Plus /> Add Video
        </Button>
      </div>

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
