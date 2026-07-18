"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { saveVcfSettingsSchema } from "@/lib/validations/onboarding";
import { VcfContactPreview } from "@/components/wizard/vcf-contact-preview";
import type { WizardField } from "@/components/wizard/field-instance-row";

export function Step4SaveContact({
  name,
  fields,
  initialVcfIncludePhoto,
  onSaved,
}: {
  name: string;
  fields: WizardField[];
  initialVcfIncludePhoto: boolean;
  onSaved: (vcfIncludePhoto: boolean) => void;
}) {
  const [vcfIncludePhoto, setVcfIncludePhoto] = useState(initialVcfIncludePhoto);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const parsed = saveVcfSettingsSchema.safeParse({ vcfIncludePhoto });
    if (!parsed.success) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/onboarding/vcf-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save this setting");
        return;
      }
      onSaved(vcfIncludePhoto);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Save to contact</h2>
        <p className="text-sm text-muted-foreground">
          Choose what&apos;s included when someone saves your card to their contacts.
        </p>
      </div>

      <Label className="flex w-fit items-center gap-2">
        <Checkbox
          checked={vcfIncludePhoto}
          onCheckedChange={(checked) => setVcfIncludePhoto(checked === true)}
        />
        Include profile photo in contact card
      </Label>

      <VcfContactPreview name={name} fields={fields} vcfIncludePhoto={vcfIncludePhoto} />

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
