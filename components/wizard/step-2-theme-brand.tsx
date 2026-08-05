"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { normalizeCardMode, resolveCardModeForRender, type CardMode } from "@/lib/card-theme";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";
import { ThemePresetCard } from "@/components/wizard/theme-preset-card";
import { CardModePicker } from "@/components/wizard/card-mode-picker";

export function Step2ThemeBrand({
  themeId,
  onThemeIdChange,
  themeMode,
  onThemeModeChange,
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
  themeMode: string;
  onThemeModeChange: (value: CardMode) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  bodyFont: string;
  onBodyFontChange: (value: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const swatchMode = resolveCardModeForRender(normalizeCardMode(themeMode));

  async function handleSave() {
    const parsed = saveThemeSchema.safeParse({ themeId, themeMode, brandColor, headingFont, bodyFont });
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
    <div className="flex flex-col gap-5">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEME_PRESETS.map((preset) => (
          <ThemePresetCard
            key={preset.id}
            preset={preset}
            mode={swatchMode}
            brandColor={brandColor}
            isSelected={themeId === preset.id}
            onSelect={() => onThemeIdChange(preset.id)}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {THEME_PRESETS.find((preset) => preset.id === themeId)?.description}
      </p>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Default appearance</h3>
        <CardModePicker value={themeMode} onChange={onThemeModeChange} />
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
