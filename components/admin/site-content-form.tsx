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
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-3">
      {entries.map((entry, index) => (
        <div key={entry.key} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${section}-${entry.key}`}>{entry.key}</Label>
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
          >
            <XIcon />
          </Button>
        </div>
      ))}

      <div className="flex items-end gap-2 border-t border-border pt-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${section}-new-key`}>New key</Label>
          <Input
            id={`${section}-new-key`}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. heading"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          Add field
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
        {isSubmitting ? "Saving…" : "Save section"}
      </Button>
    </form>
  );
}
