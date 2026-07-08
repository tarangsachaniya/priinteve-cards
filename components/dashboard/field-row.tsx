"use client";

import { useState } from "react";
import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";

import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFieldTypeMeta } from "@/lib/field-types";
import { stripHtmlToText } from "@/lib/sanitize-html";

export type ManagedField = {
  id: string;
  fieldType: string;
  label: string;
  value: string;
  order: number;
  isVisible: boolean;
};

export function FieldRow({
  field,
  dragHandleProps,
  onToggleVisibility,
  onUpdate,
  onDelete,
}: {
  field: ManagedField;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  onToggleVisibility: () => void;
  onUpdate: (next: { label: string; value: string }) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(field.label);
  const [draftValue, setDraftValue] = useState(field.value);

  const Icon = getFieldTypeMeta(field.fieldType).icon;
  const isBio = field.fieldType === "bio";

  function startEditing() {
    setDraftLabel(field.label);
    setDraftValue(field.value);
    setIsEditing(true);
  }

  function save() {
    setIsEditing(false);
    if (draftLabel !== field.label || draftValue !== field.value) {
      onUpdate({ label: draftLabel, value: draftValue });
    }
  }

  if (isEditing && isBio) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`label-${field.id}`}>Label</Label>
          <Input
            id={`label-${field.id}`}
            value={draftLabel}
            autoFocus
            onChange={(e) => setDraftLabel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>About you</Label>
          <RichTextEditor value={draftValue} onChange={setDraftValue} placeholder="Write a short bio…" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-end gap-2 rounded-lg border border-border p-2.5">
        <span className="pb-2 text-muted-foreground">
          <GripVertical className="size-4" />
        </span>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`label-${field.id}`}>Label</Label>
          <Input
            id={`label-${field.id}`}
            value={draftLabel}
            autoFocus
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            onBlur={save}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`value-${field.id}`}>Value</Label>
          <Input
            id={`value-${field.id}`}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            onBlur={save}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-border p-2.5 ${
        field.isVisible ? "" : "opacity-50"
      }`}
    >
      <span {...dragHandleProps} className="cursor-grab text-muted-foreground">
        <GripVertical className="size-4" />
      </span>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{field.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {isBio ? stripHtmlToText(field.value) : field.value}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onToggleVisibility}
        aria-label={field.isVisible ? "Hide field" : "Show field"}
      >
        {field.isVisible ? <Eye /> : <EyeOff />}
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={startEditing} aria-label="Edit field">
        <Pencil />
      </Button>
      <Dialog>
        <DialogTrigger render={<Button type="button" variant="destructive" size="icon-sm" aria-label="Delete field" />}>
          <Trash2 />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this field?</DialogTitle>
            <DialogDescription>
              &ldquo;{field.label}&rdquo; will be permanently removed from your card. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <DialogClose render={<Button type="button" variant="destructive" onClick={onDelete} />}>
              Delete
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
