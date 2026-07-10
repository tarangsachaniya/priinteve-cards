"use client";

import { useState } from "react";

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

  useDebouncedAutosave(values, (next) => {
    for (const sub of SUBFIELDS) {
      onUpsertSubfield(sub.fieldType, sub.label, next[sub.fieldType] ?? "");
    }
  });

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
    </div>
  );
}
