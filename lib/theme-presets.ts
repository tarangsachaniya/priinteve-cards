export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  layout: "centered" | "split" | "banner" | "minimal";
  spacing: "compact" | "cozy" | "spacious";
  previewClassName: string;
};

/** The only supported card designs. Theme components own their visual layout. */
export const THEME_PRESETS: ThemePreset[] = [
  { id: "original", name: "Original", description: "Photo-first profile with clear contact cards.", fontFamily: "font-sans", layout: "banner", spacing: "cozy", previewClassName: "" },
  { id: "bento", name: "Bento", description: "A modular grid for quick scanning.", fontFamily: "font-sans", layout: "centered", spacing: "cozy", previewClassName: "" },
  { id: "editorial", name: "Editorial", description: "A magazine-inspired spotlight layout.", fontFamily: "font-serif", layout: "minimal", spacing: "spacious", previewClassName: "" },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((theme) => theme.id === id) ?? THEME_PRESETS[0];
}

export const THEME_PRESET_IDS = THEME_PRESETS.map((theme) => theme.id) as [string, ...string[]];
export const FONT_OPTIONS = [
  { id: "font-sans", label: "Sans-serif" },
  { id: "font-serif", label: "Serif" },
  { id: "font-mono", label: "Monospace" },
] as const;
export const FONT_OPTION_IDS = FONT_OPTIONS.map((font) => font.id) as [string, ...string[]];
