"use client";

import { useRef, useState } from "react";
import {
  AlignLeft,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Share2,
  Type as TypeIcon,
} from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOCIAL_PLATFORMS, getFieldTypeMeta } from "@/lib/field-types";
import type { ManagedField } from "@/components/dashboard/field-row";

const BASIC_FIELD_TYPES = [
  { fieldType: "bio", label: "About Me", icon: AlignLeft },
  { fieldType: "text", label: "Text", icon: TypeIcon },
  { fieldType: "phone", label: "Phone", icon: Phone },
  { fieldType: "email", label: "Email", icon: Mail },
  { fieldType: "website", label: "Website", icon: Globe },
  { fieldType: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { fieldType: "address", label: "Address", icon: MapPin },
];

export function AddFieldModal({ onAdded }: { onAdded: (field: ManagedField) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<{ fieldType: string; label: string; value: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickType(fieldType: string, label: string) {
    setDraft({ fieldType, label, value: "" });
    setDialogOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/card-field/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setDraft({
        fieldType: "file",
        label: file.name.replace(/\.[^.]+$/, "") || "Attachment",
        value: data.url,
      });
      setDialogOpen(true);
    } finally {
      setIsUploadingFile(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/card-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not add field");
        return;
      }
      onAdded(data.field);
      setDialogOpen(false);
      setDraft(null);
    } finally {
      setIsSaving(false);
    }
  }

  const isFile = draft?.fieldType === "file";
  const isBio = draft?.fieldType === "bio";
  const isValid = Boolean(draft?.label) && (isFile || Boolean(draft?.value));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({})}>
          <Plus />
          Add Field
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {BASIC_FIELD_TYPES.map((type) => (
            <DropdownMenuItem key={type.fieldType} onClick={() => pickType(type.fieldType, type.label)}>
              <type.icon /> {type.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Share2 /> Social Media
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = getFieldTypeMeta(platform.fieldType).icon;
                return (
                  <DropdownMenuItem
                    key={platform.fieldType}
                    onClick={() => pickType(platform.fieldType, platform.label)}
                  >
                    <Icon /> {platform.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isUploadingFile}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText /> {isUploadingFile ? "Uploading…" : "File/PDF"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a field</DialogTitle>
            <DialogDescription>
              {draft ? getFieldTypeMeta(draft.fieldType).label : "Fill in the details for this field."}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-field-label">Label</Label>
                <Input
                  id="new-field-label"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </div>
              {!isFile && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-field-value">{isBio ? "About you" : "Value"}</Label>
                  {isBio ? (
                    <RichTextEditor
                      value={draft.value}
                      onChange={(html) => setDraft({ ...draft, value: html })}
                      placeholder="Write a short bio…"
                    />
                  ) : (
                    <Input
                      id="new-field-value"
                      value={draft.value}
                      onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter showCloseButton>
            {draft && (
              <Button type="button" onClick={handleSave} disabled={isSaving || !isValid}>
                {isSaving ? "Adding…" : "Add"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
