"use client";

import { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { saveYoutubeItemSchema } from "@/lib/validations/onboarding";
import { GalleryLayoutPicker } from "@/components/wizard/gallery-layout-picker";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";

export type ManagedGalleryItem = {
  id: string;
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
  caption?: string | null;
  altText?: string | null;
};

/** Center-crops an image file to a 1:1 square before upload (client-side only — no original is kept). */
function cropToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not crop image"));
        return;
      }
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error("Could not crop image"));
          return;
        }
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };
    img.src = objectUrl;
  });
}

function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  return new Promise<{ item: ManagedGalleryItem }>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/gallery/upload");
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

function GalleryItemRow({
  item,
  onUpdate,
  onRemove,
  index,
}: {
  item: ManagedGalleryItem;
  onUpdate: (id: string, next: { caption?: string; altText?: string }) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [altText, setAltText] = useState(item.altText ?? "");

  useDebouncedAutosave({ caption, altText }, (next) => onUpdate(item.id, next));

  return (
    <Draggable draggableId={item.id} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          className="flex items-center gap-2 rounded-xl border border-border p-2"
        >
          <span {...dragProvided.dragHandleProps} className="cursor-grab text-muted-foreground">
            <GripVertical className="size-4" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.type === "YOUTUBE" ? item.url : item.url}
            alt=""
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="h-8"
            />
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text (accessibility)"
              className="h-8"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(item.id)}
            aria-label="Remove"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </Draggable>
  );
}

export function GalleryEditor({
  blockId,
  items,
  galleryLayout,
  usage,
  onAddImage,
  onAddYoutube,
  onUpdateItem,
  onRemoveItem,
  onLayoutChange,
}: {
  blockId: string;
  items: ManagedGalleryItem[];
  galleryLayout: string;
  usage: { count: number; max: number };
  onAddImage: (item: ManagedGalleryItem) => void;
  onAddYoutube: (item: ManagedGalleryItem) => void;
  onUpdateItem: (id: string, next: { caption?: string; altText?: string }) => void;
  onRemoveItem: (id: string) => void;
  onLayoutChange: (layout: string) => void;
}) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [cropSquare, setCropSquare] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubePreview, setYoutubePreview] = useState<string | null>(null);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);

  const atLimit = usage.count >= usage.max;

  async function handleImageUpload(file: File) {
    if (atLimit) {
      toast.error("Image limit reached for your plan");
      return;
    }
    setUploadProgress(0);
    try {
      const toUpload = cropSquare ? await cropToSquare(file) : file;
      const data = await uploadWithProgress(toUpload, setUploadProgress);
      onAddImage(data.item);
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
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.data.url)}&format=json`);
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
      onAddYoutube(data.item);
      setYoutubeUrl("");
      setYoutubePreview(null);
    } finally {
      setIsAddingYoutube(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-3 pt-0">
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between">
          <Label>Upload image</Label>
          <span className={cn("text-xs", atLimit ? "text-destructive" : "text-muted-foreground")}>
            {usage.count} / {usage.max} used
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          disabled={atLimit || uploadProgress !== null}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={cropSquare} onCheckedChange={(v) => setCropSquare(v === true)} />
          Crop to square before uploading
        </label>
        {uploadProgress !== null && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
        <Label>YouTube URL</Label>
        <div className="flex gap-2">
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={handleYoutubeBlur}
            placeholder="https://youtube.com/watch?v=…"
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

      {items.length > 0 && (
        <Droppable droppableId={`items:${blockId}`} type={`items:${blockId}`}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
              {items.map((item, index) => (
                <GalleryItemRow key={item.id} item={item} index={index} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Layout</p>
        <GalleryLayoutPicker value={galleryLayout} onChange={onLayoutChange} />
      </div>
    </div>
  );
}
