"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";
import {
  DEFAULT_BUSINESS_HOURS,
  businessHoursValueSchema,
  type BusinessHoursValue,
} from "@/lib/validations/card-field";
import type { CardSectionField } from "@/lib/card-sections";

const DAY_LABELS: { key: keyof BusinessHoursValue; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const TEXTAREA_TYPES = new Set(["bio", "company_description", "text"]);
const FILE_TYPES = new Set(["file", "photo"]);

function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  let raw: unknown = {};
  try {
    raw = JSON.parse(value || "{}");
  } catch {
    raw = {};
  }
  const parsed = businessHoursValueSchema.safeParse(raw);
  const hours = parsed.success ? parsed.data : DEFAULT_BUSINESS_HOURS;

  function update(day: keyof BusinessHoursValue, patch: Partial<BusinessHoursValue[typeof day]>) {
    const next = { ...hours, [day]: { ...hours[day], ...patch } };
    onChange(JSON.stringify(next));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {DAY_LABELS.map((day) => {
        const dayValue = hours[day.key];
        return (
          <div key={day.key} className="flex items-center gap-2">
            <label className="flex w-24 shrink-0 items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={!dayValue.closed}
                onChange={(e) => update(day.key, { closed: !e.target.checked })}
              />
              {day.label}
            </label>
            {dayValue.closed ? (
              <span className="text-xs text-muted-foreground">Closed</span>
            ) : (
              <>
                <Input
                  type="time"
                  value={dayValue.open}
                  onChange={(e) => update(day.key, { open: e.target.value })}
                  className="h-8 w-28"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={dayValue.close}
                  onChange={(e) => update(day.key, { close: e.target.value })}
                  className="h-8 w-28"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FieldEditor({
  field,
  onSave,
}: {
  field: CardSectionField;
  onSave: (next: { label: string; value: string }) => void;
}) {
  const [label, setLabel] = useState(field.label);
  const [value, setValue] = useState(field.value);
  const [isUploading, setIsUploading] = useState(false);

  useDebouncedAutosave({ label, value }, (next) => onSave(next));

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/card-field/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setValue(data.url);
      onSave({ label, value: data.url });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1.5">
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      {field.fieldType === "business_hours" ? (
        <div className="flex flex-col gap-1.5">
          <Label>Hours</Label>
          <BusinessHoursEditor value={value} onChange={setValue} />
        </div>
      ) : field.fieldType === "custom_html" ? (
        <div className="flex flex-col gap-1.5">
          <Label>HTML source</Label>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            placeholder="<div>Your custom HTML…</div>"
          />
          <p className="text-xs text-muted-foreground">
            Scripts, iframes, and inline event handlers are stripped automatically.
          </p>
        </div>
      ) : TEXTAREA_TYPES.has(field.fieldType) ? (
        <div className="flex flex-col gap-1.5">
          <Label>Value</Label>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={field.fieldType === "bio" ? 4 : 3} />
        </div>
      ) : FILE_TYPES.has(field.fieldType) ? (
        <div className="flex flex-col gap-1.5">
          <Label>{field.fieldType === "photo" ? "Photo" : "File"}</Label>
          {value && (
            <a href={value} target="_blank" rel="noreferrer" className="truncate text-xs text-foreground underline">
              {value}
            </a>
          )}
          <input
            type="file"
            accept={field.fieldType === "photo" ? "image/*" : "application/pdf,image/*"}
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label>Value</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      )}
    </div>
  );
}
