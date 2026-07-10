"use client";

import { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Plus, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GROUP_TYPE_CONFIG } from "@/lib/section-item-config";
import type { GroupFieldType } from "@/lib/validations/card-field";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";
import type { CardSectionField } from "@/lib/card-sections";

function safeParseValue(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function ItemForm({
  item,
  type,
  onSave,
}: {
  item: CardSectionField;
  type: GroupFieldType;
  onSave: (next: { label: string; value: string }) => void;
}) {
  const config = GROUP_TYPE_CONFIG[type];
  const [title, setTitle] = useState(item.label);
  const [data, setData] = useState<Record<string, unknown>>(() => ({
    ...config.defaultValue,
    ...safeParseValue(item.value),
  }));

  useDebouncedAutosave({ title, data }, ({ title: t, data: d }) => {
    onSave({ label: t, value: JSON.stringify(d) });
  });

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1.5">
        <Label>{config.titleLabel}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={config.titlePlaceholder} />
      </div>
      {config.fields.map((field) => {
        const value = data[field.key];
        if (field.kind === "rating") {
          const rating = typeof value === "number" ? value : 5;
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.label}</Label>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, [field.key]: i + 1 }))}
                    aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
                  >
                    <Star
                      className="size-4 text-amber-500"
                      fill={i < rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        }
        if (field.kind === "textarea") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.label}</Label>
              <Textarea
                value={typeof value === "string" ? value : ""}
                placeholder={field.placeholder}
                onChange={(e) => setData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                rows={3}
              />
            </div>
          );
        }
        if (field.kind === "select") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.label}</Label>
              <Select
                value={typeof value === "string" ? value : field.options[0]?.value}
                onValueChange={(v) => setData((prev) => ({ ...prev, [field.key]: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label>{field.label}</Label>
            <Input
              type={field.kind === "number" ? "number" : "text"}
              value={value === undefined || value === null ? "" : String(value)}
              placeholder={field.placeholder}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  [field.key]: field.kind === "number" ? Number(e.target.value) || undefined : e.target.value,
                }))
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export function GroupEditor({
  blockId,
  type,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: {
  blockId: string;
  type: GroupFieldType;
  items: CardSectionField[];
  onAddItem: () => void;
  onUpdateItem: (id: string, next: { label: string; value: string }) => void;
  onDeleteItem: (id: string) => void;
}) {
  const config = GROUP_TYPE_CONFIG[type];

  return (
    <div className="flex flex-col gap-2 p-3 pt-0">
      {items.length === 0 && (
        <p className="px-3 py-4 text-center text-sm text-muted-foreground">{config.emptyLabel}</p>
      )}
      <Droppable droppableId={`items:${blockId}`} type={`items:${blockId}`}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className="flex items-start gap-1 rounded-lg border bg-background/60"
                  >
                    <span
                      {...dragProvided.dragHandleProps}
                      className="mt-4 cursor-grab pl-2 text-muted-foreground"
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <div className="flex-1">
                      <ItemForm item={item} type={type} onSave={(next) => onUpdateItem(item.id, next)} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mt-2 mr-1 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Button type="button" variant="outline" size="sm" onClick={onAddItem} className="self-start">
        <Plus /> {config.addLabel}
      </Button>
    </div>
  );
}
