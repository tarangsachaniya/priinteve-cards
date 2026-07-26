"use client";

import { useRef } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type WizardField = {
  clientId: string;
  fieldType: string;
  label: string;
  value: string;
};

const TEXTAREA_FIELD_TYPES = new Set(["bio", "company_description"]);

export function FieldInstanceRow({
  field,
  onChange,
  onRemove,
  isMandatory,
  onUploadFile,
  isUploading,
}: {
  field: WizardField;
  onChange: (next: WizardField) => void;
  onRemove: () => void;
  isMandatory?: boolean;
  onUploadFile?: (file: File) => void;
  isUploading?: boolean;
}) {
  const isFile = field.fieldType === "file";
  const isPhoto = field.fieldType === "photo";
  const isTextarea = TEXTAREA_FIELD_TYPES.has(field.fieldType);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteButton = !isMandatory && (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRemove}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 />
    </Button>
  );

  if (isPhoto) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/10 p-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
          {field.value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={field.value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>{field.label || "Profile picture"}</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUploadFile?.(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload /> {isUploading ? "Uploading…" : field.value ? "Replace photo" : "Upload photo"}
          </Button>
        </div>
      </div>
    );
  }

  if (isTextarea) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 p-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`label-${field.clientId}`}>Label</Label>
            <Input
              id={`label-${field.clientId}`}
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              className="bg-card"
              disabled={isMandatory}
            />
          </div>
          {deleteButton}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{field.label || "Value"}</Label>
          <Textarea
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            placeholder="Write a short description…"
            rows={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-muted/10 p-2.5">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`label-${field.clientId}`}>Label</Label>
        <Input
          id={`label-${field.clientId}`}
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="bg-card"
          disabled={isMandatory}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`value-${field.clientId}`}>{isFile ? "File" : "Value"}</Label>
        {isFile ? (
          <div className="flex flex-col gap-1.5">
            {field.value && (
              <a
                href={field.value}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center truncate rounded-xl border border-input bg-card px-3 text-sm text-foreground underline-offset-4 hover:underline"
              >
                {field.value.split("/").pop()}
              </a>
            )}
            <input
              type="file"
              accept="application/pdf,image/*"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onUploadFile?.(file);
              }}
            />
          </div>
        ) : (
          <Input
            id={`value-${field.clientId}`}
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            className="bg-card"
          />
        )}
      </div>
      {deleteButton}
    </div>
  );
}
