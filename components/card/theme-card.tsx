"use client";

import { CardThemeScope } from "@/components/card/card-theme-scope";
import { OriginalTheme } from "@/components/card/themes/original-theme";
import { BentoTheme } from "@/components/card/themes/bento-theme";
import { EditorialTheme } from "@/components/card/themes/editorial-theme";
import {
  normalizeCardMode,
  normalizeCardTheme,
  resolveCardModeForRender,
  type ResolvedCardMode,
} from "@/lib/card-theme";

export type ThemeCardField = {
  fieldType: string;
  label: string;
  value: string;
  order: number;
  isVisible?: boolean;
};
export type ThemeCardGallery = {
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
  caption?: string | null;
  altText?: string | null;
};
export type ThemeCardData = {
  name: string;
  slug: string;
  fields: ThemeCardField[];
  galleryItems: ThemeCardGallery[];
  settings: {
    themeId: string;
    brandColor: string;
    /** Owner's light/dark default: "light" | "dark" | "system". */
    themeMode?: string;
    headingFont?: string;
    bodyFont?: string;
    galleryLayout?: string;
  };
};

const THEMES: Record<string, (props: { data: ThemeCardData }) => JSX.Element> = {
  original: OriginalTheme,
  bento: BentoTheme,
  editorial: EditorialTheme,
};

/**
 * The single renderer behind every card surface — the public /[slug] page, the
 * dashboard builder preview and the setup wizard preview. Fixing it once fixes
 * it everywhere.
 *
 * It dispatches to one of the three PrintEve theme layouts inside a
 * <CardThemeScope>, which is what makes every colour resolve from tokens.
 *
 * `modeOverride` lets a preview show a mode other than the saved one without
 * touching the owner's setting; the public page leaves it unset and lets
 * <CardModeScript> drive the mode from <html>.
 */
export function ThemeCard({
  data,
  className,
  asPage = false,
  modeOverride,
}: {
  data: ThemeCardData;
  className?: string;
  asPage?: boolean;
  modeOverride?: ResolvedCardMode;
}) {
  const themeId = normalizeCardTheme(data.settings.themeId);
  const Theme = THEMES[themeId] ?? OriginalTheme;
  const mode = modeOverride ?? resolveCardModeForRender(normalizeCardMode(data.settings.themeMode));

  return (
    <CardThemeScope
      themeId={themeId}
      mode={mode}
      brandColor={data.settings.brandColor}
      asPage={asPage}
      className={className}
    >
      <Theme data={data} />
    </CardThemeScope>
  );
}
