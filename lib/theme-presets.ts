export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  layout: "centered" | "split" | "banner" | "minimal";
  spacing: "compact" | "cozy" | "spacious";
  previewClassName: string;
};

/**
 * The only supported card designs. Theme components own their visual layout;
 * every colour comes from the tokens in app/card-theme.css.
 *
 * Names and descriptions follow the design source of truth in `PrintEve/`
 * (options 1a, 1b and 1c in printeve-card-options-web.html).
 */
export const THEME_PRESETS: ThemePreset[] = [
  { id: "original", name: "Original", description: "Photo-first list. A banner with your photo on it, then titled cards for contacts, about and services.", fontFamily: "font-sans", layout: "banner", spacing: "cozy", previewClassName: "" },
  { id: "bento", name: "Bento", description: "Modular tile grid. Contact actions become tappable tiles on soft floating cards — dashboard-like and quick to scan.", fontFamily: "font-sans", layout: "centered", spacing: "cozy", previewClassName: "" },
  { id: "editorial", name: "Editorial", description: "Magazine spotlight. A circular portrait under a soft glow, a large serif name and numbered section markers.", fontFamily: "font-serif", layout: "minimal", spacing: "spacious", previewClassName: "" },
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
