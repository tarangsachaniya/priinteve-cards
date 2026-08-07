"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { menuItemCreateSchema } from "@/lib/validations/restaurant";

export type MenuItemRow = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

export type CategoryOption = { id: string; name: string };

function toFormState(item: MenuItemRow | undefined, defaultCategoryId: string) {
  return {
    categoryId: item?.categoryId ?? defaultCategoryId,
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item ? String(item.price) : "",
    isVeg: item?.isVeg ?? true,
    isAvailable: item?.isAvailable ?? true,
    imageUrl: item?.imageUrl ?? "",
    imagePublicId: item?.imagePublicId ?? "",
  };
}

export function MenuItemForm({
  item,
  categories,
  defaultCategoryId,
  onSaved,
  trigger,
}: {
  item?: MenuItemRow;
  categories: CategoryOption[];
  defaultCategoryId: string;
  onSaved: (item: MenuItemRow) => void;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => toFormState(item, defaultCategoryId));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(item);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/restaurant/menu-items/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setForm((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
      }));
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = menuItemCreateSchema.safeParse({ ...form, price: form.price });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the item details");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/restaurant/menu-items/${item!.id}` : "/api/restaurant/menu-items",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save item");
        return;
      }
      toast.success(isEdit ? "Item updated" : "Item added");
      onSaved(data.item);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setForm(toFormState(item, defaultCategoryId));
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add menu item"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this dish." : "Add a dish to your menu."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-1"
        >
          <div className="flex gap-3">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
              {form.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => update("imageUrl", "")}
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove image"
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImagePlus className="size-6" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
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
                {isUploading ? "Uploading…" : form.imageUrl ? "Replace photo" : "Add photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5MB</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Paneer Butter Masala"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-price">Price (₹)</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => update("categoryId", v ?? form.categoryId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Cottage cheese in a rich tomato and butter gravy"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
            <Label htmlFor="item-veg" className="cursor-pointer">
              Vegetarian
            </Label>
            <Switch
              id="item-veg"
              checked={form.isVeg}
              onCheckedChange={(checked) => update("isVeg", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
            <div>
              <Label htmlFor="item-available" className="cursor-pointer">
                Available
              </Label>
              <p className="text-xs text-muted-foreground">
                Unavailable items stay on the menu, greyed out.
              </p>
            </div>
            <Switch
              id="item-available"
              checked={form.isAvailable}
              onCheckedChange={(checked) => update("isAvailable", checked)}
            />
          </div>

          <Button type="submit" disabled={isSaving || isUploading} className="mt-1">
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
