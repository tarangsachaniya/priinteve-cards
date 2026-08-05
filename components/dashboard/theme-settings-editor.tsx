"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { normalizeCardMode, resolveCardModeForRender, type CardMode } from "@/lib/card-theme";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";
import { ThemePresetCard } from "@/components/wizard/theme-preset-card";
import { CardModePicker } from "@/components/wizard/card-mode-picker";

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
  themeMode,
  onThemeModeChange,
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
  themeMode: string;
  onThemeModeChange: (value: CardMode) => void;
  brandColor: string;
  onBrandColorChange: (value: string) => void;
  headingFont: string;
  onHeadingFontChange: (value: string) => void;
  bodyFont: string;
  onBodyFontChange: (value: string) => void;
  onSave: () => void | Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const swatchMode = resolveCardModeForRender(normalizeCardMode(themeMode));

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-3">
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
        <h4 className="text-sm font-semibold">Default appearance</h4>
        <CardModePicker value={themeMode} onChange={onThemeModeChange} />
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save theme"}
      </Button>
    </div>
  );
}
