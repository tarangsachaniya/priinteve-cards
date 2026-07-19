"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SiteContentFormProps = {
  section: string;
  initialEntries: { key: string; value: string }[];
};

export function SiteContentForm({ section, initialEntries }: SiteContentFormProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [newKey, setNewKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue(index: number, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, value } : e)));
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addEntry() {
    const key = newKey.trim();
    if (!key || entries.some((e) => e.key === key)) return;
    setEntries((prev) => [...prev, { key, value: "" }]);
    setNewKey("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
      const res = await fetch(`/api/admin/content/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error("Could not save content");
        return;
      }

      toast.success("Content saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <div key={entry.key} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`${section}-${entry.key}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {entry.key}
              </Label>
              <Input
                id={`${section}-${entry.key}`}
                value={entry.value}
                onChange={(e) => updateValue(index, e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeEntry(index)}
              aria-label="Remove entry"
              className="text-muted-foreground hover:text-destructive"
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${section}-new-key`}>Add a new field</Label>
          <Input
            id={`${section}-new-key`}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. heading"
            className="bg-card"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          Add field
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 w-fit">
        {isSubmitting ? "Saving…" : "Save section"}
      </Button>
    </form>
  );
}
