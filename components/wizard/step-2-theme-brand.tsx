"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";

export function Step2ThemeBrand({
  themeId,
  onThemeIdChange,
  brandColor,
  onBrandColorChange,
  headingFont,
  onHeadingFontChange,
  bodyFont,
  onBodyFontChange,
  onSaved,
}: {
  themeId: string;
  onThemeIdChange: (value: string) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  bodyFont: string;
  onBodyFontChange: (value: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const parsed = saveThemeSchema.safeParse({ themeId, brandColor, headingFont, bodyFont });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your theme and color");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/onboarding/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not save your theme");
        return;
      }
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Choose Brand Theme</h2>
          <p className="text-sm text-muted-foreground">Pick a look for your card.</p>
        </div>
        <ThemeEditModal
          brandColor={brandColor}
          headingFont={headingFont}
          bodyFont={bodyFont}
          onSave={(next) => {
            onBrandColorChange(next.brandColor);
            onHeadingFontChange(next.headingFont);
            onBodyFontChange(next.bodyFont);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {THEME_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant={themeId === preset.id ? "default" : "outline"}
            onClick={() => onThemeIdChange(preset.id)}
          >
            {themeId === preset.id && <Check data-icon="inline-start" />} {preset.name}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {THEME_PRESETS.find((preset) => preset.id === themeId)?.description}
      </p>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
