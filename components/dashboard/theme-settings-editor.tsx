"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";

/**
 * Theme/brand editor shown as its own tab in the card builder (and, in admin
 * mode, on the admin card editor) — the setup wizard's theme step only runs
 * once, pre-purchase, so this is the only place a user can change it
 * afterward. Fully controlled so the persistent preview panel next to it
 * updates live as choices change, before "Save theme" is even clicked.
 */
export function ThemeSettingsEditor({
  themeId,
  onThemeIdChange,
  brandColor,
  onBrandColorChange,
  headingFont,
  onHeadingFontChange,
  bodyFont,
  onBodyFontChange,
  onSave,
}: {
  themeId: string;
  onThemeIdChange: (value: string) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  bodyFont: string;
  onBodyFontChange: (value: string) => void;
  onSave: () => void | Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Theme &amp; brand</h3>
          <p className="text-sm text-muted-foreground">Pick a look and brand color — the preview updates live.</p>
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
        {isSaving ? "Saving…" : "Save theme"}
      </Button>
    </div>
  );
}
