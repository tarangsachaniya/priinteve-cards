"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFieldTypeMeta } from "@/lib/field-types";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";
import type { CardSectionField } from "@/lib/card-sections";

const PLATFORM_OPTIONS = [
  { fieldType: "social_instagram", label: "Instagram" },
  { fieldType: "social_linkedin", label: "LinkedIn" },
  { fieldType: "social_twitter", label: "Twitter / X" },
  { fieldType: "social_facebook", label: "Facebook" },
  { fieldType: "social_youtube", label: "YouTube" },
  { fieldType: "whatsapp", label: "WhatsApp" },
];

function SocialRow({
  item,
  onSave,
  onDelete,
}: {
  item: CardSectionField;
  onSave: (value: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(item.value);
  const meta = getFieldTypeMeta(item.fieldType);
  useDebouncedAutosave(value, onSave);

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label>{meta.label}</Label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={item.fieldType === "whatsapp" ? "+91…" : "https://…"}
        />
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Remove">
        <Trash2 />
      </Button>
    </div>
  );
}

export function SocialEditor({
  items,
  onAddPlatform,
  onUpdatePlatform,
  onRemovePlatform,
}: {
  items: CardSectionField[];
  onAddPlatform: (fieldType: string, label: string) => void;
  onUpdatePlatform: (id: string, value: string) => void;
  onRemovePlatform: (id: string) => void;
}) {
  const usedTypes = new Set(items.map((i) => i.fieldType));
  const available = PLATFORM_OPTIONS.filter((p) => !usedTypes.has(p.fieldType));

  return (
    <div className="flex flex-col gap-3 p-3 pt-0">
      {items.map((item) => (
        <SocialRow
          key={item.id}
          item={item}
          onSave={(value) => onUpdatePlatform(item.id, value)}
          onDelete={() => onRemovePlatform(item.id)}
        />
      ))}

      {available.length > 0 && (
        <Select onValueChange={(fieldType) => {
          const platform = PLATFORM_OPTIONS.find((p) => p.fieldType === fieldType);
          if (platform) onAddPlatform(platform.fieldType, platform.label);
        }}>
          <SelectTrigger className="w-48">
            <Plus className="size-3.5" />
            <SelectValue placeholder="Add platform" />
          </SelectTrigger>
          <SelectContent>
            {available.map((p) => (
              <SelectItem key={p.fieldType} value={p.fieldType}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
