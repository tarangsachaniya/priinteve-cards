export type ThemePreset = {
  id: string;
  name: string;
  fontFamily: string;
  layout: "centered" | "split" | "banner" | "minimal";
  spacing: "compact" | "cozy" | "spacious";
  previewClassName: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Classic",
    fontFamily: "font-sans",
    layout: "centered",
    spacing: "cozy",
    previewClassName: "items-center text-center gap-3 p-4",
  },
  {
    id: "modern",
    name: "Modern",
    fontFamily: "font-sans",
    layout: "split",
    spacing: "spacious",
    previewClassName: "items-start text-left gap-5 p-6",
  },
  {
    id: "elegant",
    name: "Elegant",
    fontFamily: "font-serif",
    layout: "centered",
    spacing: "spacious",
    previewClassName: "items-center text-center gap-5 p-6",
  },
  {
    id: "bold",
    name: "Bold",
    fontFamily: "font-sans",
    layout: "banner",
    spacing: "compact",
    previewClassName: "items-start text-left gap-2 p-3",
  },
  {
    id: "minimal",
    name: "Minimal",
    fontFamily: "font-sans",
    layout: "minimal",
    spacing: "compact",
    previewClassName: "items-center text-center gap-1.5 p-3",
  },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export const THEME_PRESET_IDS = THEME_PRESETS.map((t) => t.id) as [string, ...string[]];
