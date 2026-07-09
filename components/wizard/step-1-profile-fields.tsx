"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfileFieldsSchema } from "@/lib/validations/onboarding";
import { FieldTypePicker } from "@/components/wizard/field-type-picker";
import { FieldInstanceRow, type WizardField } from "@/components/wizard/field-instance-row";

const SOCIAL_LABELS: Record<string, string> = {
  social_instagram: "Instagram",
  social_linkedin: "LinkedIn",
  social_twitter: "Twitter",
  social_facebook: "Facebook",
  social_youtube: "YouTube",
};

export function Step1ProfileFields({
  initialFields,
  initialCompany,
  onSaved,
}: {
  initialFields: WizardField[];
  initialCompany: string | null;
  onSaved: (fields: WizardField[], slug: string, company: string) => void;
}) {
  const [fields, setFields] = useState<WizardField[]>(initialFields);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function addField(fieldType: string, label: string) {
    setFields((prev) => [
      ...prev,
      { clientId: crypto.randomUUID(), fieldType, label: SOCIAL_LABELS[fieldType] ?? label, value: "" },
    ]);
  }

  function updateField(clientId: string, next: WizardField) {
    setFields((prev) => prev.map((f) => (f.clientId === clientId ? next : f)));
  }

  function removeField(clientId: string) {
    setFields((prev) => prev.filter((f) => f.clientId !== clientId));
  }

  async function handleAddFile(file: File) {
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/card-field/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setFields((prev) => [
        ...prev,
        {
          clientId: crypto.randomUUID(),
          fieldType: "file",
          label: file.name.replace(/\.[^.]+$/, "") || "Attachment",
          value: data.url,
        },
      ]);
    } finally {
      setIsUploadingFile(false);
    }
  }

  async function handleSave() {
    const payload = {
      fields: fields.map(({ fieldType, label, value }) => ({ fieldType, label, value })),
      company,
    };
    const parsed = saveProfileFieldsSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your fields and try again");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/onboarding/profile-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save your fields");
        return;
      }
      const savedFields: WizardField[] = data.fields.map((f: { id: string; fieldType: string; label: string; value: string }) => ({
        clientId: f.id,
        fieldType: f.fieldType,
        label: f.label,
        value: f.value,
      }));
      onSaved(savedFields, data.slug, data.company ?? "");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Add your profile fields</h2>
        <p className="text-sm text-muted-foreground">
          Click a field type to add it to your card.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wizard-company">Company (optional)</Label>
        <Input
          id="wizard-company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your company name"
        />
      </div>

      <FieldTypePicker onAdd={addField} onAddFile={handleAddFile} isUploadingFile={isUploadingFile} />

      {fields.length > 0 && (
        <div className="flex flex-col gap-2">
          {fields.map((field) => (
            <FieldInstanceRow
              key={field.clientId}
              field={field}
              onChange={(next) => updateField(field.clientId, next)}
              onRemove={() => removeField(field.clientId)}
            />
          ))}
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
