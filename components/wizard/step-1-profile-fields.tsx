"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfileFieldsSchema } from "@/lib/validations/onboarding";
import { InsertSectionMenu } from "@/components/dashboard/insert-section-menu";
import { FieldInstanceRow, type WizardField } from "@/components/wizard/field-instance-row";
import { MANDATORY_FIELD_TYPES, getFieldTypeMeta } from "@/lib/field-types";

function buildInitialFields(saved: WizardField[]): WizardField[] {
  const byType = new Map(saved.map((f) => [f.fieldType, f]));
  const mandatory = MANDATORY_FIELD_TYPES.map(
    (fieldType) =>
      byType.get(fieldType) ?? {
        clientId: `mandatory-${fieldType}`,
        fieldType,
        label: getFieldTypeMeta(fieldType).label,
        value: "",
      }
  );
  const optional = saved.filter((f) => !(MANDATORY_FIELD_TYPES as readonly string[]).includes(f.fieldType));
  return [...mandatory, ...optional];
}

export function Step1ProfileFields({
  initialFields,
  initialCompany,
  onSaved,
}: {
  initialFields: WizardField[];
  initialCompany: string | null;
  onSaved: (fields: WizardField[], slug: string, company: string) => void;
}) {
  const [fields, setFields] = useState<WizardField[]>(() => buildInitialFields(initialFields));
  const [company, setCompany] = useState(initialCompany ?? "");
  const [uploadingClientId, setUploadingClientId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function addField(fieldType: string) {
    const meta = getFieldTypeMeta(fieldType);
    setFields((prev) => [...prev, { clientId: crypto.randomUUID(), fieldType, label: meta.label, value: "" }]);
  }

  function updateField(clientId: string, next: WizardField) {
    setFields((prev) => prev.map((f) => (f.clientId === clientId ? next : f)));
  }

  function removeField(clientId: string) {
    setFields((prev) =>
      prev.filter((f) => f.clientId !== clientId || (MANDATORY_FIELD_TYPES as readonly string[]).includes(f.fieldType))
    );
  }

  async function handleUploadPhoto(clientId: string, file: File) {
    setUploadingClientId(clientId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/card-field/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setFields((prev) => prev.map((f) => (f.clientId === clientId ? { ...f, value: data.url } : f)));
    } finally {
      setUploadingClientId(null);
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Add your profile fields</h2>
          <p className="text-sm text-muted-foreground">
            These essentials are ready to fill in — add more from the dropdown if you'd like.
          </p>
        </div>
        <InsertSectionMenu onInsert={addField} excludeTypes={MANDATORY_FIELD_TYPES} />
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

      <div className="flex flex-col gap-2">
        {fields.map((field) => {
          const isMandatory = (MANDATORY_FIELD_TYPES as readonly string[]).includes(field.fieldType);
          return (
            <FieldInstanceRow
              key={field.clientId}
              field={field}
              isMandatory={isMandatory}
              onChange={(next) => updateField(field.clientId, next)}
              onRemove={() => removeField(field.clientId)}
              onUploadFile={(file) => handleUploadPhoto(field.clientId, file)}
              isUploading={uploadingClientId === field.clientId}
            />
          );
        })}
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
