"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type StructuredFieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type StructuredSiteContentFormProps = {
  section: string;
  fields: StructuredFieldConfig[];
  initialItems: Record<string, string>[];
  emptyItem: Record<string, string>;
  itemLabelField?: string;
  itemLabelFallback?: string;
};

export function StructuredSiteContentForm({
  section,
  fields,
  initialItems,
  emptyItem,
  itemLabelField,
  itemLabelFallback,
}: StructuredSiteContentFormProps) {
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(index: number, name: string, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [name]: value } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = Object.fromEntries(
        items.map((item, index) => [String(index + 1).padStart(2, "0"), JSON.stringify(item)])
      );
      const res = await fetch(`/api/admin/content/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Could not save content");
        return;
      }

      toast.success("Content saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {(itemLabelField && item[itemLabelField]) ||
                `${itemLabelFallback ?? "Item"} ${index + 1}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                aria-label="Move up"
              >
                <ChevronUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 1)}
                aria-label="Move down"
              >
                <ChevronDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                aria-label="Remove item"
              >
                <XIcon />
              </Button>
            </div>
          </div>

          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={`${section}-${index}-${field.name}`}>{field.label}</Label>
              {field.type === "textarea" ? (
                <textarea
                  id={`${section}-${index}-${field.name}`}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  value={item[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => updateField(index, field.name, e.target.value)}
                />
              ) : field.type === "select" ? (
                <Select
                  value={item[field.name] ?? ""}
                  onValueChange={(value) => value && updateField(index, field.name, value)}
                >
                  <SelectTrigger id={`${section}-${index}-${field.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${section}-${index}-${field.name}`}
                  type={field.type === "number" ? "number" : "text"}
                  value={item[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => updateField(index, field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
        Add item
      </Button>

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
        Save section
      </Button>
    </form>
  );
}
