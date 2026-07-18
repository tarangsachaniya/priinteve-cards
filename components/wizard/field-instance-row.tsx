"use client";

import { Trash2 } from "lucide-react";

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

export function FieldInstanceRow({
  field,
  onChange,
  onRemove,
}: {
  field: WizardField;
  onChange: (next: WizardField) => void;
  onRemove: () => void;
}) {
  const isFile = field.fieldType === "file";
  const isBio = field.fieldType === "bio";

  if (isBio) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border p-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`label-${field.clientId}`}>Label</Label>
            <Input
              id={`label-${field.clientId}`}
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
            />
          </div>
          <Button type="button" variant="destructive" size="icon" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>About you</Label>
          <Textarea
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            placeholder="Write a short bio…"
            rows={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border p-2.5">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`label-${field.clientId}`}>Label</Label>
        <Input
          id={`label-${field.clientId}`}
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`value-${field.clientId}`}>{isFile ? "File" : "Value"}</Label>
        {isFile ? (
          <a
            href={field.value}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 items-center truncate rounded-lg border border-input px-2.5 text-sm text-foreground underline-offset-4 hover:underline"
          >
            {field.value.split("/").pop()}
          </a>
        ) : (
          <Input
            id={`value-${field.clientId}`}
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
          />
        )}
      </div>
      <Button type="button" variant="destructive" size="icon" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}
