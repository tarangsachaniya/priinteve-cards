"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import { ThemePresetCard } from "@/components/wizard/theme-preset-card";
import { ColorInput } from "@/components/wizard/color-input";
import { CardPreviewStub, type CardPreviewData } from "@/components/card/card-preview-stub";

export function Step2ThemeBrand({
  initialThemeId,
  initialBrandColor,
  previewBase,
  onSaved,
}: {
  initialThemeId: string;
  initialBrandColor: string;
  previewBase: Pick<CardPreviewData, "name" | "slug" | "fields" | "galleryItems">;
  onSaved: (themeId: string, brandColor: string) => void;
}) {
  const [themeId, setThemeId] = useState(initialThemeId);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const parsed = saveThemeSchema.safeParse({ themeId, brandColor });
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
      onSaved(themeId, brandColor);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Choose a theme & brand color</h2>
          <p className="text-sm text-muted-foreground">Pick a look for your card.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_PRESETS.map((preset) => (
            <ThemePresetCard
              key={preset.id}
              preset={preset}
              isSelected={preset.id === themeId}
              onSelect={() => setThemeId(preset.id)}
            />
          ))}
        </div>

        <ColorInput value={brandColor} onChange={setBrandColor} />

        <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
          {isSaving ? "Saving…" : "Save & Continue"}
        </Button>
      </div>

      <div className="flex-1">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Live preview</p>
        <CardPreviewStub
          data={{
            ...previewBase,
            settings: {
              themeId,
              brandColor,
              galleryLayout: "grid",
              vcfIncludePhoto: true,
            },
          }}
        />
      </div>
    </div>
  );
}
