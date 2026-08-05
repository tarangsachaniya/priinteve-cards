"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedAutosave } from "@/lib/use-debounced-autosave";
import type { CardSectionField } from "@/lib/card-sections";

const SUBFIELDS: { fieldType: string; label: string; kind: "text" | "textarea" }[] = [
  { fieldType: "company_name", label: "Company name", kind: "text" },
  { fieldType: "company_tagline", label: "Tagline", kind: "text" },
  { fieldType: "company_description", label: "About the company", kind: "textarea" },
];

export function CompanyEditor({
  items,
  onUpsertSubfield,
}: {
  items: CardSectionField[];
  onUpsertSubfield: (fieldType: string, label: string, value: string) => void;
}) {
  const initial: Record<string, string> = {};
  for (const sub of SUBFIELDS) {
    initial[sub.fieldType] = items.find((i) => i.fieldType === sub.fieldType)?.value ?? "";
  }
  const [values, setValues] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);

  function save(next: Record<string, string>) {
    for (const sub of SUBFIELDS) {
      onUpsertSubfield(sub.fieldType, sub.label, next[sub.fieldType] ?? "");
    }
  }

  useDebouncedAutosave(values, save);

  function handleManualSave() {
    save(values);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {SUBFIELDS.map((sub) => (
        <div key={sub.fieldType} className="flex flex-col gap-1.5">
          <Label>{sub.label}</Label>
          {sub.kind === "textarea" ? (
            <Textarea
              value={values[sub.fieldType]}
              onChange={(e) => setValues((prev) => ({ ...prev, [sub.fieldType]: e.target.value }))}
              rows={3}
            />
          ) : (
            <Input
              value={values[sub.fieldType]}
              onChange={(e) => setValues((prev) => ({ ...prev, [sub.fieldType]: e.target.value }))}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={handleManualSave}>
          Save
        </Button>
        {justSaved && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-ink" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
