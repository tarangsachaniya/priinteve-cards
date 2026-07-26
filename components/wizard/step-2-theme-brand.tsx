"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { saveThemeSchema } from "@/lib/validations/onboarding";
import { ThemeEditModal } from "@/components/wizard/theme-edit-modal";
import { CardPreviewStub, type CardPreviewData } from "@/components/card/card-preview-stub";

export function Step2ThemeBrand({
  initialThemeId,
  initialBrandColor,
  initialHeadingFont,
  initialBodyFont,
  previewBase,
  onSaved,
}: {
  initialThemeId: string;
  initialBrandColor: string;
  initialHeadingFont: string;
  initialBodyFont: string;
  previewBase: Pick<CardPreviewData, "name" | "slug" | "fields" | "galleryItems">;
  onSaved: (themeId: string, brandColor: string, headingFont: string, bodyFont: string) => void;
}) {
  const [themeId, setThemeId] = useState(initialThemeId);
  const [brandColor, setBrandColor] = useState(initialBrandColor);
  const [headingFont, setHeadingFont] = useState(initialHeadingFont);
  const [bodyFont, setBodyFont] = useState(initialBodyFont);
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
      onSaved(themeId, brandColor, headingFont, bodyFont);
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
            setBrandColor(next.brandColor);
            setHeadingFont(next.headingFont);
            setBodyFont(next.bodyFont);
          }}
        />
      </div>

      <Tabs value={themeId} onValueChange={(v) => v && setThemeId(v)}>
        <TabsList className="!h-auto w-full flex-wrap justify-start gap-1.5">
          {THEME_PRESETS.map((preset) => (
            <TabsTrigger key={preset.id} value={preset.id}>
              {preset.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {THEME_PRESETS.map((preset) => (
          <TabsContent key={preset.id} value={preset.id} className="mt-4">
            <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
              <CardPreviewStub
                data={{
                  ...previewBase,
                  settings: { themeId: preset.id, brandColor, galleryLayout: "grid", vcfIncludePhoto: true, headingFont, bodyFont },
                }}
              />
              <p className="text-sm text-muted-foreground">{preset.description}</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Button type="button" onClick={handleSave} disabled={isSaving} className="self-end">
        {isSaving ? "Saving…" : "Save & Continue"}
      </Button>
    </div>
  );
}
